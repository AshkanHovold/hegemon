import { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { api, ApiError } from "../lib/api";
import GameIcon, { CYBER_ICON_KEY } from "../components/GameIcon";
import type { RankedNation } from "../lib/types";

type CyberOpType =
  | "RECON_SCAN"
  | "NETWORK_INFILTRATION"
  | "SYSTEM_HACK"
  | "DATA_THEFT"
  | "INFRASTRUCTURE_SABOTAGE"
  | "MARKET_MANIPULATION"
  | "PROPAGANDA"
  | "EMP_STRIKE";

const CYBER_OPS: {
  type: CyberOpType;
  name: string;
  energy: number;
  desc: string;
  cooldown: string;
  category: string;
  color: string;
  bg: string;
  iconColor: string;
}[] = [
  {
    type: "RECON_SCAN",
    name: "Recon Scan",
    energy: 5,
    desc: "Reveal target nation's troop counts and resource levels.",
    cooldown: "5 min",
    category: "Intelligence",
    color: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
    iconColor: "text-cyan-400",
  },
  {
    type: "SYSTEM_HACK",
    name: "System Hack",
    energy: 15,
    desc: "Disable target's defenses temporarily before an attack.",
    cooldown: "30 min",
    category: "Sabotage",
    color: "border-red-500/20",
    bg: "bg-red-500/5",
    iconColor: "text-red-400",
  },
  {
    type: "DATA_THEFT",
    name: "Data Theft",
    energy: 15,
    desc: "Steal tech points from the target nation.",
    cooldown: "15 min",
    category: "Theft",
    color: "border-amber-500/20",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    type: "MARKET_MANIPULATION",
    name: "Market Manipulation",
    energy: 20,
    desc: "Artificially inflate/deflate market prices for 30 minutes.",
    cooldown: "1 hr",
    category: "Economic",
    color: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    type: "EMP_STRIKE",
    name: "EMP Strike",
    energy: 40,
    desc: "Drain 50% of target's energy reserves instantly.",
    cooldown: "2 hr",
    category: "Sabotage",
    color: "border-blue-500/20",
    bg: "bg-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    type: "NETWORK_INFILTRATION",
    name: "Network Infiltration",
    energy: 15,
    desc: "See target's alliance plans for a period. Requires stealth.",
    cooldown: "30 min",
    category: "Intelligence",
    color: "border-violet-500/20",
    bg: "bg-violet-500/5",
    iconColor: "text-violet-400",
  },
  {
    type: "PROPAGANDA",
    name: "Propaganda Campaign",
    energy: 15,
    desc: "Reduce target's population morale, slowing growth by 15%.",
    cooldown: "45 min",
    category: "PsyOps",
    color: "border-pink-500/20",
    bg: "bg-pink-500/5",
    iconColor: "text-pink-400",
  },
  {
    type: "INFRASTRUCTURE_SABOTAGE",
    name: "Infrastructure Sabotage",
    energy: 25,
    desc: "Reduce target's energy regen for a period.",
    cooldown: "1 hr",
    category: "Sabotage",
    color: "border-orange-500/20",
    bg: "bg-orange-500/5",
    iconColor: "text-orange-400",
  },
];

interface ActiveOp {
  id: string;
  type: string;
  success: boolean | null;
  expiresAt: string | null;
  createdAt: string;
  defender: { name: string };
}

interface DefenseEntry {
  id: string;
  type: string;
  success: boolean | null;
  createdAt: string;
  attacker: { name: string };
}

function timeRemaining(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function opTypeName(type: string): string {
  const op = CYBER_OPS.find((o) => o.type === type);
  return op?.name ?? type.replace(/_/g, " ").toLowerCase();
}

export default function Cyber() {
  const { nation, refreshNation } = useGame();
  const [activeOps, setActiveOps] = useState<ActiveOp[]>([]);
  const [defenseLog, setDefenseLog] = useState<DefenseEntry[]>([]);
  const [launching, setLaunching] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<RankedNation | null>(null);
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<string | null>(null);

  // Nation picker state
  const [nations, setNations] = useState<RankedNation[]>([]);
  const [nationSearch, setNationSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.get<{
          activeOps: ActiveOp[];
          defenseLog: DefenseEntry[];
        }>("/nation/cyber");
        if (!cancelled) {
          setActiveOps(data.activeOps);
          setDefenseLog(data.defenseLog);
        }
      } catch {
        // No cyber data yet
      }
    }
    if (nation) load();
    return () => { cancelled = true; };
  }, [nation?.id]);

  // Fetch nations for target picker
  useEffect(() => {
    let cancelled = false;
    async function loadNations() {
      try {
        const data = await api.get<{ rankings: RankedNation[] }>("/rankings?limit=100");
        if (!cancelled) setNations(data.rankings);
      } catch {
        // ignore
      }
    }
    loadNations();
    return () => { cancelled = true; };
  }, []);

  if (!nation) return null;

  const cyberCenter = nation.buildings.find((b) => b.type === "CYBER_CENTER");
  const firewallArray = nation.buildings.find(
    (b) => b.type === "FIREWALL_ARRAY"
  );
  const cyberLevel = cyberCenter?.level ?? 0;
  const firewallLevel = firewallArray?.level ?? 0;
  const maxSlots = cyberLevel;
  const usedSlots = activeOps.filter(
    (op) => op.expiresAt && new Date(op.expiresAt) > new Date()
  ).length;

  // Success rate calculation
  const baseSuccessRate = 60 + 5 * cyberLevel;

  const filteredNations = nations.filter(
    (n) =>
      n.id !== nation.id &&
      (n.name.toLowerCase().includes(nationSearch.toLowerCase()) ||
        n.username.toLowerCase().includes(nationSearch.toLowerCase()))
  );

  async function handleLaunch(type: string) {
    if (!selectedTarget) {
      setError("Select a target nation first");
      return;
    }
    setError("");
    setResult(null);
    setLaunching(type);
    try {
      const data = await api.post<{
        op: ActiveOp;
        result: { success: boolean; [key: string]: unknown };
      }>("/nation/cyber/launch", { type, targetId: selectedTarget.id });
      if (data.result.success) {
        setResult(
          `${opTypeName(type)} succeeded against ${selectedTarget.name}!` +
            (data.result.stolen
              ? ` Stole ${data.result.stolen} tech points.`
              : "") +
            (data.result.drained
              ? ` Drained ${data.result.drained} energy.`
              : "")
        );
      } else {
        setResult(`${opTypeName(type)} failed against ${selectedTarget.name}. Target's defenses held.`);
      }
      await refreshNation();
      // Refresh cyber data
      const cyberData = await api.get<{
        activeOps: ActiveOp[];
        defenseLog: DefenseEntry[];
      }>("/nation/cyber");
      setActiveOps(cyberData.activeOps);
      setDefenseLog(cyberData.defenseLog);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Operation failed");
      }
    } finally {
      setLaunching(null);
      setSelectedOp(null);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Cyber Operations</h1>
        <p className="text-gray-500 text-sm mt-1">
          Execute covert operations against enemy nations
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <GameIcon name="building-cyber-center" size={18} />
            <span className="text-xs text-gray-500">Cyber Center</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {cyberLevel || (
              <span className="text-gray-600 text-sm">Not Built</span>
            )}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Active Op Slots</div>
          <div className="text-2xl font-bold text-white">
            {usedSlots}{" "}
            <span className="text-sm text-gray-500">/ {maxSlots}</span>
          </div>
        </div>
        <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <GameIcon name="resource-energy" size={18} />
            <span className="text-xs text-gray-500">Energy</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {Math.floor(nation.energy)}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <GameIcon name="building-firewall-array" size={18} />
            <span className="text-xs text-gray-500">Firewall</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {firewallLevel || (
              <span className="text-gray-600 text-sm">Not Built</span>
            )}
          </div>
          {cyberLevel > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Base success: {baseSuccessRate}%
            </div>
          )}
        </div>
      </div>

      {/* Error / Result messages */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-300 hover:text-red-200 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
      {result && (
        <div className={`text-sm rounded-lg px-4 py-3 flex items-center justify-between ${
          result.includes("succeeded")
            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
        }`}>
          <span>{result}</span>
          <button
            onClick={() => setResult(null)}
            className="text-gray-300 hover:text-gray-200 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* No Cyber Center warning */}
      {!cyberCenter && (
        <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-5 text-center">
          <GameIcon name="building-cyber-center" size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-amber-400 text-sm font-medium">
            Build a Cyber Center to unlock cyber operations
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Go to Nation Management to construct one
          </p>
        </div>
      )}

      {/* Active operations */}
      {activeOps.length > 0 && (
        <div className="bg-gray-900 border border-cyan-500/20 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-cyan-400 mb-3">
            Active Operations
          </h2>
          <div className="space-y-2">
            {activeOps.map((op) => {
              const iconKey = CYBER_ICON_KEY[op.type] ?? "cyber-hack";
              return (
                <div
                  key={op.id}
                  className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <GameIcon name={iconKey} size={24} />
                    <div>
                      <span className="text-sm text-gray-200 font-medium">
                        {opTypeName(op.type)}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {"\u2192"} {op.defender.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        op.success ? "text-emerald-400 bg-emerald-500/10" :
                        op.success === false ? "text-red-400 bg-red-500/10" :
                        "text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {op.success ? "Success" : op.success === false ? "Failed" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {op.expiresAt && (
                      <span className="text-sm text-cyan-400 font-mono tabular-nums">
                        {timeRemaining(op.expiresAt)}
                      </span>
                    )}
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Target picker + Operations grid (side by side on desktop) */}
      {cyberCenter && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Target picker - 1 col */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3">
              Select Target
            </h2>
            <input
              type="text"
              value={nationSearch}
              onChange={(e) => setNationSearch(e.target.value)}
              placeholder="Search nations..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 mb-3"
            />
            {selectedTarget && (
              <div className="mb-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
                <div>
                  <span className="text-sm text-cyan-400 font-medium">
                    {selectedTarget.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    #{selectedTarget.rank}
                  </span>
                  {selectedTarget.alliance && (
                    <span className="text-xs text-blue-400 ml-2">
                      [{selectedTarget.alliance.tag}]
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedTarget(null)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
            )}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredNations.length === 0 ? (
                <p className="text-xs text-gray-600 py-2 text-center">No nations found</p>
              ) : (
                filteredNations.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedTarget(n)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedTarget?.id === n.id
                        ? "bg-cyan-500/20 border border-cyan-500/30"
                        : "hover:bg-gray-800 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-6 tabular-nums">#{n.rank}</span>
                        <span className="text-gray-200">{n.name}</span>
                        {n.alliance && (
                          <span className="text-xs text-blue-400/70">[{n.alliance.tag}]</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">
                        {n.score.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Operations grid - 2 cols */}
          <div className="xl:col-span-2">
            <h2 className="text-sm font-semibold text-white mb-3">
              Available Operations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CYBER_OPS.map((op) => {
                const canAfford = nation.energy >= op.energy;
                const isLaunching = launching === op.type;
                const iconKey = CYBER_ICON_KEY[op.type] ?? "cyber-hack";

                return (
                  <div
                    key={op.type}
                    className={`${op.bg} border ${op.color} rounded-xl p-4 flex flex-col hover:scale-[1.01] transition-transform`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <GameIcon name={iconKey} size={32} className="shrink-0 rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-white">
                            {op.name}
                          </h3>
                          <span
                            className={`text-xs font-semibold ${canAfford ? "text-blue-400" : "text-red-400"}`}
                          >
                            {op.energy} EN
                          </span>
                        </div>
                        <span
                          className={`text-xs ${op.iconColor} bg-gray-800 px-1.5 py-0.5 rounded inline-block mt-1`}
                        >
                          {op.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 flex-1">
                      {op.desc}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        CD: {op.cooldown}
                      </span>
                      <button
                        onClick={() => handleLaunch(op.type)}
                        disabled={!canAfford || isLaunching || !selectedTarget}
                        className={`text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border ${
                          !canAfford || !selectedTarget
                            ? "bg-gray-800/50 border-gray-700 cursor-not-allowed opacity-50"
                            : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                        }`}
                      >
                        {isLaunching ? "Launching..." : !selectedTarget ? "Select Target" : "Execute"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cyber defense log */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">
          Cyber Defense Log
        </h2>
        {defenseLog.length === 0 ? (
          <p className="text-xs text-gray-600">
            No incoming cyber operations detected yet.
          </p>
        ) : (
          <div className="space-y-2">
            {defenseLog.map((entry) => {
              const iconKey = CYBER_ICON_KEY[entry.type] ?? "cyber-hack";
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <GameIcon name={iconKey} size={20} />
                    <span className="text-gray-300">
                      {opTypeName(entry.type)}
                    </span>
                    <span className="text-gray-600">
                      from {entry.attacker.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        entry.success === false
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-red-400 bg-red-500/10"
                      }`}
                    >
                      {entry.success === false ? "Blocked" : "Breached"}
                    </span>
                    <span className="text-xs text-gray-600">
                      {timeAgo(entry.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
