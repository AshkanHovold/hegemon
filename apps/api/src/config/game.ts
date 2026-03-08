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

// ─── Tech Tree ────────────────────────────────────────────────────────
// Each branch has 4 tiers, sequential prerequisites.
// Effects are applied dynamically when checked.

export const TECH_TREE = {
  MILITARY: {
    name: "Military",
    nodes: [
      {
        id: "combat_training",
        name: "Combat Training",
        desc: "Improves troop attack power by 10%",
        tier: 1,
        costTP: 5,
        researchTimeMs: 5 * 60 * 1000,
        effect: { type: "atk_bonus" as const, value: 0.1 },
      },
      {
        id: "advanced_tactics",
        name: "Advanced Tactics",
        desc: "Improves troop attack power by an additional 15%",
        tier: 2,
        costTP: 15,
        researchTimeMs: 15 * 60 * 1000,
        effect: { type: "atk_bonus" as const, value: 0.15 },
      },
      {
        id: "siege_warfare",
        name: "Siege Warfare",
        desc: "Reduces troop losses by 20% when attacking",
        tier: 3,
        costTP: 30,
        researchTimeMs: 30 * 60 * 1000,
        effect: { type: "atk_loss_reduction" as const, value: 0.2 },
      },
      {
        id: "nuclear_arsenal",
        name: "Nuclear Arsenal",
        desc: "Devastating 30% attack bonus against all targets",
        tier: 4,
        costTP: 60,
        researchTimeMs: 60 * 60 * 1000,
        effect: { type: "atk_bonus" as const, value: 0.3 },
      },
    ],
  },
  ECONOMY: {
    name: "Economy",
    nodes: [
      {
        id: "trade_routes",
        name: "Trade Routes",
        desc: "Reduces market fees by 25%",
        tier: 1,
        costTP: 5,
        researchTimeMs: 5 * 60 * 1000,
        effect: { type: "market_fee_reduction" as const, value: 0.25 },
      },
      {
        id: "banking",
        name: "Banking",
        desc: "Earn 2% interest on cash reserves per tick",
        tier: 2,
        costTP: 15,
        researchTimeMs: 15 * 60 * 1000,
        effect: { type: "cash_interest" as const, value: 0.02 },
      },
      {
        id: "stock_exchange",
        name: "Stock Exchange",
        desc: "Increases all resource production by 15%",
        tier: 3,
        costTP: 30,
        researchTimeMs: 30 * 60 * 1000,
        effect: { type: "production_bonus" as const, value: 0.15 },
      },
      {
        id: "global_markets",
        name: "Global Markets",
        desc: "Increases all resource production by 25%",
        tier: 4,
        costTP: 60,
        researchTimeMs: 60 * 60 * 1000,
        effect: { type: "production_bonus" as const, value: 0.25 },
      },
    ],
  },
  CYBER: {
    name: "Cyber",
    nodes: [
      {
        id: "basic_hacking",
        name: "Basic Hacking",
        desc: "Improves cyber op success rate by 10%",
        tier: 1,
        costTP: 5,
        researchTimeMs: 5 * 60 * 1000,
        effect: { type: "cyber_success_bonus" as const, value: 0.1 },
      },
      {
        id: "advanced_infiltration",
        name: "Advanced Infiltration",
        desc: "Reduces cyber op energy cost by 20%",
        tier: 2,
        costTP: 15,
        researchTimeMs: 15 * 60 * 1000,
        effect: { type: "cyber_energy_reduction" as const, value: 0.2 },
      },
      {
        id: "zero_day_exploits",
        name: "Zero Day Exploits",
        desc: "Improves cyber op success rate by 25%",
        tier: 3,
        costTP: 30,
        researchTimeMs: 30 * 60 * 1000,
        effect: { type: "cyber_success_bonus" as const, value: 0.25 },
      },
      {
        id: "ai_warfare",
        name: "AI Warfare",
        desc: "Cyber ops deal 50% more damage/effect",
        tier: 4,
        costTP: 60,
        researchTimeMs: 60 * 60 * 1000,
        effect: { type: "cyber_damage_bonus" as const, value: 0.5 },
      },
    ],
  },
} as const;

export type TechBranchKey = keyof typeof TECH_TREE;
export type TechNodeId = (typeof TECH_TREE)[TechBranchKey]["nodes"][number]["id"];

export const ENERGY_COSTS_RESEARCH = 10;

// Tick interval: 10 minutes
export const TICK_INTERVAL_MS = 10 * 60 * 1000;

// Building level cap
export const MAX_BUILDING_LEVEL = 20;

// Population
export const POP_GROWTH_BASE = 10; // base pop growth per tick
export const FOOD_PER_POP = 0.01; // food consumed per population per tick
