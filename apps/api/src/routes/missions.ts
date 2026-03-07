import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const MISSION_DEFINITIONS = {
  UPGRADE_COMMERCIAL: {
    title: "Boost Your Economy",
    desc: "Upgrade Commercial to Level 3",
    target: 3,
    rewardCash: 5000,
    rewardMaterials: 0,
  },
  BUILD_BARRACKS: {
    title: "Prepare for War",
    desc: "Construct a Barracks",
    target: 1,
    rewardCash: 2000,
    rewardMaterials: 1000,
  },
  TRAIN_TROOPS: {
    title: "Raise an Army",
    desc: "Train 200 troops total",
    target: 200,
    rewardCash: 3000,
    rewardMaterials: 0,
  },
  BUILD_CYBER: {
    title: "Enter the Digital Age",
    desc: "Construct a Cyber Center",
    target: 1,
    rewardCash: 2000,
    rewardMaterials: 0,
  },
  FIRST_TRADE: {
    title: "Open Markets",
    desc: "Place your first market order",
    target: 1,
    rewardCash: 1000,
    rewardMaterials: 500,
  },
  UPGRADE_FARM: {
    title: "Feed Your People",
    desc: "Upgrade Farm to Level 3",
    target: 3,
    rewardCash: 3000,
    rewardMaterials: 0,
  },
} as const;

type MissionType = keyof typeof MISSION_DEFINITIONS;

export async function missionRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // GET /nation/missions - get active missions
  app.get("/nation/missions", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const missions = await prisma.mission.findMany({
      where: { nationId: nation.id },
      orderBy: { createdAt: "asc" },
    });

    const result = missions.map((m) => {
      const def = MISSION_DEFINITIONS[m.type as MissionType];
      return {
        id: m.id,
        type: m.type,
        title: def?.title ?? m.type,
        desc: def?.desc ?? "",
        progress: m.progress,
        target: m.target,
        rewardCash: m.rewardCash,
        rewardMaterials: m.rewardMaterials,
        completed: m.completed,
        completedAt: m.completedAt,
      };
    });

    return reply.send({ missions: result });
  });

  // POST /nation/missions/init - initialize missions for a new nation
  app.post("/nation/missions/init", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    // Check if missions already initialized
    const existingCount = await prisma.mission.count({
      where: { nationId: nation.id },
    });
    if (existingCount > 0) {
      return reply.status(400).send({ error: "Missions already initialized" });
    }

    const missionData = Object.entries(MISSION_DEFINITIONS).map(([type, def]) => ({
      nationId: nation.id,
      type,
      target: def.target,
      rewardCash: def.rewardCash,
      rewardMaterials: def.rewardMaterials,
    }));

    await prisma.mission.createMany({ data: missionData });

    const missions = await prisma.mission.findMany({
      where: { nationId: nation.id },
      orderBy: { createdAt: "asc" },
    });

    return reply.status(201).send({ missions });
  });

  // POST /nation/missions/check - check and update mission progress
  app.post("/nation/missions/check", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: {
        buildings: true,
        troops: true,
        missions: true,
      },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const updated: string[] = [];

    for (const mission of nation.missions) {
      if (mission.completed) continue;

      let progress = 0;

      switch (mission.type as MissionType) {
        case "UPGRADE_COMMERCIAL": {
          const commercial = nation.buildings.find((b) => b.type === "COMMERCIAL");
          progress = commercial?.level ?? 0;
          break;
        }
        case "BUILD_BARRACKS": {
          const barracks = nation.buildings.find((b) => b.type === "BARRACKS");
          progress = barracks ? 1 : 0;
          break;
        }
        case "TRAIN_TROOPS": {
          const totalTroops = nation.troops.reduce((sum, t) => sum + t.count, 0);
          progress = totalTroops;
          break;
        }
        case "BUILD_CYBER": {
          const cyber = nation.buildings.find((b) => b.type === "CYBER_CENTER");
          progress = cyber ? 1 : 0;
          break;
        }
        case "FIRST_TRADE": {
          const orderCount = await prisma.marketOrder.count({
            where: { nationId: nation.id },
          });
          progress = orderCount;
          break;
        }
        case "UPGRADE_FARM": {
          const farm = nation.buildings.find((b) => b.type === "FARM");
          progress = farm?.level ?? 0;
          break;
        }
      }

      // Clamp progress to target
      progress = Math.min(progress, mission.target);

      if (progress !== mission.progress) {
        const completed = progress >= mission.target;
        await prisma.mission.update({
          where: { id: mission.id },
          data: {
            progress,
            completed,
            completedAt: completed ? new Date() : null,
          },
        });
        updated.push(mission.type);
      }
    }

    // Re-fetch missions after updates
    const missions = await prisma.mission.findMany({
      where: { nationId: nation.id },
      orderBy: { createdAt: "asc" },
    });

    const result = missions.map((m) => {
      const def = MISSION_DEFINITIONS[m.type as MissionType];
      return {
        id: m.id,
        type: m.type,
        title: def?.title ?? m.type,
        desc: def?.desc ?? "",
        progress: m.progress,
        target: m.target,
        rewardCash: m.rewardCash,
        rewardMaterials: m.rewardMaterials,
        completed: m.completed,
        completedAt: m.completedAt,
      };
    });

    return reply.send({ missions: result, updated });
  });

  // POST /nation/missions/claim/:id - claim completed mission reward
  app.post<{ Params: { id: string } }>(
    "/nation/missions/claim/:id",
    async (req, reply) => {
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) return reply.status(404).send({ error: "No active round" });

      const nation = await prisma.nation.findUnique({
        where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      });
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });

      const mission = await prisma.mission.findUnique({
        where: { id: req.params.id },
      });

      if (!mission) return reply.status(404).send({ error: "Mission not found" });
      if (mission.nationId !== nation.id) {
        return reply.status(403).send({ error: "Not your mission" });
      }
      if (!mission.completed) {
        return reply.status(400).send({ error: "Mission not yet completed" });
      }
      if (mission.progress >= mission.target && mission.completedAt) {
        // Check if rewards were already claimed by seeing if completedAt is very old
        // Actually, we need a "claimed" flag. Let's use a convention: once claimed, set progress to -1
        if (mission.progress < 0) {
          return reply.status(400).send({ error: "Rewards already claimed" });
        }
      }

      // Grant rewards
      const updateData: Record<string, unknown> = {};
      if (mission.rewardCash > 0) {
        updateData.cash = { increment: mission.rewardCash };
      }
      if (mission.rewardMaterials > 0) {
        updateData.materials = { increment: mission.rewardMaterials };
      }

      await prisma.$transaction([
        prisma.nation.update({
          where: { id: nation.id },
          data: updateData,
        }),
        // Mark as claimed by setting progress to -1
        prisma.mission.update({
          where: { id: mission.id },
          data: { progress: -1 },
        }),
      ]);

      return reply.send({
        claimed: true,
        rewards: {
          cash: mission.rewardCash,
          materials: mission.rewardMaterials,
        },
      });
    }
  );
}
