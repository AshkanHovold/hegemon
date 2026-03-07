import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { calculateProductionRates, BUILDING_DISPLAY, TROOP_STATS, BUILDING_TIME_PER_LEVEL } from "../lib/gameConstants";
import { useCountdown } from "../hooks/useCountdown";
import { api } from "../lib/api";
import { formatNumber } from "../lib/format";
import GameIcon, { UNIT_ICON_KEY } from "../components/GameIcon";
import HelpTooltip from "../components/HelpTooltip";
import type { Building, Troop, UnitType } from "../lib/types";

function ActiveBuild({ building }: { building: Building }) {
  const display = BUILDING_DISPLAY[building.type];
  const startTime = building.buildsAt
    ? new Date(new Date(building.buildsAt).getTime() - BUILDING_TIME_PER_LEVEL * building.level).toISOString()
    : null;
  const { percent, label } = useCountdown(building.buildsAt, startTime);
  return (
    <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
      <GameIcon name={display.iconKey} size={24} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-200">{display.name} {"\u2192"} Lv.{building.level}</span>
          <span className="text-xs text-amber-400 font-mono tabular-nums">{label}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${percent ?? 0}%` }} />
        </div>
      </div>
    </div>
  );
}

function ActiveTrain({ troop }: { troop: Troop }) {
  const stats = TROOP_STATS[troop.type];
  const iconKey = UNIT_ICON_KEY[troop.type] ?? "unit-infantry";
  const startTime = troop.trainsAt
    ? new Date(new Date(troop.trainsAt).getTime() - stats.trainTimeMs).toISOString()
    : null;
  const { percent, label } = useCountdown(troop.trainsAt, startTime);
  return (
    <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
      <GameIcon name={iconKey} size={24} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-200">Training {troop.training.toLocaleString()} {stats.name}</span>
          <span className="text-xs text-red-400 font-mono tabular-nums">{label}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${percent ?? 0}%` }} />
        </div>
      </div>
    </div>
  );
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

interface Mission {
  id: string;
  type: string;
  title: string;
  desc: string;
  progress: number;
  target: number;
  rewardCash: number;
  rewardMaterials: number;
  completed: boolean;
}

interface WorldNewsItem {
  type: string;
  message: string;
  timestamp: string;
}

interface DailyStatus {
  claimableToday: boolean;
  rewards?: { cash?: number; materials?: number; food?: number; tech?: number };
}

