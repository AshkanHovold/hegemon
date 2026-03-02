import ResourceBar from "./ResourceBar";
import GameIcon from "./GameIcon";
import type { Nation } from "../lib/types";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.floor(n).toString();
}

interface TopBarProps {
  nation: Nation | null;
}

export default function TopBar({ nation }: TopBarProps) {
  const cash = nation?.cash ?? 0;
  const materials = nation?.materials ?? 0;
  const tech = nation?.techPoints ?? 0;
  const population = nation?.population ?? 0;
  const food = nation?.food ?? 0;
  const energyCurrent = nation?.energy ?? 0;
  const energyMax = nation?.energyCap ?? 100;

  const energyPercent = energyMax > 0 ? (energyCurrent / energyMax) * 100 : 0;

  return (
    <div className="flex items-center gap-2 flex-wrap bg-gray-950/80 backdrop-blur border-b border-gray-800 px-4 py-2">
      <ResourceBar
        iconName="resource-cash"
        label="Cash"
        value={formatNumber(cash)}
        colorClass="text-amber-400"
      />
      <ResourceBar
        iconName="resource-materials"
        label="Materials"
        value={formatNumber(materials)}
        colorClass="text-slate-300"
      />
      <ResourceBar
        iconName="resource-tech"
        label="Tech"
        value={formatNumber(tech)}
        colorClass="text-cyan-400"
      />
      <ResourceBar
        iconName="resource-population"
        label="Pop"
        value={formatNumber(population)}
        colorClass="text-violet-400"
      />
      <ResourceBar
        iconName="resource-food"
        label="Food"
        value={formatNumber(food)}
        colorClass="text-emerald-400"
      />

      {/* Energy bar - special treatment */}
      <div className="flex items-center gap-2 rounded-full bg-gray-900/80 border border-gray-800 px-3 py-1 text-sm ml-auto">
        <GameIcon name="resource-energy" size={18} />
        <span className="text-gray-500 hidden lg:inline">Energy</span>
        <div className="w-24 h-3 bg-gray-800 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full energy-glow transition-all duration-500"
            style={{ width: `${energyPercent}%` }}
          />
        </div>
        <span className="text-blue-400 font-semibold tabular-nums">
          {Math.floor(energyCurrent)}/{Math.floor(energyMax)}
        </span>
      </div>
    </div>
  );
}
