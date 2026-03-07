import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { TROOP_STATS, ENERGY_COSTS } from "../config/game.js";
import type { UnitType } from "../generated/prisma/enums.js";

interface AttackBody {
  defenderId: string;
  troops: {
    INFANTRY?: number;
    ARMOR?: number;
    AIR_FORCE?: number;
    DRONES?: number;
    NAVY?: number;
  };
}

const UNIT_TYPES: UnitType[] = [
  "INFANTRY",
  "ARMOR",
  "AIR_FORCE",
  "DRONES",
  "NAVY",
];

// Rock-paper-scissors unit type advantages
const TYPE_ADVANTAGE: Record<string, string[]> = {
  INFANTRY: ["DRONES"],       // infantry beats drones
  ARMOR: ["INFANTRY"],        // armor beats infantry
  AIR_FORCE: ["ARMOR"],       // air force beats armor
  DRONES: ["AIR_FORCE"],      // drones beat air force
  NAVY: ["ARMOR", "INFANTRY"], // navy beats armor and infantry
};
const ADVANTAGE_MULTIPLIER = 1.3;
const DISADVANTAGE_MULTIPLIER = 0.7;

// Build reverse lookup: what types is each type weak against?
function getTypeWeaknesses(): Record<string, string[]> {
  const weaknesses: Record<string, string[]> = {};
  for (const ut of UNIT_TYPES) weaknesses[ut] = [];
  for (const [attacker, targets] of Object.entries(TYPE_ADVANTAGE)) {
    for (const target of targets) {
      if (!weaknesses[target]) weaknesses[target] = [];
      weaknesses[target].push(attacker);
    }
  }
  return weaknesses;
}

const TYPE_WEAKNESS = getTypeWeaknesses();

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

/**
 * Calculate per-unit-type attack power with matchup bonuses.
 * Each attacker unit type gets a multiplier based on the composition of defender forces.
 */
function calculateMatchupPower(
  attackerTroops: { type: string; count: number }[],
  defenderTroops: { type: string; count: number }[],
): { totalPower: number; matchups: Record<string, { basePower: number; multiplier: number; effectivePower: number }> } {
  const totalDefCount = defenderTroops.reduce((s, t) => s + t.count, 0);
  const matchups: Record<string, { basePower: number; multiplier: number; effectivePower: number }> = {};
  let total = 0;

  for (const atkTroop of attackerTroops) {
    if (atkTroop.count <= 0) continue;
    const stats = TROOP_STATS[atkTroop.type as UnitType];
    if (!stats) continue;

    const basePower = atkTroop.count * stats.atk;
    let multiplier = 1.0;

    if (totalDefCount > 0) {
      // Calculate weighted multiplier based on defender composition
      let weightedMult = 0;
      for (const defTroop of defenderTroops) {
        if (defTroop.count <= 0) continue;
        const defRatio = defTroop.count / totalDefCount;
        const advantages = TYPE_ADVANTAGE[atkTroop.type] || [];
        const weaknesses = TYPE_WEAKNESS[atkTroop.type] || [];

        if (advantages.includes(defTroop.type)) {
          weightedMult += defRatio * ADVANTAGE_MULTIPLIER;
        } else if (weaknesses.includes(defTroop.type)) {
          weightedMult += defRatio * DISADVANTAGE_MULTIPLIER;
        } else {
          weightedMult += defRatio * 1.0;
        }
      }
      multiplier = weightedMult;
    }

    const effectivePower = Math.round(basePower * multiplier);
    matchups[atkTroop.type] = { basePower, multiplier: Math.round(multiplier * 100) / 100, effectivePower };
    total += effectivePower;
  }

  return { totalPower: total, matchups };
}

