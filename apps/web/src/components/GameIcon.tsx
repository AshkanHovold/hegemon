const ICON_BASE = "/assets/icons";

type IconCategory = "resource" | "building" | "unit" | "cyber";

const ICON_MAP: Record<string, string> = {
  // Resources
  "resource-cash": `${ICON_BASE}/resource-cash.png`,
  "resource-materials": `${ICON_BASE}/resource-materials.png`,
  "resource-tech": `${ICON_BASE}/resource-tech.png`,
  "resource-energy": `${ICON_BASE}/resource-energy.png`,
  "resource-population": `${ICON_BASE}/resource-population.png`,
  "resource-food": `${ICON_BASE}/resource-food.png`,
  // Buildings
  "building-residential": `${ICON_BASE}/building-residential.png`,
  "building-farm": `${ICON_BASE}/building-farm.png`,
  "building-factory": `${ICON_BASE}/building-factory.png`,
  "building-commercial": `${ICON_BASE}/building-commercial.png`,
  "building-power-plant": `${ICON_BASE}/building-power-plant.png`,
  "building-research-lab": `${ICON_BASE}/building-research-lab.png`,
  "building-barracks": `${ICON_BASE}/building-barracks.png`,
  "building-cyber-center": `${ICON_BASE}/building-cyber-center.png`,
  "building-missile-defense": `${ICON_BASE}/building-missile-defense.png`,
  "building-firewall-array": `${ICON_BASE}/building-firewall-array.png`,
  "building-intelligence-hq": `${ICON_BASE}/building-intelligence-hq.png`,
  // Units
  "unit-infantry": `${ICON_BASE}/unit-infantry.png`,
  "unit-armor": `${ICON_BASE}/unit-armor.png`,
  "unit-air-force": `${ICON_BASE}/unit-air-force.png`,
  "unit-drones": `${ICON_BASE}/unit-drones.png`,
  "unit-navy": `${ICON_BASE}/unit-navy.png`,
  // Cyber ops
  "cyber-recon": `${ICON_BASE}/cyber-recon.png`,
  "cyber-infiltration": `${ICON_BASE}/cyber-infiltration.png`,
  "cyber-hack": `${ICON_BASE}/cyber-hack.png`,
  "cyber-data-theft": `${ICON_BASE}/cyber-data-theft.png`,
  "cyber-sabotage": `${ICON_BASE}/cyber-sabotage.png`,
  "cyber-market-manipulation": `${ICON_BASE}/cyber-market-manipulation.png`,
  "cyber-propaganda": `${ICON_BASE}/cyber-propaganda.png`,
  "cyber-emp": `${ICON_BASE}/cyber-emp.png`,
};

// Mapping from BuildingType enum to icon key
export const BUILDING_ICON_KEY: Record<string, string> = {
  RESIDENTIAL: "building-residential",
  FARM: "building-farm",
  FACTORY: "building-factory",
  COMMERCIAL: "building-commercial",
  POWER_PLANT: "building-power-plant",
  RESEARCH_LAB: "building-research-lab",
  BARRACKS: "building-barracks",
  CYBER_CENTER: "building-cyber-center",
  MISSILE_DEFENSE: "building-missile-defense",
  FIREWALL_ARRAY: "building-firewall-array",
  INTELLIGENCE_HQ: "building-intelligence-hq",
};

// Mapping from UnitType enum to icon key
export const UNIT_ICON_KEY: Record<string, string> = {
  INFANTRY: "unit-infantry",
  ARMOR: "unit-armor",
  AIR_FORCE: "unit-air-force",
  DRONES: "unit-drones",
  NAVY: "unit-navy",
};

// Mapping from CyberOpType to icon key
export const CYBER_ICON_KEY: Record<string, string> = {
  RECON_SCAN: "cyber-recon",
  NETWORK_INFILTRATION: "cyber-infiltration",
  SYSTEM_HACK: "cyber-hack",
  DATA_THEFT: "cyber-data-theft",
  INFRASTRUCTURE_SABOTAGE: "cyber-sabotage",
  MARKET_MANIPULATION: "cyber-market-manipulation",
  PROPAGANDA: "cyber-propaganda",
  EMP_STRIKE: "cyber-emp",
};

interface GameIconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function GameIcon({ name, size = 24, className = "" }: GameIconProps) {
  const src = ICON_MAP[name];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`inline-block object-contain ${className}`}
      loading="lazy"
    />
  );
}

/** Helper to get icon path for use outside the component */
export function getIconPath(name: string): string | undefined {
  return ICON_MAP[name];
}

export type { IconCategory };
