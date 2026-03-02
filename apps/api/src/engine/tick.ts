import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import {
  BUILDING_PRODUCTION,
  TICK_INTERVAL_MS,
  POP_GROWTH_BASE,
  FOOD_PER_POP,
} from "../config/game.js";
import type { BuildingType } from "../generated/prisma/enums.js";

/**
 * Process a single game tick for all nations in the active round.
 *
 * Steps per nation:
 *   1. Resource production from buildings
 *   2. Energy regeneration (capped at energyCap)
 *   3. Population growth (if food surplus)
 *   4. Food consumption (starvation if deficit)
 *   5. Construction completion
 *   6. Training completion
 */
export async function processTick(): Promise<{ processed: number }> {
  const round = await prisma.round.findFirst({ where: { active: true } });
  if (!round) {
    return { processed: 0 };
  }

  const nations = await prisma.nation.findMany({
    where: { roundId: round.id },
    include: {
      buildings: true,
      troops: true,
    },
  });

  const now = new Date();

  // Build all the update operations, then execute them all in a transaction
  const operations: ReturnType<typeof prisma.nation.update>[] = [];
  const buildingOps: ReturnType<typeof prisma.building.update>[] = [];
  const troopOps: ReturnType<typeof prisma.troop.update>[] = [];

  for (const nation of nations) {
    // ── 1. Resource production from completed buildings ──────────────
    let cashProd = 0;
    let materialsProd = 0;
    let techProd = 0;
    let foodProd = 0;
    let energyCapBonus = 0;
    let energyRegenBonus = 0;
    let residentialLevel = 0;

    for (const b of nation.buildings) {
      // Only completed buildings produce
      if (b.building) continue;

      const btype = b.type as BuildingType;

      switch (btype) {
        case "COMMERCIAL":
          cashProd += BUILDING_PRODUCTION.COMMERCIAL.cash * b.level;
          break;
        case "FACTORY":
          materialsProd += BUILDING_PRODUCTION.FACTORY.materials * b.level;
          break;
        case "RESEARCH_LAB":
          techProd += BUILDING_PRODUCTION.RESEARCH_LAB.techPoints * b.level;
          break;
        case "FARM":
          foodProd += BUILDING_PRODUCTION.FARM.food * b.level;
          break;
        case "POWER_PLANT":
          energyCapBonus +=
            BUILDING_PRODUCTION.POWER_PLANT.energyCap * b.level;
          energyRegenBonus +=
            BUILDING_PRODUCTION.POWER_PLANT.energyRegen * b.level;
          break;
        case "RESIDENTIAL":
          residentialLevel += b.level;
          break;
      }
    }

    // ── 2. Energy regen ─────────────────────────────────────────────
    // Base energy cap is 100 + bonus from power plants
    const totalEnergyCap = 100 + energyCapBonus;
    // Base regen is 2 + bonus from power plants
    const totalEnergyRegen = 2 + energyRegenBonus;
    const newEnergy = Math.min(
      nation.energy + totalEnergyRegen,
      totalEnergyCap
    );

    // ── 3. Population growth ────────────────────────────────────────
    const totalPopulation = nation.population;
    const foodConsumed = FOOD_PER_POP * totalPopulation;
    const currentFood = nation.food + foodProd;
    const foodAfterConsumption = currentFood - foodConsumed;

    let newPopulation = totalPopulation;
    let newCivilians = nation.civilians;
    let newMilitary = nation.military;
    let newFood: number;

    if (foodAfterConsumption >= 0) {
      // Surplus: grow population
      const popGrowth = POP_GROWTH_BASE * Math.max(residentialLevel, 1);
      // Residential provides pop *capacity* — but we also use it as growth multiplier
      const popCap = 1000 + residentialLevel * BUILDING_PRODUCTION.RESIDENTIAL.population * 20;
      newPopulation = Math.min(totalPopulation + popGrowth, popCap);
      const added = newPopulation - totalPopulation;

      // Split growth: 80% civilian, 20% military
      const civGrowth = Math.round(added * 0.8);
      const milGrowth = added - civGrowth;
      newCivilians = nation.civilians + civGrowth;
      newMilitary = nation.military + milGrowth;
      newFood = foodAfterConsumption;
    } else {
      // ── 4. Starvation ─────────────────────────────────────────────
      // Lose population proportional to food deficit
      const deficit = Math.abs(foodAfterConsumption);
      const popLoss = Math.min(
        Math.ceil(deficit / FOOD_PER_POP),
        Math.floor(totalPopulation * 0.1) // cap loss at 10% per tick
      );
      newPopulation = Math.max(totalPopulation - popLoss, 100); // never go below 100
      const actualLoss = totalPopulation - newPopulation;

      // Split losses proportionally
      const civRatio =
        totalPopulation > 0 ? nation.civilians / totalPopulation : 0.5;
      const civLoss = Math.round(actualLoss * civRatio);
      const milLoss = actualLoss - civLoss;
      newCivilians = Math.max(nation.civilians - civLoss, 50);
      newMilitary = Math.max(nation.military - milLoss, 50);
      newFood = 0;
    }

    // ── 5. Construction completion ──────────────────────────────────
    for (const b of nation.buildings) {
      if (b.building && b.buildsAt && b.buildsAt <= now) {
        buildingOps.push(
          prisma.building.update({
            where: { id: b.id },
            data: { building: false, buildsAt: null },
          })
        );
      }
    }

    // ── 6. Training completion ──────────────────────────────────────
    for (const t of nation.troops) {
      if (t.training > 0 && t.trainsAt && t.trainsAt <= now) {
        troopOps.push(
          prisma.troop.update({
            where: { id: t.id },
            data: {
              count: { increment: t.training },
              training: 0,
              trainsAt: null,
            },
          })
        );
      }
    }

    // ── Queue nation update ─────────────────────────────────────────
    operations.push(
      prisma.nation.update({
        where: { id: nation.id },
        data: {
          cash: nation.cash + cashProd,
          materials: nation.materials + materialsProd,
          techPoints: nation.techPoints + techProd,
          food: newFood,
          energy: newEnergy,
          energyCap: totalEnergyCap,
          energyRegen: totalEnergyRegen,
          population: newPopulation,
          civilians: newCivilians,
          military: newMilitary,
        },
      })
    );
  }

  // Execute all updates in a single transaction
  await prisma.$transaction([...operations, ...buildingOps, ...troopOps]);

  return { processed: nations.length };
}

/**
 * Start the tick engine on a recurring interval.
 */
let tickTimer: ReturnType<typeof setInterval> | null = null;

export function startTickEngine() {
  if (tickTimer) {
    clearInterval(tickTimer);
  }

  console.log(
    `[tick-engine] Starting tick engine (interval: ${TICK_INTERVAL_MS / 1000}s)`
  );

  tickTimer = setInterval(async () => {
    try {
      const result = await processTick();
      console.log(
        `[tick-engine] Tick processed: ${result.processed} nations`
      );
    } catch (err) {
      console.error("[tick-engine] Tick failed:", err);
    }
  }, TICK_INTERVAL_MS);
}

export function stopTickEngine() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
    console.log("[tick-engine] Tick engine stopped");
  }
}

/**
 * Register the admin tick route for manual triggering.
 */
export async function adminTickRoute(app: FastifyInstance) {
  app.get("/admin/tick", async (_req, reply) => {
    try {
      const result = await processTick();
      return reply.send({ ok: true, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: "Tick failed", message });
    }
  });
}
