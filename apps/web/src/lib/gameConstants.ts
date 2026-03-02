import type { BuildingType, UnitType } from "./types";

// Building production per level per tick
export const BUILDING_PRODUCTION: Record<
  BuildingType,
  { label: string; production: string }
> = {
  RESIDENTIAL: { label: "+50 pop capacity", production: "population" },
  FARM: { label: "+15 food/tick", production: "food" },
  FACTORY: { label: "+10 materials/tick", production: "materials" },
  COMMERCIAL: { label: "+100 cash/tick", production: "cash" },
  POWER_PLANT: { label: "+20 energy cap, +0.5 regen", production: "energy" },
  RESEARCH_LAB: { label: "+5 tech/tick", production: "techPoints" },
  BARRACKS: { label: "+10% training speed", production: "training" },
  CYBER_CENTER: { label: "+1 cyber op slot", production: "cyber" },
  MISSILE_DEFENSE: { label: "+5% defense", production: "defense" },
  FIREWALL_ARRAY: { label: "+10% cyber defense", production: "cyberDefense" },
  INTELLIGENCE_HQ: { label: "+10% intel success", production: "intel" },
};

export const BUILDING_DISPLAY: Record<
  BuildingType,
  { name: string; icon: string; desc: string }
> = {
  RESIDENTIAL: {
    name: "Housing",
    icon: "\ud83c\udfe0",
    desc: "Residential areas increasing population capacity.",
  },
  FARM: {
    name: "Farms",
    icon: "\ud83c\udf3e",
    desc: "Produces food to sustain your population.",
  },
  FACTORY: {
    name: "Factories",
    icon: "\ud83c\udfed",
    desc: "Converts raw materials into finished goods.",
  },
  COMMERCIAL: {
    name: "Commercial",
    icon: "\ud83d\udcb0",
    desc: "Generates cash through trade and commerce.",
  },
  POWER_PLANT: {
    name: "Power Plants",
    icon: "\u26a1",
    desc: "Generates energy for operations.",
  },
  RESEARCH_LAB: {
    name: "Tech Labs",
    icon: "\ud83d\udd2c",
    desc: "Research facilities generating tech points.",
  },
  BARRACKS: {
    name: "Barracks",
    icon: "\u2694",
    desc: "Trains and houses military units.",
  },
  CYBER_CENTER: {
    name: "Cyber Center",
    icon: "\ud83d\udcbb",
    desc: "Enables cyber operations against enemies.",
  },
  MISSILE_DEFENSE: {
    name: "Missile Defense",
    icon: "\ud83d\udee1",
    desc: "Defensive structures protecting your nation.",
  },
  FIREWALL_ARRAY: {
    name: "Firewall Array",
    icon: "\ud83d\udd12",
    desc: "Cyber defense systems against hacking.",
  },
  INTELLIGENCE_HQ: {
    name: "Intelligence HQ",
    icon: "\ud83d\udd0d",
    desc: "Boosts intelligence operation success rates.",
  },
};

// Build time per level in ms (must match API: 5 minutes per level)
export const BUILDING_TIME_PER_LEVEL = 5 * 60 * 1000;

// Building upgrade cost: base * (level ^ 1.5)
export const BUILDING_BASE_COST = { cash: 500, materials: 200 };

export function upgradeCost(targetLevel: number) {
  return {
    cash: Math.round(BUILDING_BASE_COST.cash * Math.pow(targetLevel, 1.5)),
    materials: Math.round(
      BUILDING_BASE_COST.materials * Math.pow(targetLevel, 1.5),
    ),
  };
}

// Production rates calculation from buildings
export function calculateProductionRates(
  buildings: { type: BuildingType; level: number; building: boolean }[],
) {
  let cashRate = 0;
  let materialsRate = 0;
  let foodRate = 0;
  let techRate = 0;
  let energyCapBonus = 0;
  let energyRegenRate = 0;
  let popCapacity = 0;

  for (const b of buildings) {
    if (b.building) continue; // skip buildings under construction
    switch (b.type) {
      case "COMMERCIAL":
        cashRate += 100 * b.level;
        break;
      case "FACTORY":
        materialsRate += 10 * b.level;
        break;
      case "FARM":
        foodRate += 15 * b.level;
        break;
      case "RESEARCH_LAB":
        techRate += 5 * b.level;
        break;
      case "POWER_PLANT":
        energyCapBonus += 20 * b.level;
        energyRegenRate += 0.5 * b.level;
        break;
      case "RESIDENTIAL":
        popCapacity += 50 * b.level;
        break;
    }
  }

  return {
    cashRate,
    materialsRate,
    foodRate,
    techRate,
    energyCapBonus,
    energyRegenRate,
    popCapacity,
  };
}

// Troop stats (mirrors backend)
export const TROOP_STATS: Record<
  UnitType,
  {
    name: string;
    icon: string;
    atk: number;
    def: number;
    costCash: number;
    costMaterials: number;
    trainTimeMs: number;
  }
> = {
  INFANTRY: {
    name: "Infantry",
    icon: "\ud83d\udc82",
    atk: 3,
    def: 2,
    costCash: 100,
    costMaterials: 20,
    trainTimeMs: 30_000,
  },
  ARMOR: {
    name: "Tanks",
    icon: "\ud83d\ude9c",
    atk: 15,
    def: 12,
    costCash: 800,
    costMaterials: 300,
    trainTimeMs: 120_000,
  },
  AIR_FORCE: {
    name: "Air Force",
    icon: "\u2708\ufe0f",
    atk: 20,
    def: 5,
    costCash: 1200,
    costMaterials: 100,
    trainTimeMs: 180_000,
  },
  DRONES: {
    name: "Drones",
    icon: "\ud83d\udef8",
    atk: 10,
    def: 3,
    costCash: 500,
    costMaterials: 50,
    trainTimeMs: 60_000,
  },
  NAVY: {
    name: "Navy",
    icon: "\u2693",
    atk: 12,
    def: 10,
    costCash: 1000,
    costMaterials: 400,
    trainTimeMs: 240_000,
  },
};

// All building types that exist in the game
export const ALL_BUILDING_TYPES: BuildingType[] = [
  "RESIDENTIAL",
  "FARM",
  "FACTORY",
  "COMMERCIAL",
  "POWER_PLANT",
  "RESEARCH_LAB",
  "BARRACKS",
  "CYBER_CENTER",
  "MISSILE_DEFENSE",
  "FIREWALL_ARRAY",
  "INTELLIGENCE_HQ",
];

export const ALL_UNIT_TYPES: UnitType[] = [
  "INFANTRY",
  "ARMOR",
  "AIR_FORCE",
  "DRONES",
  "NAVY",
];
