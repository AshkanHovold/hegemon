import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { BuildingType } from "../generated/prisma/enums.js";
import {
  BUILDING_BASE_COST,
  BUILDING_TIME_PER_LEVEL,
  ENERGY_COSTS,
  MAX_BUILDING_LEVEL,
} from "../config/game.js";

interface ConstructBody {
  type: string;
}

interface UpgradeParams {
  id: string;
}

/** Compute upgrade cost for a given target level */
function upgradeCost(targetLevel: number) {
  return {
    cash: Math.round(BUILDING_BASE_COST.cash * Math.pow(targetLevel, 1.5)),
    materials: Math.round(
      BUILDING_BASE_COST.materials * Math.pow(targetLevel, 1.5)
    ),
  };
}

/** Build time in ms for a given level */
function buildTime(level: number) {
  return BUILDING_TIME_PER_LEVEL * level;
}

export async function buildingRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // ── Construct a new building ─────────────────────────────────────────
  app.post<{ Body: ConstructBody }>(
    "/nation/buildings/construct",
    async (req, reply) => {
      const { type } = req.body;

      // Validate building type
      if (!type || !(type in BuildingType)) {
        return reply.status(400).send({
          error: "Invalid building type",
          validTypes: Object.keys(BuildingType),
        });
      }
      const btype = type as BuildingType;

      // Get active round
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) {
        return reply.status(404).send({ error: "No active round" });
      }

      // Get nation
      const nation = await prisma.nation.findUnique({
        where: {
          userId_roundId: { userId: req.user!.id, roundId: round.id },
        },
        include: { buildings: true },
      });
      if (!nation) {
        return reply.status(404).send({ error: "No nation in current round" });
      }

      // Check construction queue limit
      const currentlyBuilding = nation.buildings.filter((b) => b.building).length;
      if (currentlyBuilding >= 2) {
        return reply
          .status(400)
          .send({ error: "Max 2 buildings under construction at once" });
      }

      // Check if already has this building type
      const existingBuilding = nation.buildings.find((b) => b.type === btype);
      if (existingBuilding) {
        return reply
          .status(409)
          .send({ error: "You already have this building type. Use upgrade instead." });
      }

      // Cost for level 1
      const cost = upgradeCost(1);

      // Check resources
      if (nation.cash < cost.cash) {
        return reply.status(400).send({
          error: "Not enough cash",
          need: cost.cash,
          have: nation.cash,
        });
      }
      if (nation.materials < cost.materials) {
        return reply.status(400).send({
          error: "Not enough materials",
          need: cost.materials,
          have: nation.materials,
        });
      }
      if (nation.energy < ENERGY_COSTS.BUILD) {
        return reply.status(400).send({
          error: "Not enough energy",
          need: ENERGY_COSTS.BUILD,
          have: nation.energy,
        });
      }

      const now = new Date();
      const buildsAt = new Date(now.getTime() + buildTime(1));

      // Create building and deduct resources in a transaction
      const [building] = await prisma.$transaction([
        prisma.building.create({
          data: {
            nationId: nation.id,
            type: btype,
            level: 1,
            building: true,
            buildsAt,
          },
        }),
        prisma.nation.update({
          where: { id: nation.id },
          data: {
            cash: { decrement: cost.cash },
            materials: { decrement: cost.materials },
            energy: { decrement: ENERGY_COSTS.BUILD },
          },
        }),
      ]);

      return reply.status(201).send({ building, cost, buildsAt });
    }
  );

  // ── Upgrade existing building ────────────────────────────────────────
  app.post<{ Params: UpgradeParams }>(
    "/nation/buildings/:id/upgrade",
    async (req, reply) => {
      // Get active round
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) {
        return reply.status(404).send({ error: "No active round" });
      }

      // Get nation
      const nation = await prisma.nation.findUnique({
        where: {
          userId_roundId: { userId: req.user!.id, roundId: round.id },
        },
        include: { buildings: true },
      });
      if (!nation) {
        return reply.status(404).send({ error: "No nation in current round" });
      }

      // Check construction queue limit
      const currentlyBuilding = nation.buildings.filter((b) => b.building).length;
      if (currentlyBuilding >= 2) {
        return reply
          .status(400)
          .send({ error: "Max 2 buildings under construction at once" });
      }

      // Find the building
      const building = nation.buildings.find((b) => b.id === req.params.id);
      if (!building) {
        return reply.status(404).send({ error: "Building not found" });
      }

      // Check not under construction
      if (building.building) {
        return reply
          .status(409)
          .send({ error: "Building is already under construction" });
      }

      const nextLevel = building.level + 1;

      if (nextLevel > MAX_BUILDING_LEVEL) {
        return reply.status(400).send({
          error: `Building is already at max level (${MAX_BUILDING_LEVEL})`,
        });
      }

      const cost = upgradeCost(nextLevel);

      // Check resources
      if (nation.cash < cost.cash) {
        return reply.status(400).send({
          error: "Not enough cash",
          need: cost.cash,
          have: nation.cash,
        });
      }
      if (nation.materials < cost.materials) {
        return reply.status(400).send({
          error: "Not enough materials",
          need: cost.materials,
          have: nation.materials,
        });
      }
      if (nation.energy < ENERGY_COSTS.BUILD) {
        return reply.status(400).send({
          error: "Not enough energy",
          need: ENERGY_COSTS.BUILD,
          have: nation.energy,
        });
      }

      const now = new Date();
      const buildsAt = new Date(now.getTime() + buildTime(nextLevel));

      // Update building and deduct resources in a transaction
      const [updated] = await prisma.$transaction([
        prisma.building.update({
          where: { id: building.id },
          data: {
            level: nextLevel,
            building: true,
            buildsAt,
          },
        }),
        prisma.nation.update({
          where: { id: nation.id },
          data: {
            cash: { decrement: cost.cash },
            materials: { decrement: cost.materials },
            energy: { decrement: ENERGY_COSTS.BUILD },
          },
        }),
      ]);

      return reply.send({ building: updated, cost, buildsAt });
    }
  );
}
