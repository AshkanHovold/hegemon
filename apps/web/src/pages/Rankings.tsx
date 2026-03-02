import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useGame } from "../context/GameContext";

type RankingFilter = "overall" | "military" | "economic";

interface RankedNation {
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

function formatScore(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function Rankings() {
  const { nation, round } = useGame();
  const [filter, setFilter] = useState<RankingFilter>("overall");
  const [rankings, setRankings] = useState<RankedNation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRankings() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<{ rankings: RankedNation[] }>(
          "/rankings?limit=50"
        );
        if (!cancelled) {
          setRankings(data.rankings);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load rankings"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRankings();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortKey =
    filter === "military"
      ? "military"
      : filter === "economic"
        ? "economic"
        : "score";

  // Re-sort and re-rank based on selected filter
  const sorted = [...rankings]
    .sort((a, b) => b[sortKey] - a[sortKey])
    .map((r, i) => ({ ...r, rank: i + 1 }));

  // Build subtitle from round data
  const subtitle = round
    ? (() => {
        const start = new Date(round.startedAt).getTime();
        const end = new Date(round.endsAt).getTime();
        const now = Date.now();
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const currentDay = Math.max(
          1,
          Math.ceil((now - start) / (1000 * 60 * 60 * 24))
        );
        const phase =
          round.phase === "GROWTH"
            ? "Growth Phase"
            : round.phase === "OPEN"
              ? "Open Phase"
              : round.phase === "ENDGAME"
                ? "Endgame"
                : "Ended";
        return `Round ${round.number} \u00b7 Day ${currentDay} of ${totalDays} \u00b7 ${phase}`;
      })()
    : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Rankings</h1>
        {subtitle && (
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        )}
      </div>

      {/* Tab selector */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-800 text-white border border-gray-700"
          >
            Individual
          </button>
        </div>

        <div className="ml-auto flex gap-1">
          {(["overall", "military", "economic"] as RankingFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-500 hover:text-gray-300 border border-transparent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <svg
              className="animate-spin h-5 w-5 mr-3 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading rankings...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-400">
            {error}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            No nations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-gray-800">
                  <th className="px-5 py-3 font-medium w-16">Rank</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Alliance</th>
                  <th className="px-5 py-3 font-medium text-right">
                    {filter === "military"
                      ? "Military"
                      : filter === "economic"
                        ? "Economic"
                        : "Score"}
                  </th>
                  {filter === "overall" && (
                    <>
                      <th className="px-5 py-3 font-medium text-right">
                        Military
                      </th>
                      <th className="px-5 py-3 font-medium text-right">
                        Economic
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sorted.map((r) => {
                  const isYou = nation !== null && r.id === nation.id;
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-800/50 ${
                        isYou ? "bg-blue-500/5" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`font-bold tabular-nums ${
                            r.rank === 1
                              ? "text-amber-400"
                              : r.rank === 2
                                ? "text-gray-300"
                                : r.rank === 3
                                  ? "text-orange-400"
                                  : "text-gray-500"
                          }`}
                        >
                          #{r.rank}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-200 font-medium">
                        {r.name}
                        {isYou && (
                          <span className="text-xs text-blue-400 ml-1.5">
                            (you)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs font-mono">
                        {r.alliance ? `[${r.alliance.tag}]` : "-"}
                      </td>
                      <td className="px-5 py-3 text-right text-white font-semibold tabular-nums">
                        {formatScore(r[sortKey])}
                      </td>
                      {filter === "overall" && (
                        <>
                          <td className="px-5 py-3 text-right text-red-400 tabular-nums">
                            {formatScore(r.military)}
                          </td>
                          <td className="px-5 py-3 text-right text-emerald-400 tabular-nums">
                            {formatScore(r.economic)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
