import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useGame } from "../context/GameContext";
import type { TechBranchData, TechNodeStatus } from "../lib/types";

const BRANCH_STYLES: Record<string, { color: string; lineColor: string; bgColor: string; bgCompleted: string }> = {
  MILITARY: {
    color: "text-red-400",
    lineColor: "bg-red-500/30",
    bgColor: "border-red-500/20",
    bgCompleted: "border-red-500/50 bg-red-500/10",
  },
  ECONOMY: {
    color: "text-emerald-400",
    lineColor: "bg-emerald-500/30",
    bgColor: "border-emerald-500/20",
    bgCompleted: "border-emerald-500/50 bg-emerald-500/10",
  },
  CYBER: {
    color: "text-cyan-400",
    lineColor: "bg-cyan-500/30",
    bgColor: "border-cyan-500/20",
    bgCompleted: "border-cyan-500/50 bg-cyan-500/10",
  },
};

function formatTime(ms: number): string {
  if (ms <= 0) return "Done";
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  const hrs = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hrs}h ${remMin}m`;
}

export default function TechTree() {
  const { nation, refreshNation } = useGame();
  const [branches, setBranches] = useState<TechBranchData[]>([]);
  const [techPoints, setTechPoints] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Tech Tree - Hegemon";
  }, []);

  const fetchTech = useCallback(async () => {
    try {
      const data = await api.get<{ branches: TechBranchData[]; techPoints: number; energy: number }>("/nation/tech");
      setBranches(data.branches);
      setTechPoints(data.techPoints);
      setEnergy(data.energy);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tech tree");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTech();
  }, [fetchTech]);

  // Refresh tech data when nation changes (e.g. from WS tick)
  useEffect(() => {
    if (nation) {
      setTechPoints(nation.techPoints);
      setEnergy(nation.energy);
    }
  }, [nation?.techPoints, nation?.energy]);

  // Countdown timer for active research
  const [, setTick] = useState(0);
  useEffect(() => {
    const hasActive = branches.some((b) => b.nodes.some((n) => n.status === "researching"));
    if (!hasActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [branches]);

  async function startResearch(branch: string, nodeId: string) {
    setResearching(true);
    setError(null);
    try {
      await api.post("/nation/tech/research", { branch, nodeId });
      await fetchTech();
      await refreshNation();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Research failed";
      setError(msg);
    } finally {
      setResearching(false);
    }
  }

  async function cancelResearch() {
    setResearching(true);
    try {
      await api.post("/nation/tech/cancel", {});
      await fetchTech();
      await refreshNation();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setResearching(false);
    }
  }

  function canResearch(node: TechNodeStatus, branchNodes: TechNodeStatus[]): boolean {
    if (node.status !== "locked") return false;
    if (node.tier === 1) return true;
    const prev = branchNodes.find((n) => n.tier === node.tier - 1);
    return prev?.status === "completed";
  }

  const hasActiveResearch = branches.some((b) => b.nodes.some((n) => n.status === "researching"));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading tech tree...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tech Tree</h1>
          <p className="text-gray-400 text-sm mt-1">
            Research technologies to gain strategic advantages
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-gray-400">Tech Points: </span>
            <span className="text-purple-400 font-semibold">{Math.floor(techPoints)}</span>
          </div>
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-gray-400">Energy: </span>
            <span className="text-blue-400 font-semibold">{Math.floor(energy)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Branches */}
      <div className="space-y-8">
        {branches.map((branch) => {
          const style = BRANCH_STYLES[branch.key] || BRANCH_STYLES.MILITARY;
          return (
            <div key={branch.key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className={`text-sm font-semibold ${style.color} mb-4`}>
                {branch.name} Branch
              </h2>

              {/* Horizontal scrollable node list */}
              <div className="overflow-x-auto">
                <div className="flex items-center gap-0 min-w-max pb-2">
                  {branch.nodes.map((node, idx) => {
                    const isCompleted = node.status === "completed";
                    const isResearching = node.status === "researching";
                    const isAvailable = canResearch(node, branch.nodes);
                    const remaining = isResearching && node.researchAt
                      ? Math.max(0, new Date(node.researchAt).getTime() - Date.now())
                      : 0;

                    return (
                      <div key={node.id} className="flex items-center">
                        {/* Node card */}
                        <div
                          className={`relative bg-gray-800 border rounded-xl p-4 w-56 flex-shrink-0 transition-all ${
                            isCompleted
                              ? style.bgCompleted
                              : isResearching
                                ? `${style.bgColor} ring-1 ring-amber-500/30`
                                : isAvailable
                                  ? `${style.bgColor} hover:bg-gray-750`
                                  : `${style.bgColor} opacity-50`
                          }`}
                        >
                          {/* Status icon */}
                          <div className="absolute top-3 right-3">
                            {isCompleted ? (
                              <svg className={`w-4 h-4 ${style.color}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : isResearching ? (
                              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>

                          {/* Node content */}
                          <div className="text-xs text-gray-500 mb-1">Tier {node.tier}</div>
                          <h3 className={`text-sm font-semibold mb-1 ${isCompleted ? "text-white" : "text-gray-300"}`}>
                            {node.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-3">{node.desc}</p>

                          {isResearching ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-amber-400 font-medium">Researching...</span>
                                <span className="text-amber-400">{formatTime(remaining)}</span>
                              </div>
                              {/* Progress bar */}
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-amber-500 h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, ((node.researchTimeMs - remaining) / node.researchTimeMs) * 100))}%`,
                                  }}
                                />
                              </div>
                              <button
                                onClick={cancelResearch}
                                disabled={researching}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                Cancel (no refund)
                              </button>
                            </div>
                          ) : isCompleted ? (
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${style.color} font-medium`}>Researched</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {node.costTP} TP &middot; {formatTime(node.researchTimeMs)}
                              </span>
                              {isAvailable && !hasActiveResearch && (
                                <button
                                  onClick={() => startResearch(branch.key, node.id)}
                                  disabled={researching || techPoints < node.costTP || energy < 10}
                                  className="text-xs font-medium px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Research
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Connector line between nodes */}
                        {idx < branch.nodes.length - 1 && (
                          <div className="flex items-center px-1 flex-shrink-0">
                            <div className={`w-8 h-0.5 ${isCompleted ? style.lineColor.replace("/30", "/60") : style.lineColor}`} />
                            <svg
                              className={`w-3 h-3 -ml-1 ${style.color} ${isCompleted ? "opacity-60" : "opacity-30"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prerequisites note */}
              <p className="text-xs text-gray-600 mt-3">
                Each node requires the previous node in the branch to be researched first.
              </p>
            </div>
          );
        })}
      </div>

      {/* Info card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">How It Works</h2>
        <div className="text-xs text-gray-500 leading-relaxed space-y-1">
          <p>Research technologies using Tech Points earned from your Research Lab. Each branch offers unique advantages.</p>
          <p>You can only research one technology at a time. Each tier requires the previous one to be completed first.</p>
          <p>Research costs 10 energy plus the listed Tech Points. Cancelling does not refund resources.</p>
        </div>
      </div>
    </div>
  );
}