export default function Dashboard() {
  const { nation, round, refreshNation } = useGame();
  const { user } = useAuth();
  const [devGranting, setDevGranting] = useState(false);
  const [devMsg, setDevMsg] = useState("");
  const [devOpen, setDevOpen] = useState(false);

  // Missions state
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);

  // World news state
  const [worldNews, setWorldNews] = useState<WorldNewsItem[]>([]);

  // Daily bonus state
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [dailyRewards, setDailyRewards] = useState<DailyStatus["rewards"] | null>(null);

  useEffect(() => { document.title = "Dashboard - Hegemon"; }, []);

  // Fetch missions
  useEffect(() => {
    async function fetchMissions() {
      try {
        const data = await api.get<{ missions: Mission[] }>("/nation/missions");
        setMissions(data.missions);
      } catch {
        // endpoint may not exist yet
      } finally {
        setMissionsLoading(false);
      }
    }
    fetchMissions();
  }, []);

  // Fetch world news
  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await api.get<{ events: WorldNewsItem[] }>("/world/news");
        setWorldNews(data.events ?? []);
      } catch {
        // endpoint may not exist yet
      }
    }
    fetchNews();
  }, []);

  // Fetch daily bonus status
  useEffect(() => {
    async function fetchDailyStatus() {
      try {
        const data = await api.get<DailyStatus>("/nation/daily-status");
        setDailyStatus(data);
      } catch {
        // endpoint may not exist yet
      }
    }
    fetchDailyStatus();
  }, []);

  async function handleClaimDaily() {
    setClaimingDaily(true);
    try {
      const data = await api.post<{ rewards: DailyStatus["rewards"] }>("/nation/daily-claim");
      setDailyRewards(data.rewards);
      setDailyStatus({ claimableToday: false });
      await refreshNation();
    } catch {
      // endpoint may not exist yet
    } finally {
      setClaimingDaily(false);
    }
  }

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
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user?.username ?? "Commander"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {nation.name} &middot; Alliance: {allianceName}
          </p>
        </div>
        {/* Daily Bonus */}
        {dailyStatus?.claimableToday && (
          <button
            onClick={handleClaimDaily}
            disabled={claimingDaily}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm animate-glow-pulse"
          >
            {claimingDaily ? "Claiming..." : "Claim Daily Bonus"}
          </button>
        )}
      </div>

      {/* Daily Rewards Modal */}
      {dailyRewards && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Daily Bonus Claimed!</h3>
          <div className="flex gap-4 text-xs text-gray-300">
            {dailyRewards.cash != null && dailyRewards.cash > 0 && (
              <span>+{formatNumber(dailyRewards.cash)} Cash</span>
            )}
            {dailyRewards.materials != null && dailyRewards.materials > 0 && (
              <span>+{formatNumber(dailyRewards.materials)} Materials</span>
            )}
            {dailyRewards.food != null && dailyRewards.food > 0 && (
              <span>+{formatNumber(dailyRewards.food)} Food</span>
            )}
            {dailyRewards.tech != null && dailyRewards.tech > 0 && (
              <span>+{formatNumber(dailyRewards.tech)} Tech</span>
            )}
          </div>
          <button onClick={() => setDailyRewards(null)} className="text-xs text-gray-500 hover:text-gray-400 mt-2">
            Dismiss
          </button>
        </div>
      )}

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
          <span className="text-xs text-gray-500 flex items-center gap-1.5">Tick every 10 min <HelpTooltip articleId="ticks" /></span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${roundPercent}%` }}
          />
        </div>
      </div>

      {/* Missions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Active Missions
        </h2>
        {missionsLoading ? (
          <div className="text-xs text-gray-600 text-center py-3">Loading missions...</div>
        ) : missions.length === 0 ? (
          <div className="text-xs text-gray-600 text-center py-3">No active missions. Check back soon!</div>
        ) : (
          <div className="space-y-2">
            {missions.filter((m) => !m.completed).map((m) => {
              const rewardText = [
                m.rewardCash > 0 ? `$${formatNumber(m.rewardCash)}` : "",
                m.rewardMaterials > 0 ? `${formatNumber(m.rewardMaterials)} mat` : "",
              ].filter(Boolean).join(" + ");
              return (
                <div key={m.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-200 font-medium truncate">{m.title}</span>
                      <span className="text-[10px] text-amber-400 ml-2 shrink-0">{rewardText}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${m.target > 0 ? Math.min(100, (m.progress / m.target) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5 tabular-nums">
                      {m.progress} / {m.target}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* Shield status */}
      {nation.shieldUntil && new Date(nation.shieldUntil) > new Date() && (
        <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
          </svg>
          <div>
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              Beginner Shield Active <HelpTooltip articleId="beginner-shield" />
            </div>
            <div className="text-xs text-gray-500">
              You are protected from attacks until{" "}
              {new Date(nation.shieldUntil).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Energy section */}
      <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <GameIcon name="resource-energy" size={22} /> Energy Status <HelpTooltip articleId="energy" />
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

      {/* Current Activity */}
      {(nation.buildings.some((b) => b.building) || nation.troops.some((t) => t.training > 0)) && (
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Current Activity</h2>
          <div className="space-y-2">
            {nation.buildings
              .filter((b) => b.building)
              .map((b) => (
                <ActiveBuild key={b.id} building={b} />
              ))}
            {nation.troops
              .filter((t) => t.training > 0)
              .map((t) => (
                <ActiveTrain key={t.id} troop={t} />
              ))}
          </div>
        </div>
      )}

      {/* World News Ticker */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-800">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">World News</h2>
        </div>
        <div className="relative h-8 overflow-hidden">
          {worldNews.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-600">
              No world events yet.
            </div>
          ) : (
            <div className="absolute whitespace-nowrap flex items-center h-full animate-scroll-left">
              {/* Duplicate for seamless loop */}
              {[...worldNews, ...worldNews].map((item, i) => (
                <span key={`news-${i}`} className="inline-flex items-center gap-2 mx-6 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item.message}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dev tools - collapsible (dev only) */}
      {import.meta.env.DEV && (
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
      )}
    </div>
  );
}
