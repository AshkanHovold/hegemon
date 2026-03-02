import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { calculateProductionRates } from "../lib/gameConstants";
import { api } from "../lib/api";
import GameIcon from "../components/GameIcon";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.floor(n).toLocaleString();
}

const QUICK_ACTIONS = [
  {
    label: "Build",
    iconName: "building-residential",
    to: "/game/nation",
    color: "bg-amber-600/90 hover:bg-amber-500",
  },
  {
    label: "Train",
    iconName: "unit-infantry",
    to: "/game/military",
    color: "bg-red-600/90 hover:bg-red-500",
  },
  {
    label: "Cyber Ops",
    iconName: "cyber-hack",
    to: "/game/cyber",
    color: "bg-cyan-600/90 hover:bg-cyan-500",
  },
  {
    label: "Market",
    iconName: "resource-materials",
    to: "/game/market",
    color: "bg-violet-600/90 hover:bg-violet-500",
  },
];

export default function Dashboard() {
  const { nation, round, refreshNation } = useGame();
  const { user } = useAuth();
  const [devGranting, setDevGranting] = useState(false);
  const [devMsg, setDevMsg] = useState("");
  const [devOpen, setDevOpen] = useState(false);

  if (!nation || !round) return null;

  async function handleDevGrant() {
    setDevGranting(true);
    setDevMsg("");
    try {
      const res = await api.post<{ message: string }>("/nation/dev/grant", {}, {
        "x-dev-secret": "hegemon-dev",
      });
      setDevMsg(res.message);
      await refreshNation();
    } catch {
      setDevMsg("Failed to grant resources");
    } finally {
      setDevGranting(false);
    }
  }

  const rates = calculateProductionRates(nation.buildings);

  const energyCurrent = Math.floor(nation.energy);
  const energyMax = Math.floor(nation.energyCap);
  const energyPercent = energyMax > 0 ? (energyCurrent / energyMax) * 100 : 0;
  const minutesToFull =
    nation.energyRegen > 0
      ? Math.ceil((energyMax - energyCurrent) / nation.energyRegen) * 10
      : 0;

  // Compute round progress
  const roundStart = new Date(round.startedAt).getTime();
  const roundEnd = new Date(round.endsAt).getTime();
  const now = Date.now();
  const totalDays = Math.ceil((roundEnd - roundStart) / (24 * 60 * 60 * 1000));
  const currentDay = Math.max(
    1,
    Math.ceil((now - roundStart) / (24 * 60 * 60 * 1000)),
  );
  const roundPercent = Math.min(100, (currentDay / totalDays) * 100);

  const allianceName =
    nation.allianceMembership?.alliance?.name ?? "None";

  const RESOURCE_CARDS = [
    {
      label: "Cash",
      iconName: "resource-cash",
      value: formatNumber(nation.cash),
      rate: `+${formatNumber(rates.cashRate)}/tick`,
      color: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
    },
    {
      label: "Materials",
      iconName: "resource-materials",
      value: formatNumber(nation.materials),
      rate: `+${formatNumber(rates.materialsRate)}/tick`,
      color: "text-slate-300",
      border: "border-slate-500/20",
      bg: "bg-slate-500/5",
    },
    {
      label: "Tech Points",
      iconName: "resource-tech",
      value: formatNumber(nation.techPoints),
      rate: `+${formatNumber(rates.techRate)}/tick`,
      color: "text-cyan-400",
      border: "border-cyan-500/20",
      bg: "bg-cyan-500/5",
    },
    {
      label: "Energy",
      iconName: "resource-energy",
      value: `${energyCurrent} / ${energyMax}`,
      rate: `+${nation.energyRegen.toFixed(1)}/tick`,
      color: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
    },
    {
      label: "Population",
      iconName: "resource-population",
      value: formatNumber(nation.population),
      rate: `Cap: ${formatNumber(rates.popCapacity)}`,
      color: "text-violet-400",
      border: "border-violet-500/20",
      bg: "bg-violet-500/5",
    },
    {
      label: "Food",
      iconName: "resource-food",
      value: formatNumber(nation.food),
      rate: `+${formatNumber(rates.foodRate)}/tick`,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome back, {user?.username ?? "Commander"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {nation.name} &middot; Alliance: {allianceName}
        </p>
      </div>

      {/* Round status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">Round {round.number}</span>
            <span className="text-gray-700">|</span>
            <span className="text-gray-300">
              Day {currentDay} of {totalDays}
            </span>
            <span className="text-gray-700">|</span>
            <span className="text-amber-400 font-medium">{round.phase} Phase</span>
          </div>
          <span className="text-xs text-gray-500">Tick every 10 min</span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${roundPercent}%` }}
          />
        </div>
      </div>

      {/* Resource cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {RESOURCE_CARDS.map((res) => (
          <div
            key={res.label}
            className={`${res.bg} border ${res.border} rounded-xl p-4 hover:border-opacity-50 transition-colors`}
          >
            <div className="flex items-center gap-2 mb-2">
              <GameIcon name={res.iconName} size={22} />
              <span className="text-xs text-gray-400 font-medium">{res.label}</span>
            </div>
            <div className={`text-xl font-bold ${res.color} tabular-nums`}>
              {res.value}
            </div>
            <div className="text-xs text-gray-500 mt-1 tabular-nums">{res.rate}</div>
          </div>
        ))}
      </div>

      {/* Energy section */}
      <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <GameIcon name="resource-energy" size={22} /> Energy Status
          </h2>
          <span className="text-sm text-gray-400">
            {minutesToFull > 0
              ? `Full in ~${Math.floor(minutesToFull / 60)}h ${minutesToFull % 60}m`
              : "Fully charged"}
          </span>
        </div>
        <div className="w-full h-5 bg-gray-800 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-full energy-glow transition-all duration-500"
            style={{ width: `${energyPercent}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white tabular-nums">
            {energyCurrent} / {energyMax}
          </span>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>
            Regen: {nation.energyRegen.toFixed(1)} / tick
          </span>
          <span>{energyPercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`${action.color} text-white rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <GameIcon name={action.iconName} size={32} className="drop-shadow-lg" />
              <span className="font-semibold">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Dev tools - collapsible */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setDevOpen(!devOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-900/50 hover:bg-gray-900 transition-colors text-left"
        >
          <span className="text-xs font-medium text-gray-600">Dev Tools</span>
          <span className="text-xs text-gray-700">{devOpen ? "\u25b2" : "\u25bc"}</span>
        </button>
        {devOpen && (
          <div className="bg-gray-900/30 border-t border-gray-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                +$50K cash, +20K materials, +5K tech, +10K food, refill energy
              </p>
              <div className="flex items-center gap-3">
                {devMsg && (
                  <span className="text-xs text-green-400">{devMsg}</span>
                )}
                <button
                  onClick={handleDevGrant}
                  disabled={devGranting}
                  className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-gray-300 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  {devGranting ? "Granting..." : "Grant Resources"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