export async function attackRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // ── Launch an attack ──────────────────────────────────────────────────
  app.post<{ Body: AttackBody }>(
    "/nation/attack",
    async (req, reply) => {
      const { defenderId, troops: requestedTroops } = req.body;

      if (!defenderId) {
        return reply.status(400).send({ error: "defenderId is required" });
      }

      if (!requestedTroops || typeof requestedTroops !== "object") {
        return reply.status(400).send({ error: "troops object is required" });
      }

      // Get active round
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) {
        return reply.status(404).send({ error: "No active round" });
      }

      // Round phase enforcement
      if (round.phase === "GROWTH") {
        return reply.status(400).send({ error: "Attacks are not allowed during the Growth phase" });
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

      // Beginner shield check
      if (defender.shieldUntil && new Date(defender.shieldUntil) > new Date()) {
        return reply.status(400).send({
          error: `Target nation is shielded until ${new Date(defender.shieldUntil).toISOString()}`,
        });
      }

      // Check energy
      if (attacker.energy < ENERGY_COSTS.ATTACK) {
        return reply.status(400).send({
          error: "Not enough energy",
          need: ENERGY_COSTS.ATTACK,
          have: attacker.energy,
        });
      }

      // Validate troop selection
      const forcesSent: Record<string, number> = {};
      let hasTroops = false;
      for (const ut of UNIT_TYPES) {
        const requested = requestedTroops[ut as keyof typeof requestedTroops] ?? 0;
        if (!Number.isInteger(requested) || requested < 0) {
          return reply.status(400).send({ error: `Invalid troop count for ${ut}` });
        }
        const ownedTroop = attacker.troops.find((t) => t.type === ut);
        const owned = ownedTroop?.count ?? 0;
        if (requested > owned) {
          return reply.status(400).send({
            error: `Not enough ${ut}: have ${owned}, requested ${requested}`,
          });
        }
        forcesSent[ut] = requested;
        if (requested > 0) hasTroops = true;
      }

      if (!hasTroops) {
        return reply.status(400).send({ error: "At least one troop type must have count > 0" });
      }

      // Attack cooldown: check most recent attack from this attacker to this defender
      const ATTACK_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
      const lastAttack = await prisma.attack.findFirst({
        where: { attackerId: attacker.id, defenderId: defender.id },
        orderBy: { createdAt: "desc" },
      });
      if (lastAttack) {
        const elapsed = Date.now() - lastAttack.createdAt.getTime();
        if (elapsed < ATTACK_COOLDOWN_MS) {
          const remainingMs = ATTACK_COOLDOWN_MS - elapsed;
          const remainingSec = Math.ceil(remainingMs / 1000);
          return reply.status(429).send({
            error: `Attack cooldown - wait ${remainingSec}s before attacking this nation again`,
            retryAfter: remainingSec,
          });
        }
      }

      // ── Combat resolution ──────────────────────────────────────────────
      // Build selected troop array for attack power calculation
      const selectedTroops = UNIT_TYPES.map((ut) => ({
        type: ut,
        count: forcesSent[ut],
      }));

      // Calculate attack power with unit type matchup bonuses
      const attackMatchup = calculateMatchupPower(selectedTroops, defender.troops);
      const attackPower = attackMatchup.totalPower;

      // Calculate defense power with matchup bonuses (defender vs attacker)
      const defenseMatchup = calculateMatchupPower(defender.troops, selectedTroops);
      let defensePower = defenseMatchup.totalPower > 0
        ? defenseMatchup.totalPower
        : totalPower(defender.troops, "def");

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

      // Calculate per-unit losses (attacker losses from SELECTED troops only)
      const attackerLosses: Record<string, number> = {};
      const defenderLosses: Record<string, number> = {};

      for (const ut of UNIT_TYPES) {
        attackerLosses[ut] = Math.floor(forcesSent[ut] * atkLossRate);
        const defTroop = defender.troops.find((t) => t.type === ut);
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
        // Clamp to non-negative and to defender's actual resources
        lootCash = Math.max(0, Math.min(lootCash, defender.cash));
        lootMaterials = Math.max(0, Math.min(lootMaterials, defender.materials));
      }

      // ── Apply in transaction ───────────────────────────────────────────
      const ops: any[] = [];

      // Deduct attacker energy and add loot
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

      // Attacker troops: deduct sent, then add back survivors (sent - losses)
      for (const ut of UNIT_TYPES) {
        if (forcesSent[ut] > 0) {
          const troop = attacker.troops.find((t) => t.type === ut);
          if (troop) {
            const losses = attackerLosses[ut];
            // Net change: subtract losses only (sent - survivors = losses)
            ops.push(
              prisma.troop.update({
                where: { id: troop.id },
                data: { count: { decrement: losses } },
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
          forcesSent,
          attackerLosses,
          defenderLosses,
          lootCash,
          lootMaterials,
          matchups: {
            attacker: attackMatchup.matchups,
            defender: defenseMatchup.matchups,
          },
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
