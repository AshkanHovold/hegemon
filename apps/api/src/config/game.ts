// ─── Game Configuration Constants ─────────────────────────────────────
// All game balance numbers live here so they're easy to tune.

// Building production per level per tick
export const BUILDING_PRODUCTION = {
  RESIDENTIAL: { population: 50 },
  FARM: { food: 15 },
  FACTORY: { materials: 10 },
  COMMERCIAL: { cash: 100 },
  POWER_PLANT: { energyCap: 20, energyRegen: 0.5 },
  RESEARCH_LAB: { techPoints: 5 },
  BARRACKS: { trainingSpeed: 0.1 },
  CYBER_CENTER: { cyberSlots: 1 },
  MISSILE_DEFENSE: { defenseBonus: 0.05 },
  FIREWALL_ARRAY: { cyberDefense: 0.1 },
  INTELLIGENCE_HQ: { intelBonus: 0.1 },
} as const;

// Building upgrade costs: base * (level ^ 1.5)
export const BUILDING_BASE_COST = {
  cash: 500,
  materials: 200,
} as const;

// Time to build: 5 minutes * level (in ms)
export const BUILDING_TIME_PER_LEVEL = 5 * 60 * 1000;

// Troop costs and stats
export const TROOP_STATS = {
  INFANTRY: {
    atk: 3,
    def: 2,
    costCash: 100,
    costMaterials: 20,
    trainTimeMs: 30_000,
  },
  ARMOR: {
    atk: 15,
    def: 12,
    costCash: 800,
    costMaterials: 300,
    trainTimeMs: 120_000,
  },
  AIR_FORCE: {
    atk: 20,
    def: 5,
    costCash: 1200,
    costMaterials: 100,
    trainTimeMs: 180_000,
  },
  DRONES: {
    atk: 10,
    def: 3,
    costCash: 500,
    costMaterials: 50,
    trainTimeMs: 60_000,
  },
  NAVY: {
    atk: 12,
    def: 10,
    costCash: 1000,
    costMaterials: 400,
    trainTimeMs: 240_000,
  },
} as const;

// Energy costs for actions
export const ENERGY_COSTS = {
  BUILD: 5,
  TRAIN: 3,
  ATTACK: 25,
  CYBER_OP: {
    RECON_SCAN: 5,
    NETWORK_INFILTRATION: 15,
    SYSTEM_HACK: 15,
    DATA_THEFT: 15,
    INFRASTRUCTURE_SABOTAGE: 25,
    MARKET_MANIPULATION: 20,
    PROPAGANDA: 15,
    EMP_STRIKE: 40,
  },
} as const;

// Tick interval: 10 minutes
export const TICK_INTERVAL_MS = 10 * 60 * 1000;

// Population
export const POP_GROWTH_BASE = 10; // base pop growth per tick
export const FOOD_PER_POP = 0.01; // food consumed per population per tick
