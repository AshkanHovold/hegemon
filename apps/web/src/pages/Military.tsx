import { useState, useEffect, useCallback } from "react";
import { useGame } from "../context/GameContext";
import { api, ApiError } from "../lib/api";
import { TROOP_STATS, ALL_UNIT_TYPES } from "../lib/gameConstants";
import { useCountdown } from "../hooks/useCountdown";
import type {
  UnitType,
  RankedNation,
  AttackResult,
  AttackLogEntry,
} from "../lib/types";

/** Progress bar row for a troop in training */
function TrainProgress({
  name,
  icon,
  count,
  trainsAt,
  trainTimeMs,
}: {
  name: string;
  icon: string;
  count: number;
  trainsAt: string;
  trainTimeMs: number;
}) {
  const startTime = new Date(
    new Date(trainsAt).getTime() - trainTimeMs,
  ).toISOString();

  const { percent, label } = useCountdown(trainsAt, startTime);

  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-200">
          {icon} Training {count.toLocaleString()} {name}
        </span>
        <span className="text-sm text-red-400 font-mono tabular-nums">
          {label}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000 ease-linear"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function formatScore(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Military() {
  const { nation, refreshNation } = useGame();
  const [selectedUnit, setSelectedUnit] = useState<UnitType>("INFANTRY");
  const [trainQuantity, setTrainQuantity] = useState(10);
  const [error, setError] = useState("");
  const [training, setTraining] = useState(false);

  // Attack state
  const [nations, setNations] = useState<RankedNation[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<RankedNation | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [attacking, setAttacking] = useState(false);
  const [lastResult, setLastResult] = useState<
    (AttackResult & { defenderName: string }) | null
  >(null);

  // Attack history
  const [attackLog, setAttackLog] = useState<AttackLogEntry[]>([]);

  // Fetch nations list for the picker
  const fetchNations = useCallback(async () => {
    try {
      const data = await api.get<{ rankings: RankedNation[] }>(
        "/rankings?limit=100",
      );
      setNations(data.rankings);
    } catch {
      // silently fail — not critical
    }
  }, []);

  const fetchAttackLog = useCallback(async () => {
    try {
      const data = await api.get<{ attacks: AttackLogEntry[] }>(
        "/nation/attacks",
      );
      setAttackLog(data.attacks);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNations();
    fetchAttackLog();
  }, [fetchNations, fetchAttackLog]);

  if (!nation) return null;

  // Build troop data from nation.troops
  const troopMap = new Map(nation.troops.map((t) => [t.type, t]));

  const troopData = ALL_UNIT_TYPES.map((type) => {
    const troop = troopMap.get(type);
    const stats = TROOP_STATS[type];
    return {
      type,
      name: stats.name,
      icon: stats.icon,
      count: troop?.count ?? 0,
      training: troop?.training ?? 0,
      trainsAt: troop?.trainsAt ?? null,
      atk: stats.atk,
      def: stats.def,
      costCash: stats.costCash,
      costMaterials: stats.costMaterials,
      trainTimeMs: stats.trainTimeMs,
    };
  });

  const totalAtk = troopData.reduce((s, t) => s + t.count * t.atk, 0);
  const totalDef = troopData.reduce((s, t) => s + t.count * t.def, 0);
  const totalTroops = troopData.reduce((s, t) => s + t.count, 0);

  const trainingQueue = troopData.filter((t) => t.training > 0);

  const selectedStats = TROOP_STATS[selectedUnit];
  const totalCost = {
    cash: selectedStats.costCash * trainQuantity,
    materials: selectedStats.costMaterials * trainQuantity,
  };

  // Filter nations for attack picker (exclude self)
  const filteredNations = nations
    .filter((n) => n.id !== nation.id)
    .filter(
      (n) =>
        !searchQuery ||
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  async function handleTrain() {
    setError("");
    setTraining(true);
    try {
      await api.post("/nation/troops/train", {
        type: selectedUnit,
        count: trainQuantity,
      });
      await refreshNation();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Training failed");
      }
    } finally {
      setTraining(false);
    }
  }

  async function handleAttack() {
    if (!selectedTarget) return;
    setError("");
    setAttacking(true);
    setLastResult(null);
    try {
      const data = await api.post<{
        attack: AttackResult;
        defender: { name: string };
      }>("/nation/attack", { defenderId: selectedTarget.id });
      setLastResult({ ...data.attack, defenderName: data.defender.name });
      await refreshNation();
      fetchNations();
      fetchAttackLog();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Attack failed");
      }
    } finally {
      setAttacking(false);
    }
  }

  const missileDef = nation.buildings.find(
    (b) => b.type === "MISSILE_DEFENSE" && !b.building,
  );
  const fortBonus = missileDef ? missileDef.level * 5 : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Military Command</h1>
        <p className="text-gray-500 text-sm mt-1">
          Train troops, launch attacks, and defend your nation
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-3 text-red-300 hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Attack Result Banner */}
      {lastResult && (
        <div
          className={`rounded-xl p-4 border ${
            lastResult.attackerWon
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">
              {lastResult.attackerWon ? "\u2694\uFE0F" : "\uD83D\uDEE1\uFE0F"}
            </span>
            <div>
              <h3
                className={`font-bold ${lastResult.attackerWon ? "text-emerald-400" : "text-red-400"}`}
              >
                {lastResult.attackerWon ? "Victory!" : "Defeat!"}
              </h3>
              <p className="text-xs text-gray-400">
                Attack on {lastResult.defenderName} &mdash;{" "}
                {lastResult.attackPower.toLocaleString()} ATK vs{" "}
                {lastResult.defensePower.toLocaleString()} DEF
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-500 mb-1">Your losses</div>
              <div className="space-y-0.5">
                {Object.entries(lastResult.attackerLosses)
                  .filter(([, v]) => v > 0)
                  .map(([unit, count]) => (
                    <div key={unit} className="text-red-300">
                      -{count} {TROOP_STATS[unit as UnitType]?.name ?? unit}
                    </div>
                  ))}
                {Object.values(lastResult.attackerLosses).every(
                  (v) => v === 0,
                ) && <div className="text-gray-600">None</div>}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Enemy losses</div>
              <div className="space-y-0.5">
                {Object.entries(lastResult.defenderLosses)
                  .filter(([, v]) => v > 0)
                  .map(([unit, count]) => (
                    <div key={unit} className="text-emerald-300">
                      -{count} {TROOP_STATS[unit as UnitType]?.name ?? unit}
                    </div>
                  ))}
                {Object.values(lastResult.defenderLosses).every(
                  (v) => v === 0,
                ) && <div className="text-gray-600">None</div>}
              </div>
            </div>
          </div>
          {lastResult.attackerWon &&
            (lastResult.lootCash > 0 || lastResult.lootMaterials > 0) && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs text-emerald-400">
                Looted: ${lastResult.lootCash.toLocaleString()} cash,{" "}
                {lastResult.lootMaterials.toLocaleString()} materials
              </div>
            )}
          <button
            onClick={() => setLastResult(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Training Queue */}
      {trainingQueue.length > 0 && (
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-red-400 mb-3">
            Training Queue ({trainingQueue.length})
          </h2>
          <div className="space-y-2">
            {trainingQueue.map((item) => (
              <TrainProgress
                key={item.type}
                name={item.name}
                icon={item.icon}
                count={item.training}
                trainsAt={item.trainsAt!}
                trainTimeMs={item.trainTimeMs}
              />
            ))}
          </div>
        </div>
      )}

      {/* Military overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500">Total Troops</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {totalTroops.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500">Attack Power</div>
          <div className="text-2xl font-bold text-red-400 tabular-nums">
            {totalAtk.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500">Defense Power</div>
          <div className="text-2xl font-bold text-blue-400 tabular-nums">
            {totalDef.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500">Fortification Bonus</div>
          <div className="text-2xl font-bold text-amber-400">+{fortBonus}%</div>
        </div>
      </div>

      {/* Troop overview table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Troop Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-gray-800">
                <th className="px-5 py-2 font-medium">Unit</th>
                <th className="px-5 py-2 font-medium text-right">Count</th>
                <th className="px-5 py-2 font-medium text-right">Training</th>
                <th className="px-5 py-2 font-medium text-right">ATK</th>
                <th className="px-5 py-2 font-medium text-right">DEF</th>
                <th className="px-5 py-2 font-medium text-right">Total ATK</th>
                <th className="px-5 py-2 font-medium text-right">Total DEF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {troopData.map((t) => (
                <tr key={t.type} className="hover:bg-gray-800/50">
                  <td className="px-5 py-3 text-gray-200">
                    <span className="mr-2">{t.icon}</span>
                    {t.name}
                  </td>
                  <td className="px-5 py-3 text-right text-white font-semibold tabular-nums">
                    {t.count.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {t.training > 0 ? (
                      <span className="text-amber-400">
                        +{t.training.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-red-400 tabular-nums">
                    {t.atk}
                  </td>
                  <td className="px-5 py-3 text-right text-blue-400 tabular-nums">
                    {t.def}
                  </td>
                  <td className="px-5 py-3 text-right text-red-300 tabular-nums">
                    {(t.count * t.atk).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-blue-300 tabular-nums">
                    {(t.count * t.def).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Train Units
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Unit Type
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value as UnitType)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
              >
                {ALL_UNIT_TYPES.map((type) => {
                  const s = TROOP_STATS[type];
                  return (
                    <option key={type} value={type}>
                      {s.icon} {s.name} (ATK: {s.atk}, DEF: {s.def})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                value={trainQuantity}
                onChange={(e) =>
                  setTrainQuantity(Math.max(1, Number(e.target.value)))
                }
                min={1}
                max={10000}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Cash cost:</span>
                <span className="text-amber-400">
                  ${totalCost.cash.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Materials cost:</span>
                <span className="text-slate-300">
                  {totalCost.materials.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Energy cost:</span>
                <span className="text-blue-400">3</span>
              </div>
            </div>

            <button
              onClick={handleTrain}
              disabled={training}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              {training
                ? "Training..."
                : `Train ${trainQuantity} ${TROOP_STATS[selectedUnit].name}`}
            </button>
          </div>

          {/* Military population info */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">
              Military Population
            </h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Military pop:</span>
                <span className="text-gray-300">
                  {nation.military.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Troops in service:</span>
                <span className="text-gray-300">
                  {totalTroops.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>In training:</span>
                <span className="text-amber-400">
                  {trainingQueue
                    .reduce((s, t) => s + t.training, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-400 border-t border-gray-700 pt-1 mt-1">
                <span>Available to recruit:</span>
                <span className="text-emerald-400">
                  {Math.max(
                    0,
                    nation.military -
                      totalTroops -
                      trainingQueue.reduce((s, t) => s + t.training, 0),
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attack section — Nation Picker */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Launch Attack
          </h2>

          <div className="space-y-4">
            {/* Search input */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Select Target
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedTarget) setSelectedTarget(null);
                }}
                placeholder="Search nations..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Nation list */}
            <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
              {filteredNations.length === 0 ? (
                <div className="text-xs text-gray-600 py-2 text-center">
                  {nations.length === 0
                    ? "Loading nations..."
                    : "No nations found"}
                </div>
              ) : (
                filteredNations.map((n) => {
                  const isSelected = selectedTarget?.id === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelectedTarget(isSelected ? null : n)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-red-500/20 border border-red-500/40"
                          : "bg-gray-800 hover:bg-gray-750 border border-transparent hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-500 font-mono w-6 shrink-0">
                          #{n.rank}
                        </span>
                        <div className="min-w-0">
                          <div className="text-gray-200 truncate">
                            {n.name}
                            {n.alliance && (
                              <span className="text-blue-400 ml-1 text-xs">
                                [{n.alliance.tag}]
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {n.username}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs text-red-400 tabular-nums">
                          {formatScore(n.military)} mil
                        </div>
                        <div className="text-xs text-gray-500 tabular-nums">
                          {formatScore(n.score)} score
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Attack info panel */}
            <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Your attack power:</span>
                <span className="text-red-400">
                  {totalAtk.toLocaleString()}
                </span>
              </div>
              {selectedTarget && (
                <div className="flex justify-between mt-1">
                  <span>Target military score:</span>
                  <span className="text-blue-400">
                    {selectedTarget.military.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between mt-1">
                <span>Energy cost:</span>
                <span className="text-blue-400">25 energy</span>
              </div>
              {selectedTarget && (
                <div className="flex justify-between mt-1">
                  <span>Odds:</span>
                  <span
                    className={
                      totalAtk > selectedTarget.military
                        ? "text-emerald-400"
                        : totalAtk > selectedTarget.military * 0.7
                          ? "text-amber-400"
                          : "text-red-400"
                    }
                  >
                    {totalAtk > selectedTarget.military
                      ? "Favorable"
                      : totalAtk > selectedTarget.military * 0.7
                        ? "Risky"
                        : "Unfavorable"}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleAttack}
              disabled={!selectedTarget || attacking || totalTroops === 0}
              className="w-full bg-red-700 hover:bg-red-600 disabled:bg-red-700/50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors text-sm border border-red-600"
            >
              {attacking
                ? "Attacking..."
                : selectedTarget
                  ? `Attack ${selectedTarget.name}`
                  : "Select a target"}
            </button>
          </div>
        </div>
      </div>

      {/* Attack History */}
      {attackLog.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">
              Battle History
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {attackLog.map((a) => {
              const won = a.isAttacker ? a.attackerWon : !a.attackerWon;
              const opponent = a.isAttacker ? a.defender.name : a.attacker.name;
              const myLosses = a.isAttacker
                ? a.attackerLosses
                : a.defenderLosses;
              const totalMyLosses = Object.values(myLosses).reduce(
                (s, v) => s + v,
                0,
              );

              return (
                <div
                  key={a.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        won
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {won ? "WON" : "LOST"}
                    </span>
                    <div>
                      <div className="text-sm text-gray-200">
                        {a.isAttacker ? "Attacked" : "Defended vs"}{" "}
                        <span className="text-white font-medium">
                          {opponent}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {timeAgo(a.createdAt)}
                        {totalMyLosses > 0 && (
                          <span className="text-red-400 ml-2">
                            -{totalMyLosses} troops
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {a.isAttacker &&
                      a.attackerWon &&
                      a.lootCash != null &&
                      a.lootCash > 0 && (
                        <div className="text-xs text-emerald-400">
                          +${a.lootCash.toLocaleString()}
                        </div>
                      )}
                    {a.isAttacker &&
                      a.attackerWon &&
                      a.lootMaterials != null &&
                      a.lootMaterials > 0 && (
                        <div className="text-xs text-emerald-400">
                          +{a.lootMaterials.toLocaleString()} mat
                        </div>
                      )}
                    {!a.isAttacker && !a.attackerWon && (
                      <div className="text-xs text-emerald-400">Repelled</div>
                    )}
                    {!a.isAttacker && a.attackerWon && a.lootCash != null && (
                      <div className="text-xs text-red-400">
                        -${a.lootCash.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
