import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { TROOP_STATS, ENERGY_COSTS } from "../config/game.js";
import type { UnitType } from "../generated/prisma/enums.js";

interface AttackBody {
  defenderId: string;
}

const UNIT_TYPES: UnitType[] = [
  "INFANTRY",
  "ARMOR",
  "AIR_FORCE",
  "DRONES",
  "NAVY",
];

/** Compute total ATK or DEF power for a set of troop counts */
function totalPower(
  troops: { type: string; count: number }[],
  stat: "atk" | "def",
): number {
  return troops.reduce((sum, t) => {
    const s = TROOP_STATS[t.type as UnitType];
    return sum + t.count * (s?.[stat] ?? 0);
  }, 0);
}

export async function attackRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // ── Launch an attack ──────────────────────────────────────────────────
  app.post<{ Body: AttackBody }>(
    "/nation/attack",
    async (req, reply) => {
      const { defenderId } = req.body;

      if (!defenderId) {
        return reply.status(400).send({ error: "defenderId is required" });
      }

      // Get active round
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) {
        return reply.status(404).send({ error: "No active round" });
      }

      // Get attacker nation
      const attacker = await prisma.nation.findUnique({
        where: {
          userId_roundId: { userId: req.user!.id, roundId: round.id },
        },
        include: { troops: true, buildings: true },
      });
      if (!attacker) {
        return reply.status(404).send({ error: "No nation in current round" });
      }

      // Can't attack yourself
      if (attacker.id === defenderId) {
        return reply.status(400).send({ error: "You cannot attack yourself" });
      }

      // Get defender nation
      const defender = await prisma.nation.findUnique({
        where: { id: defenderId },
        include: { troops: true, buildings: true },
      });
      if (!defender) {
        return reply.status(404).send({ error: "Target nation not found" });
      }
      if (defender.roundId !== round.id) {
        return reply
          .status(400)
          .send({ error: "Target nation is not in the active round" });
      }

      // Check energy
      if (attacker.energy < ENERGY_COSTS.ATTACK) {
        return reply.status(400).send({
          error: "Not enough energy",
          need: ENERGY_COSTS.ATTACK,
          have: attacker.energy,
        });
      }

      // Check attacker has any troops
      const atkTroops = attacker.troops.filter((t) => t.count > 0);
      if (atkTroops.length === 0) {
        return reply.status(400).send({ error: "You have no troops to attack with" });
      }

      // ── Combat resolution ──────────────────────────────────────────────
      const attackPower = totalPower(attacker.troops, "atk");
      let defensePower = totalPower(defender.troops, "def");

      // Fortification bonus from MISSILE_DEFENSE
      const missileDef = defender.buildings.find(
        (b) => b.type === "MISSILE_DEFENSE" && !b.building,
      );
      const fortBonus = missileDef ? missileDef.level * 0.05 : 0;
      defensePower = Math.round(defensePower * (1 + fortBonus));

      // Combat ratio with some randomness (+-15%)
      const randomFactor = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
      const effectiveAtk = attackPower * randomFactor;

      const attackerWon = effectiveAtk > defensePower;

      // Calculate losses — loser takes heavier casualties
      // Winner loses 10-20% of troops, loser loses 30-50%
      const winnerLossRate = 0.1 + Math.random() * 0.1;
      const loserLossRate = 0.3 + Math.random() * 0.2;

      const atkLossRate = attackerWon ? winnerLossRate : loserLossRate;
      const defLossRate = attackerWon ? loserLossRate : winnerLossRate;

      // Calculate per-unit losses
      const attackerLosses: Record<string, number> = {};
      const defenderLosses: Record<string, number> = {};

      for (const ut of UNIT_TYPES) {
        const atkTroop = attacker.troops.find((t) => t.type === ut);
        const defTroop = defender.troops.find((t) => t.type === ut);
        attackerLosses[ut] = atkTroop
          ? Math.floor(atkTroop.count * atkLossRate)
          : 0;
        defenderLosses[ut] = defTroop
          ? Math.floor(defTroop.count * defLossRate)
          : 0;
      }

      // Loot: winner steals 5-15% of defender's cash and materials
      let lootCash = 0;
      let lootMaterials = 0;
      if (attackerWon) {
        const lootRate = 0.05 + Math.random() * 0.1;
        lootCash = Math.floor(defender.cash * lootRate);
        lootMaterials = Math.floor(defender.materials * lootRate);
      }

      // Record forces sent
      const forcesSent: Record<string, number> = {};
      for (const ut of UNIT_TYPES) {
        const troop = attacker.troops.find((t) => t.type === ut);
        forcesSent[ut] = troop?.count ?? 0;
      }

      // ── Apply in transaction ───────────────────────────────────────────
      const ops: any[] = [];

      // Deduct attacker energy
      ops.push(
        prisma.nation.update({
          where: { id: attacker.id },
          data: {
            energy: { decrement: ENERGY_COSTS.ATTACK },
            cash: attackerWon ? { increment: lootCash } : undefined,
            materials: attackerWon ? { increment: lootMaterials } : undefined,
          },
        }),
      );

      // Deduct defender resources if looted
      if (attackerWon && (lootCash > 0 || lootMaterials > 0)) {
        ops.push(
          prisma.nation.update({
            where: { id: defender.id },
            data: {
              cash: { decrement: lootCash },
              materials: { decrement: lootMaterials },
            },
          }),
        );
      }

      // Apply troop losses for attacker
      for (const ut of UNIT_TYPES) {
        if (attackerLosses[ut] > 0) {
          const troop = attacker.troops.find((t) => t.type === ut);
          if (troop) {
            ops.push(
              prisma.troop.update({
                where: { id: troop.id },
                data: { count: { decrement: attackerLosses[ut] } },
              }),
            );
          }
        }
      }

      // Apply troop losses for defender
      for (const ut of UNIT_TYPES) {
        if (defenderLosses[ut] > 0) {
          const troop = defender.troops.find((t) => t.type === ut);
          if (troop) {
            ops.push(
              prisma.troop.update({
                where: { id: troop.id },
                data: { count: { decrement: defenderLosses[ut] } },
              }),
            );
          }
        }
      }

      // Create attack record (instantly resolved)
      ops.push(
        prisma.attack.create({
          data: {
            attackerId: attacker.id,
            defenderId: defender.id,
            infantry: forcesSent["INFANTRY"] ?? 0,
            armor: forcesSent["ARMOR"] ?? 0,
            airForce: forcesSent["AIR_FORCE"] ?? 0,
            drones: forcesSent["DRONES"] ?? 0,
            navy: forcesSent["NAVY"] ?? 0,
            resolved: true,
            attackerWon,
            attackerLosses,
            defenderLosses,
            lootCash,
            lootMaterials,
            resolvesAt: new Date(),
          },
        }),
      );

      const results = await prisma.$transaction(ops);
      const attackRecord = results[results.length - 1];

      return reply.status(201).send({
        attack: {
          id: attackRecord.id,
          attackerWon,
          attackPower: Math.round(effectiveAtk),
          defensePower,
          attackerLosses,
          defenderLosses,
          lootCash,
          lootMaterials,
        },
        defender: {
          name: defender.name,
        },
      });
    },
  );

  // ── Get attack history ────────────────────────────────────────────────
  app.get("/nation/attacks", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) {
      return reply.status(404).send({ error: "No active round" });
    }

    const nation = await prisma.nation.findUnique({
      where: {
        userId_roundId: { userId: req.user!.id, roundId: round.id },
      },
    });
    if (!nation) {
      return reply.status(404).send({ error: "No nation in current round" });
    }

    const attacks = await prisma.attack.findMany({
      where: {
        OR: [{ attackerId: nation.id }, { defenderId: nation.id }],
        resolved: true,
      },
      include: {
        attacker: { select: { id: true, name: true } },
        defender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return reply.send({
      attacks: attacks.map((a) => ({
        id: a.id,
        isAttacker: a.attackerId === nation.id,
        attacker: a.attacker,
        defender: a.defender,
        attackerWon: a.attackerWon,
        attackerLosses: a.attackerLosses,
        defenderLosses: a.defenderLosses,
        lootCash: a.lootCash,
        lootMaterials: a.lootMaterials,
        createdAt: a.createdAt,
      })),
      nationId: nation.id,
    });
  });
}
