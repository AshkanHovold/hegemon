import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { CyberOpType } from "../generated/prisma/enums.js";
import { ENERGY_COSTS } from "../config/game.js";

interface LaunchBody {
  type: string;
  targetId: string;
}

/** Cyber op metadata */
const CYBER_OP_INFO: Record<
  string,
  { name: string; cooldownMs: number; desc: string }
> = {
  RECON_SCAN: {
    name: "Recon Scan",
    cooldownMs: 5 * 60_000,
    desc: "Reveal target troop counts and resources",
  },
  NETWORK_INFILTRATION: {
    name: "Network Infiltration",
    cooldownMs: 30 * 60_000,
    desc: "See target's alliance chat for a period",
  },
  SYSTEM_HACK: {
    name: "System Hack",
    cooldownMs: 30 * 60_000,
    desc: "Disable target defenses temporarily",
  },
  DATA_THEFT: {
    name: "Data Theft",
    cooldownMs: 15 * 60_000,
    desc: "Steal tech points from target",
  },
  INFRASTRUCTURE_SABOTAGE: {
    name: "Infrastructure Sabotage",
    cooldownMs: 60 * 60_000,
    desc: "Reduce target energy regen",
  },
  MARKET_MANIPULATION: {
    name: "Market Manipulation",
    cooldownMs: 60 * 60_000,
    desc: "Artificially move commodity prices",
  },
  PROPAGANDA: {
    name: "Propaganda",
    cooldownMs: 45 * 60_000,
    desc: "Reduce target population morale",
  },
  EMP_STRIKE: {
    name: "EMP Strike",
    cooldownMs: 120 * 60_000,
    desc: "Disable all target buildings temporarily",
  },
};

export async function cyberRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // ── Get active cyber ops and defense log ──────────────────────────
  app.get("/nation/cyber", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
    });
    if (!nation) return reply.status(404).send({ error: "No nation" });

    // Active ops launched by this nation (not yet expired)
    const activeOps = await prisma.cyberOp.findMany({
      where: {
        attackerId: nation.id,
        expiresAt: { gt: new Date() },
      },
      include: { defender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Recent defense log (ops against this nation)
    const defenseLog = await prisma.cyberOp.findMany({
      where: { defenderId: nation.id },
      include: { attacker: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return reply.send({ activeOps, defenseLog });
  });

  // ── Launch a cyber operation ──────────────────────────────────────
  app.post<{ Body: LaunchBody }>("/nation/cyber/launch", async (req, reply) => {
    const { type, targetId } = req.body;

    if (!type || !(type in CyberOpType)) {
      return reply.status(400).send({ error: "Invalid cyber op type" });
    }
    if (!targetId) {
      return reply.status(400).send({ error: "Target nation ID required" });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { buildings: true },
    });
    if (!nation) return reply.status(404).send({ error: "No nation" });

    // Check energy
    const energyCost =
      ENERGY_COSTS.CYBER_OP[type as keyof typeof ENERGY_COSTS.CYBER_OP];
    if (!energyCost) {
      return reply.status(400).send({ error: "Unknown energy cost for op" });
    }
    if (nation.energy < energyCost) {
      return reply
        .status(400)
        .send({ error: "Not enough energy", need: energyCost, have: nation.energy });
    }

    // Check target exists and isn't self
    const target = await prisma.nation.findUnique({
      where: { id: targetId },
    });
    if (!target || target.roundId !== round.id) {
      return reply.status(404).send({ error: "Target nation not found" });
    }
    if (target.id === nation.id) {
      return reply.status(400).send({ error: "Cannot target yourself" });
    }

    // Check if cyber center is built
    const cyberCenter = nation.buildings.find((b) => b.type === "CYBER_CENTER");
    if (!cyberCenter) {
      return reply
        .status(400)
        .send({ error: "You need a Cyber Center to launch operations" });
    }

    // Check cooldown (most recent op of same type)
    const info = CYBER_OP_INFO[type];
    if (info) {
      const lastOp = await prisma.cyberOp.findFirst({
        where: {
          attackerId: nation.id,
          type: type as CyberOpType,
        },
        orderBy: { createdAt: "desc" },
      });
      if (
        lastOp &&
        Date.now() - lastOp.createdAt.getTime() < info.cooldownMs
      ) {
        const readyAt = new Date(
          lastOp.createdAt.getTime() + info.cooldownMs
        );
        return reply.status(429).send({
          error: "Operation on cooldown",
          readyAt: readyAt.toISOString(),
        });
      }
    }

    // Determine success: base 60% + cyber center level * 5%, capped at 95%
    const successChance = Math.min(0.6 + cyberCenter.level * 0.05, 0.95);
    // Target's firewall reduces success
    const targetBuildings = await prisma.building.findMany({
      where: { nationId: target.id },
    });
    const firewall = targetBuildings.find((b) => b.type === "FIREWALL_ARRAY");
    const firewallReduction = firewall ? firewall.level * 0.05 : 0;
    const finalChance = Math.max(successChance - firewallReduction, 0.1);
    const success = Math.random() < finalChance;

    // Apply effects on success
    let result: Record<string, unknown> = { success, chance: finalChance };
    const expiresAt = info
      ? new Date(Date.now() + info.cooldownMs)
      : null;

    if (success) {
      switch (type) {
        case "RECON_SCAN":
          result = {
            ...result,
            targetName: target.name,
            cash: target.cash,
            materials: target.materials,
            techPoints: target.techPoints,
            population: target.population,
            military: target.military,
          };
          break;
        case "DATA_THEFT": {
          const stolen = Math.min(
            Math.floor(target.techPoints * 0.1),
            50 * cyberCenter.level
          );
          await prisma.$transaction([
            prisma.nation.update({
              where: { id: target.id },
              data: { techPoints: { decrement: stolen } },
            }),
            prisma.nation.update({
              where: { id: nation.id },
              data: { techPoints: { increment: stolen } },
            }),
          ]);
          result = { ...result, stolen };
          break;
        }
        case "EMP_STRIKE": {
          const drained = Math.floor(target.energy * 0.5);
          await prisma.nation.update({
            where: { id: target.id },
            data: { energy: { decrement: drained } },
          });
          result = { ...result, drained };
          break;
        }
        // Other ops store the effect for tick processing
        default:
          result = { ...result, effect: type };
      }
    }

    // Create op record and deduct energy
    const [op] = await prisma.$transaction([
      prisma.cyberOp.create({
        data: {
          attackerId: nation.id,
          defenderId: target.id,
          type: type as CyberOpType,
          energyCost,
          success,
          result: result as object,
          expiresAt,
        },
      }),
      prisma.nation.update({
        where: { id: nation.id },
        data: { energy: { decrement: energyCost } },
      }),
    ]);

    return reply.status(201).send({ op, result });
  });
}
