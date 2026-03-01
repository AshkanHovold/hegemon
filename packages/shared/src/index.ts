/** Core resource types for a nation */
export interface Resources {
  cash: number;
  materials: number;
  techPoints: number;
  energy: number;
  population: number;
  food: number;
}

/** Server mode determines PvP rules and damage caps */
export type ServerMode = "hardcore" | "casual" | "pve";

/** Round phase determines what actions are available */
export type RoundPhase = "growth" | "open" | "endgame";

/** Building types available to construct */
export type BuildingType =
  | "residential"
  | "farm"
  | "factory"
  | "commercial"
  | "powerPlant"
  | "researchLab"
  | "barracks"
  | "cyberCenter"
  | "missileDefense"
  | "firewallArray"
  | "intelligenceHQ";

/** Military unit types */
export type UnitType = "infantry" | "armor" | "airForce" | "drones" | "navy";

/** Cyber operation types */
export type CyberOpType =
  | "reconScan"
  | "networkInfiltration"
  | "systemHack"
  | "dataTheft"
  | "infrastructureSabotage"
  | "marketManipulation"
  | "propaganda"
  | "empStrike";

/** Tech tree branches */
export type TechBranch = "military" | "cyber" | "economy" | "infrastructure";

/** Alliance roles */
export type AllianceRole =
  | "president"
  | "vicePresident"
  | "ministerOfWar"
  | "ministerOfIntelligence"
  | "ministerOfTrade"
  | "member";

/** Market order side */
export type OrderSide = "buy" | "sell";

/** Tradeable commodities on the market */
export type Commodity = "cash" | "materials" | "techPoints" | "food";
