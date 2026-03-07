import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { formatScore } from "../lib/format";
import { useGame } from "../context/GameContext";
import HelpTooltip from "../components/HelpTooltip";

type RankingFilter = "overall" | "military" | "economic";
type ViewMode = "individual" | "alliance";

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

interface AllianceRanking {
  tag: string;
  name: string;
  memberCount: number;
  totalScore: number;
  totalMilitary: number;
  totalEconomic: number;
}

export default function Rankings() {
  const { nation, round } = useGame();
  const [filter, setFilter] = useState<RankingFilter>("overall");
  const [viewMode, setViewMode] = useState<ViewMode>("individual");
  const [rankings, setRankings] = useState<RankedNation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { document.title = "Rankings - Hegemon"; }, []);

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
    // Refresh rankings every 60 seconds
    const interval = setInterval(fetchRankings, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
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

  // Apply search filter
  const searchLower = search.toLowerCase();
  const filteredSorted = search
    ? sorted.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.username.toLowerCase().includes(searchLower) ||
          r.alliance?.tag.toLowerCase().includes(searchLower) ||
          r.alliance?.name.toLowerCase().includes(searchLower)
      )
    : sorted;

  // Aggregate alliance rankings
  const allianceRankings: AllianceRanking[] = (() => {
    const map = new Map<string, AllianceRanking>();
    for (const r of rankings) {
      if (!r.alliance) continue;
      const key = r.alliance.tag;
      const existing = map.get(key);
      if (existing) {
        existing.memberCount++;
        existing.totalScore += r.score;
        existing.totalMilitary += r.military;
        existing.totalEconomic += r.economic;
      } else {
        map.set(key, {
          tag: r.alliance.tag,
          name: r.alliance.name,
          memberCount: 1,
          totalScore: r.score,
          totalMilitary: r.military,
          totalEconomic: r.economic,
        });
      }
    }
    const arr = Array.from(map.values());
    const allianceSortKey =
      filter === "military"
        ? "totalMilitary"
        : filter === "economic"
          ? "totalEconomic"
          : "totalScore";
    arr.sort((a, b) => b[allianceSortKey] - a[allianceSortKey]);
    return arr;
  })();

  const myAllianceTag = nation?.allianceMembership?.alliance?.tag ?? null;

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

  // Get #1 ranked player for spotlight
  const topPlayer = sorted.length > 0 ? sorted[0] : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">Rankings <HelpTooltip articleId="scoring" size="md" /></h1>
        {subtitle && (
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        )}
      </div>

      {/* #1 Player Spotlight */}
      {topPlayer && !loading && viewMode === "individual" && (
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-5 flex items-center gap-4">
          <div className="text-3xl shrink-0">
            <svg className="w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-amber-400/70 uppercase tracking-wider font-semibold mb-0.5">
              #1 Player Spotlight
            </div>
            <div className="text-xl font-bold text-white">{topPlayer.name}</div>
            <div className="text-sm text-gray-400">
              {formatScore(topPlayer[sortKey])} {filter === "military" ? "military" : filter === "economic" ? "economic" : "score"}
              {topPlayer.alliance && (
                <span className="text-blue-400 ml-2">[{topPlayer.alliance.tag}]</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search + Tab selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nations..."
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 w-48"
        />
        <div className="flex gap-2">
          {(["individual", "alliance"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                viewMode === mode
                  ? "bg-gray-800 text-white border border-gray-700"
                  : "text-gray-500 hover:text-gray-300 border border-transparent"
              }`}
            >
              {mode}
            </button>
          ))}
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
        ) : viewMode === "individual" ? (
          filteredSorted.length === 0 ? (
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
                  {filteredSorted.map((r) => {
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
                          <span className="inline-flex items-center gap-1">
                            {r.name}
                            {isYou && (
                              <span className="text-xs text-blue-400 ml-0.5">
                                (you)
                              </span>
                            )}
                            {/* Rising/falling indicator based on score gap to neighbors */}
                            {(() => {
                              const idx = filteredSorted.indexOf(r);
                              const prev = idx > 0 ? filteredSorted[idx - 1] : null;
                              const next = idx < filteredSorted.length - 1 ? filteredSorted[idx + 1] : null;
                              const gap = next ? r[sortKey] - next[sortKey] : 0;
                              const aboveGap = prev ? prev[sortKey] - r[sortKey] : Infinity;
                              if (gap > 0 && aboveGap > gap * 2) {
                                // Close to player below, far from player above = falling
                                return (
                                  <svg className="w-3 h-3 text-red-400 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 10l5 5 5-5H7z" />
                                  </svg>
                                );
                              }
                              if (aboveGap < gap * 0.5 && prev) {
                                // Close to player above = rising
                                return (
                                  <svg className="w-3 h-3 text-emerald-400 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 14l5-5 5 5H7z" />
                                  </svg>
                                );
                              }
                              return null;
                            })()}
                          </span>
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
          )
        ) : allianceRankings.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            No alliances found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-gray-800">
                  <th className="px-5 py-3 font-medium w-16">Rank</th>
                  <th className="px-5 py-3 font-medium">Alliance</th>
                  <th className="px-5 py-3 font-medium text-right">Members</th>
                  <th className="px-5 py-3 font-medium text-right">
                    {filter === "military"
                      ? "Military"
                      : filter === "economic"
                        ? "Economic"
                        : "Total Score"}
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
                {allianceRankings.map((a, i) => {
                  const isYours = myAllianceTag === a.tag;
                  const allianceSortValue =
                    filter === "military"
                      ? a.totalMilitary
                      : filter === "economic"
                        ? a.totalEconomic
                        : a.totalScore;
                  return (
                    <tr
                      key={a.tag}
                      className={`hover:bg-gray-800/50 ${
                        isYours ? "bg-blue-500/5" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`font-bold tabular-nums ${
                            i === 0
                              ? "text-amber-400"
                              : i === 1
                                ? "text-gray-300"
                                : i === 2
                                  ? "text-orange-400"
                                  : "text-gray-500"
                          }`}
                        >
                          #{i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-gray-200 font-medium">
                          {a.name}
                        </span>
                        <span className="text-blue-400 text-xs font-mono ml-2">
                          [{a.tag}]
                        </span>
                        {isYours && (
                          <span className="text-xs text-blue-400 ml-1.5">
                            (yours)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 tabular-nums">
                        {a.memberCount}
                      </td>
                      <td className="px-5 py-3 text-right text-white font-semibold tabular-nums">
                        {formatScore(allianceSortValue)}
                      </td>
                      {filter === "overall" && (
                        <>
                          <td className="px-5 py-3 text-right text-red-400 tabular-nums">
                            {formatScore(a.totalMilitary)}
                          </td>
                          <td className="px-5 py-3 text-right text-emerald-400 tabular-nums">
                            {formatScore(a.totalEconomic)}
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
