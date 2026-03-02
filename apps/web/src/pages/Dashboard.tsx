import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { calculateProductionRates } from "../lib/gameConstants";
import { api } from "../lib/api";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.floor(n).toLocaleString();
}

const QUICK_ACTIONS = [
  {
    label: "Build",
    icon: "\ud83c\udfdb",
    to: "/game/nation",
    color: "bg-amber-600 hover:bg-amber-500",
  },
  {
    label: "Train",
    icon: "\u2694",
    to: "/game/military",
    color: "bg-red-600 hover:bg-red-500",
  },
  {
    label: "Research",
    icon: "^",
    to: "/game/cyber",
    color: "bg-cyan-600 hover:bg-cyan-500",
  },
  {
    label: "Scout",
    icon: "\ud83d\udd0d",
    to: "/game/cyber",
    color: "bg-violet-600 hover:bg-violet-500",
  },
];

const ACTIVITY_FEED = [
  { time: "Just now", text: "Welcome to Hegemon! Build your nation.", type: "info" },
];

export default function Dashboard() {
  const { nation, round, refreshNation } = useGame();
  const { user } = useAuth();
  const [devGranting, setDevGranting] = useState(false);
  const [devMsg, setDevMsg] = useState("");

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

  const allianceName =
    nation.allianceMembership?.alliance?.name ?? "None";

  const RESOURCE_CARDS = [
    {
      label: "Cash",
      icon: "$",
      value: formatNumber(nation.cash),
      rate: `+${formatNumber(rates.cashRate)}/tick`,
      color: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
    },
    {
      label: "Materials",
      icon: "*",
      value: formatNumber(nation.materials),
      rate: `+${formatNumber(rates.materialsRate)}/tick`,
      color: "text-slate-300",
      border: "border-slate-500/20",
      bg: "bg-slate-500/5",
    },
    {
      label: "Tech Points",
      icon: "^",
      value: formatNumber(nation.techPoints),
      rate: `+${formatNumber(rates.techRate)}/tick`,
      color: "text-cyan-400",
      border: "border-cyan-500/20",
      bg: "bg-cyan-500/5",
    },
    {
      label: "Energy",
      icon: "!",
      value: `${energyCurrent} / ${energyMax}`,
      rate: `+${nation.energyRegen.toFixed(1)}/tick`,
      color: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
    },
    {
      label: "Population",
      icon: "#",
      value: formatNumber(nation.population),
      rate: `Cap: +${formatNumber(rates.popCapacity)}`,
      color: "text-violet-400",
      border: "border-violet-500/20",
      bg: "bg-violet-500/5",
    },
    {
      label: "Food",
      icon: "~",
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
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.username ?? "Commander"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {nation.name} &middot; Alliance: {allianceName}
        </p>
      </div>

      {/* Round status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-500">Round {round.number}</span>
            <span className="mx-2 text-gray-700">|</span>
            <span className="text-gray-400">
              Day {currentDay} of {totalDays}
            </span>
            <span className="mx-2 text-gray-700">|</span>
            <span className="text-amber-400 font-medium">{round.phase} Phase</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Tick every 10 min</span>
        </div>
      </div>

      {/* Resource cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {RESOURCE_CARDS.map((res) => (
          <div
            key={res.label}
            className={`${res.bg} border ${res.border} rounded-xl p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg ${res.color}`}>{res.icon}</span>
              <span className="text-sm text-gray-400">{res.label}</span>
            </div>
            <div className={`text-xl font-bold ${res.color} tabular-nums`}>
              {res.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{res.rate}</div>
          </div>
        ))}
      </div>

      {/* Energy section */}
      <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-blue-400">!</span> Energy Status
          </h2>
          <span className="text-sm text-gray-500">
            {minutesToFull > 0
              ? `Full in ~${Math.floor(minutesToFull / 60)}h ${minutesToFull % 60}m`
              : "Fully charged"}
          </span>
        </div>
        <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-full energy-glow transition-all duration-500"
            style={{ width: `${energyPercent}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
            {energyCurrent} / {energyMax}
          </span>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>
            Regen rate: {nation.energyRegen.toFixed(1)} energy / tick
          </span>
          <span>{energyPercent.toFixed(0)}% charged</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className={`${action.color} text-white rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02] action-pulse`}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="font-semibold">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Recent Activity
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {ACTIVITY_FEED.map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.type === "success"
                      ? "bg-emerald-400"
                      : item.type === "danger"
                        ? "bg-red-400"
                        : item.type === "warning"
                          ? "bg-amber-400"
                          : "bg-blue-400"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-300">{item.text}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dev tools */}
      <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-yellow-400">Dev Tools</h2>
            <p className="text-xs text-gray-500">
              +$50K cash, +20K materials, +5K tech, +10K food, refill energy
            </p>
          </div>
          <div className="flex items-center gap-3">
            {devMsg && (
              <span className="text-xs text-green-400">{devMsg}</span>
            )}
            <button
              onClick={handleDevGrant}
              disabled={devGranting}
              className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-600/50 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {devGranting ? "Granting..." : "Grant Resources"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
