// ─── User ───────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
}

// ─── Round ──────────────────────────────────────────────

export type RoundPhase = "GROWTH" | "OPEN" | "ENDGAME" | "ENDED";

export interface Round {
  id: string;
  number: number;
  startedAt: string;
  endsAt: string;
  phase: RoundPhase;
  active: boolean;
}

// ─── Building ───────────────────────────────────────────

export type BuildingType =
  | "RESIDENTIAL"
  | "FARM"
  | "FACTORY"
  | "COMMERCIAL"
  | "POWER_PLANT"
  | "RESEARCH_LAB"
  | "BARRACKS"
  | "CYBER_CENTER"
  | "MISSILE_DEFENSE"
  | "FIREWALL_ARRAY"
  | "INTELLIGENCE_HQ";

export interface Building {
  id: string;
  nationId: string;
  type: BuildingType;
  level: number;
  building: boolean; // under construction
  buildsAt: string | null;
  createdAt: string;
}

// ─── Troop ──────────────────────────────────────────────

export type UnitType = "INFANTRY" | "ARMOR" | "AIR_FORCE" | "DRONES" | "NAVY";

export interface Troop {
  id: string;
  nationId: string;
  type: UnitType;
  count: number;
  training: number;
  trainsAt: string | null;
}

// ─── Nation ─────────────────────────────────────────────

export interface AllianceMembership {
  role: string;
  alliance: {
    name: string;
    tag: string;
  };
}

export interface Nation {
  id: string;
  name: string;
  userId: string;
  roundId: string;
  serverMode: string;

  // Resources
  cash: number;
  materials: number;
  techPoints: number;
  energy: number;
  energyCap: number;
  energyRegen: number;
  population: number;
  civilians: number;
  military: number;
  food: number;

  // Population allocation
  militaryAllocation: number;

  // Relations
  buildings: Building[];
  troops: Troop[];
  techNodes: { branch: TechBranch; node: string; researching: boolean; researchAt: string | null }[];
  allianceMembership: AllianceMembership | null;

  shieldUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Tech ───────────────────────────────────────────────

export type TechBranch = "MILITARY" | "ECONOMY" | "CYBER";

export interface TechNodeStatus {
  id: string;
  name: string;
  desc: string;
  tier: number;
  costTP: number;
  researchTimeMs: number;
  effect: { type: string; value: number };
  status: "locked" | "researching" | "completed";
  researchAt: string | null;
  level: number;
}

export interface TechBranchData {
  key: TechBranch;
  name: string;
  nodes: TechNodeStatus[];
}

// ─── Rankings ─────────────────────────────────────────────

export interface RankedNation {
  rank: number;
  id: string;
  name: string;
  username: string;
  alliance: { name: string; tag: string } | null;
  population: number;
  score: number;
  military: number;
  economic: number;
}

// ─── Attack ──────────────────────────────────────────────

export interface AttackResult {
  id: string;
  attackerWon: boolean;
  attackPower: number;
  defensePower: number;
  attackerLosses: Record<string, number>;
  defenderLosses: Record<string, number>;
  lootCash: number;
  lootMaterials: number;
}

export interface AttackLogEntry {
  id: string;
  isAttacker: boolean;
  attacker: { id: string; name: string };
  defender: { id: string; name: string };
  attackerWon: boolean;
  attackerLosses: Record<string, number>;
  defenderLosses: Record<string, number>;
  lootCash: number | null;
  lootMaterials: number | null;
  createdAt: string;
}
