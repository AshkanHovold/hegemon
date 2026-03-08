import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const ACHIEVEMENT_DEFINITIONS = {
  FIRST_BUILD: {
    title: "First Steps",
    desc: "Upgrade a building for the first time",
  },
  FIRST_ARMY: {
    title: "Mustering Forces",
    desc: "Train your first troops",
  },
  FIRST_BLOOD: {
    title: "First Blood",
    desc: "Win your first attack",
  },
  DEFENDER: {
    title: "Defender",
    desc: "Successfully defend against an attack",
  },
  TYCOON: {
    title: "Tycoon",
    desc: "Accumulate 100,000 cash",
  },
  INDUSTRIALIST: {
    title: "Industrialist",
    desc: "Accumulate 50,000 materials",
  },
  ARCHITECT: {
    title: "Architect",
    desc: "Build all 11 building types",
  },
  FORTIFIED: {
    title: "Fortified",
    desc: "Reach max level on any building",
  },
  WARLORD: {
    title: "Warlord",
    desc: "Win 10 attacks",
  },
  SPY_MASTER: {
    title: "Spy Master",
    desc: "Launch all 8 cyber op types",
  },
  TRADER: {
    title: "Trader",
    desc: "Complete 10 market trades",
  },
  ALLIANCE_FOUNDER: {
    title: "Alliance Founder",
    desc: "Create an alliance",
  },
  TOP_10: {
    title: "Top 10",
    desc: "Reach top 10 in rankings",
  },
  MILLION: {
    title: "Millionaire",
    desc: "Accumulate 1,000,000 total cash earned",
  },
} as const;

type AchievementType = keyof typeof ACHIEVEMENT_DEFINITIONS;

export async function achievementRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // GET /nation/achievements - list all achievements for current nation
  app.get("/nation/achievements", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const achievements = await prisma.achievement.findMany({
      where: { nationId: nation.id },
      orderBy: { unlockedAt: "desc" },
    });

    // Return all definitions with unlocked status
    const result = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => {
      const unlocked = achievements.find((a) => a.type === type);
      return {
        type,
        title: def.title,
        desc: def.desc,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt ?? null,
      };
    });

    return reply.send({ achievements: result });
  });

  // POST /nation/achievements/check - check and unlock any new achievements
  app.post("/nation/achievements/check", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: {
        buildings: true,
        troops: true,
        allianceMembership: true,
        achievements: true,
      },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const existing = new Set(nation.achievements.map((a) => a.type));
    const newlyUnlocked: string[] = [];

    function tryUnlock(type: AchievementType, condition: boolean) {
      if (!existing.has(type) && condition) {
        newlyUnlocked.push(type);
      }
    }

    // FIRST_BUILD: any building level > 1
    const hasUpgradedBuilding = nation.buildings.some((b) => b.level > 1);
    tryUnlock("FIRST_BUILD", hasUpgradedBuilding);

    // FIRST_ARMY: total troops > initial 100
    const totalTroops = nation.troops.reduce((sum, t) => sum + t.count, 0);
    tryUnlock("FIRST_ARMY", totalTroops > 100);

    // FIRST_BLOOD: any attack where attackerWon=true
    const wonAttack = await prisma.attack.findFirst({
      where: { attackerId: nation.id, attackerWon: true },
    });
    tryUnlock("FIRST_BLOOD", !!wonAttack);

    // DEFENDER: any attack where you're defender and attackerWon=false
    const defendedAttack = await prisma.attack.findFirst({
      where: { defenderId: nation.id, attackerWon: false },
    });
    tryUnlock("DEFENDER", !!defendedAttack);

    // TYCOON: cash >= 100000
    tryUnlock("TYCOON", nation.cash >= 100000);

    // INDUSTRIALIST: materials >= 50000
    tryUnlock("INDUSTRIALIST", nation.materials >= 50000);

    // ARCHITECT: 11 distinct building types
    const distinctBuildingTypes = new Set(nation.buildings.map((b) => b.type));
    tryUnlock("ARCHITECT", distinctBuildingTypes.size >= 11);

    // FORTIFIED: any building level >= 20
    const hasMaxBuilding = nation.buildings.some((b) => b.level >= 20);
    tryUnlock("FORTIFIED", hasMaxBuilding);

    // WARLORD: count attacks where attackerWon=true >= 10
    const wonAttacksCount = await prisma.attack.count({
      where: { attackerId: nation.id, attackerWon: true },
    });
    tryUnlock("WARLORD", wonAttacksCount >= 10);

    // SPY_MASTER: 8 distinct cyber op types launched
    const distinctOps = await prisma.cyberOp.findMany({
      where: { attackerId: nation.id },
      distinct: ["type"],
      select: { type: true },
    });
    tryUnlock("SPY_MASTER", distinctOps.length >= 8);

    // TRADER: filled orders >= 10
    const filledOrders = await prisma.marketOrder.count({
      where: {
        nationId: nation.id,
        status: "FILLED",
      },
    });
    tryUnlock("TRADER", filledOrders >= 10);

    // ALLIANCE_FOUNDER: has alliance with role PRESIDENT
    tryUnlock(
      "ALLIANCE_FOUNDER",
      nation.allianceMembership?.role === "PRESIDENT"
    );

    // TOP_10: rank <= 10 (compute from rankings)
    const allNations = await prisma.nation.findMany({
      where: { roundId: round.id },
      select: { id: true, cash: true, materials: true, techPoints: true, troops: { select: { type: true, count: true } } },
    });
    // Simple score: cash + materials * 10 + techPoints * 20
    const scores = allNations
      .map((n) => ({
        id: n.id,
        score: n.cash + n.materials * 10 + n.techPoints * 20,
      }))
      .sort((a, b) => b.score - a.score);
    const rank = scores.findIndex((s) => s.id === nation.id) + 1;
    tryUnlock("TOP_10", rank > 0 && rank <= 10);

    // MILLION: cash >= 1000000
    tryUnlock("MILLION", nation.cash >= 1000000);

    // Batch create all newly unlocked achievements
    if (newlyUnlocked.length > 0) {
      await prisma.achievement.createMany({
        data: newlyUnlocked.map((type) => ({
          nationId: nation.id,
          type,
        })),
      });
    }

    return reply.send({
      newlyUnlocked: newlyUnlocked.map((type) => ({
        type,
        ...ACHIEVEMENT_DEFINITIONS[type as AchievementType],
      })),
    });
  });
}
