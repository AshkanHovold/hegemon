import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { UnitType } from "../generated/prisma/enums.js";
import { TROOP_STATS, ENERGY_COSTS } from "../config/game.js";

interface TrainBody {
  type: string;
  count: number;
}

export async function troopRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  app.post<{ Body: TrainBody }>(
    "/nation/troops/train",
    async (req, reply) => {
      const { type, count } = req.body;

      // Validate unit type
      if (!type || !(type in UnitType)) {
        return reply.status(400).send({
          error: "Invalid unit type",
          validTypes: Object.keys(UnitType),
        });
      }
      const utype = type as UnitType;

      // Validate count
      if (!count || count < 1 || !Number.isInteger(count)) {
        return reply
          .status(400)
          .send({ error: "Count must be a positive integer" });
      }
      if (count > 1000) {
        return reply
          .status(400)
          .send({ error: "Max 1000 troops per batch" });
      }

      // Get active round
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) {
        return reply.status(404).send({ error: "No active round" });
      }

      // Get nation with troops
      const nation = await prisma.nation.findUnique({
        where: {
          userId_roundId: { userId: req.user!.id, roundId: round.id },
        },
        include: { troops: true, buildings: true },
      });
      if (!nation) {
        return reply.status(404).send({ error: "No nation in current round" });
      }

      const stats = TROOP_STATS[utype];

      // Total cost
      const totalCash = stats.costCash * count;
      const totalMaterials = stats.costMaterials * count;

      // Check resources
      if (nation.cash < totalCash) {
        return reply.status(400).send({
          error: "Not enough cash",
          need: totalCash,
          have: nation.cash,
        });
      }
      if (nation.materials < totalMaterials) {
        return reply.status(400).send({
          error: "Not enough materials",
          need: totalMaterials,
          have: nation.materials,
        });
      }
      // Energy scales with count: base cost + 1 per 10 troops
      const energyCost = ENERGY_COSTS.TRAIN + Math.floor(count / 10);
      if (nation.energy < energyCost) {
        return reply.status(400).send({
          error: "Not enough energy",
          need: energyCost,
          have: nation.energy,
        });
      }

      // Check military population availability
      // Current troops in service + troops training = committed military pop
      const committedMilitary = nation.troops.reduce(
        (sum, t) => sum + t.count + t.training,
        0
      );
      const availableMilitary = nation.military - committedMilitary;

      if (count > availableMilitary) {
        return reply.status(400).send({
          error: "Not enough available military population",
          need: count,
          available: availableMilitary,
        });
      }

      // Find or create troop record
      let troop = nation.troops.find((t) => t.type === utype);

      // Check if already training
      if (troop && troop.training > 0) {
        return reply
          .status(409)
          .send({ error: "Already training this unit type. Wait for completion." });
      }

      // Calculate training time — barracks bonus
      const barracks = nation.buildings.find((b) => b.type === "BARRACKS" && !b.building);
      const barracksLevel = barracks ? barracks.level : 0;
      const speedMultiplier = 1 - barracksLevel * 0.1; // 10% faster per level, minimum factor 0.1
      const effectiveSpeed = Math.max(0.1, speedMultiplier);
      const trainTimeMs = Math.round(stats.trainTimeMs * count * effectiveSpeed);

      const now = new Date();
      const trainsAt = new Date(now.getTime() + trainTimeMs);

      if (troop) {
        // Update existing troop record
        const [updated] = await prisma.$transaction([
          prisma.troop.update({
            where: { id: troop.id },
            data: {
              training: { increment: count },
              trainsAt,
            },
          }),
          prisma.nation.update({
            where: { id: nation.id },
            data: {
              cash: { decrement: totalCash },
              materials: { decrement: totalMaterials },
              energy: { decrement: energyCost },
            },
          }),
        ]);

        return reply.send({ troop: updated, cost: { cash: totalCash, materials: totalMaterials }, trainsAt });
      } else {
        // Create new troop record
        const [created] = await prisma.$transaction([
          prisma.troop.create({
            data: {
              nationId: nation.id,
              type: utype,
              count: 0,
              training: count,
              trainsAt,
            },
          }),
          prisma.nation.update({
            where: { id: nation.id },
            data: {
              cash: { decrement: totalCash },
              materials: { decrement: totalMaterials },
              energy: { decrement: energyCost },
            },
          }),
        ]);

        return reply.status(201).send({ troop: created, cost: { cash: totalCash, materials: totalMaterials }, trainsAt });
      }
    }
  );
}
