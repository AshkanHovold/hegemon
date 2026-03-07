import { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { api, ApiError } from "../lib/api";
import {
  BUILDING_DISPLAY,
  BUILDING_PRODUCTION,
  BUILDING_TIME_PER_LEVEL,
  ALL_BUILDING_TYPES,
  MAX_BUILDING_LEVEL,
  upgradeCost,
} from "../lib/gameConstants";
import { useCountdown } from "../hooks/useCountdown";
import { formatCost } from "../lib/format";
import GameIcon from "../components/GameIcon";
import HelpTooltip from "../components/HelpTooltip";
import type { Building, BuildingType } from "../lib/types";

/** Inline progress bar component for a building under construction */
function BuildProgress({ building }: { building: Building }) {
  const startTime =
    building.buildsAt
      ? new Date(
          new Date(building.buildsAt).getTime() -
            BUILDING_TIME_PER_LEVEL * building.level,
        ).toISOString()
      : null;

  const { percent, label } = useCountdown(building.buildsAt, startTime);

  if (!building.building || percent === null) return null;

  return (
    <div className="mt-3">
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-amber-400/80 mt-1 tabular-nums">
        {label === "Done" ? "Completing..." : `${label} remaining`}
      </div>
    </div>
  );
}

/** Progress bar row for the construction queue */
function QueueProgress({ building }: { building: Building }) {
  const startTime =
    building.buildsAt
      ? new Date(
          new Date(building.buildsAt).getTime() -
            BUILDING_TIME_PER_LEVEL * building.level,
        ).toISOString()
      : null;

  const { percent, label } = useCountdown(building.buildsAt, startTime);
  const display = BUILDING_DISPLAY[building.type];

  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GameIcon name={display.iconKey} size={20} />
          <span className="text-sm text-gray-200">
            {display.name} {"\u2192"} Lv.{building.level}
          </span>
        </div>
        <span className="text-sm text-amber-400 font-mono tabular-nums">
          {label}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000 ease-linear"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}

export default function Nation() {
  const { nation, refreshNation } = useGame();
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [constructing, setConstructing] = useState<string | null>(null);
  const [conscriptionRatio, setConscriptionRatio] = useState(50);
  const [savingConscription, setSavingConscription] = useState(false);

  useEffect(() => { document.title = "Nation - Hegemon"; }, []);

  if (!nation) return null;

  const totalPop = nation.population;
  const civilianPop = nation.civilians;
  const militaryPop = nation.military;
  const civilianPercent =
    totalPop > 0 ? Math.round((civilianPop / totalPop) * 100) : 50;

  const existingBuildings = nation.buildings;
  const constructionQueue = existingBuildings.filter((b) => b.building);
  const ownedTypes = new Set(existingBuildings.map((b) => b.type));
  const unbuiltTypes = ALL_BUILDING_TYPES.filter((t) => !ownedTypes.has(t));

  async function handleUpgrade(building: Building) {
    setError("");
    setUpgrading(building.id);
    try {
      await api.post(`/nation/buildings/${building.id}/upgrade`, {});
      await refreshNation();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Upgrade failed");
      }
    } finally {
      setUpgrading(null);
    }
  }

  async function handleConstruct(type: BuildingType) {
    setError("");
    setConstructing(type);
    try {
      await api.post("/nation/buildings/construct", { type });
      await refreshNation();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Construction failed");
      }
    } finally {
      setConstructing(null);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Nation Management <HelpTooltip articleId="buildings-overview" size="md" />
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Build and upgrade your infrastructure
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

      {/* Construction Queue */}
      {constructionQueue.length > 0 && (
        <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-amber-400 mb-3">
            Construction Queue ({constructionQueue.length})
          </h2>
          <div className="space-y-2">
            {constructionQueue.map((item) => (
              <QueueProgress key={item.id} building={item} />
            ))}
          </div>
        </div>
      )}

      {/* Existing Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {existingBuildings.map((b) => {
          const display = BUILDING_DISPLAY[b.type];
          const prod = BUILDING_PRODUCTION[b.type];
          const nextLevel = b.level + 1;
          const isMaxLevel = b.level >= MAX_BUILDING_LEVEL;
          const cost = upgradeCost(nextLevel);
          const isUpgrading = upgrading === b.id;

          return (
            <div
              key={b.id}
              className={`bg-gray-900 border rounded-xl p-5 flex flex-col transition-colors ${
                b.building
                  ? "border-amber-500/30 hover:border-amber-500/50"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <GameIcon name={display.iconKey} size={36} className="rounded-lg" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {display.name}
                    </h3>
                    <span className="text-xs text-blue-400">
                      Level {b.level}
                      {b.building && (
                        <span className="text-amber-400 ml-1">(Upgrading)</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400 tabular-nums">
                    {b.level}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-2">{display.desc}</p>
              <p className="text-xs text-emerald-400 mb-2">
                {prod.label} (Lv.{b.level}: {b.level}x)
              </p>

              {/* Progress bar for buildings under construction */}
              <BuildProgress building={b} />

              <div className="mt-auto flex items-center justify-between pt-3">
                {isMaxLevel ? (
                  <span className="text-xs text-emerald-400 font-medium">Max Level</span>
                ) : (
                  <div className="text-xs text-gray-500">
                    <span className="text-amber-400">
                      ${formatCost(cost.cash)}
                    </span>
                    {" + "}
                    <span className="text-slate-300">
                      {formatCost(cost.materials)} mat
                    </span>
                  </div>
                )}
                <button
                  onClick={() => handleUpgrade(b)}
                  disabled={b.building || isUpgrading || isMaxLevel}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  {isMaxLevel
                    ? "Max Level"
                    : isUpgrading
                      ? "Upgrading..."
                      : b.building
                        ? "Building..."
                        : `Upgrade to ${nextLevel}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Construct New Buildings */}
      {unbuiltTypes.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-white">
            Construct New Buildings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {unbuiltTypes.map((type) => {
              const display = BUILDING_DISPLAY[type];
              const prod = BUILDING_PRODUCTION[type];
              const cost = upgradeCost(1);
              const isConstructing = constructing === type;

              return (
                <div
                  key={type}
                  className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-5 flex flex-col hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <GameIcon name={display.iconKey} size={36} className="rounded-lg opacity-60" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300">
                        {display.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        Not yet built
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">{display.desc}</p>
                  <p className="text-xs text-emerald-400/70 mb-4">
                    {prod.label}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <span className="text-amber-400">
                        ${formatCost(cost.cash)}
                      </span>
                      {" + "}
                      <span className="text-slate-300">
                        {formatCost(cost.materials)} mat
                      </span>
                    </div>
                    <button
                      onClick={() => handleConstruct(type)}
                      disabled={isConstructing}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {isConstructing ? "Building..." : "Construct"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Population Management */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <GameIcon name="resource-population" size={22} /> Population Management <HelpTooltip articleId="population" />
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500">Total Population</div>
            <div className="text-xl font-bold text-violet-400 tabular-nums">
              {totalPop.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500">Civilians</div>
            <div className="text-xl font-bold text-emerald-400 tabular-nums">
              {civilianPop.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500">Military</div>
            <div className="text-xl font-bold text-red-400 tabular-nums">
              {militaryPop.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500">Civilian / Military</div>
            <div className="text-xl font-bold text-blue-400">
              {civilianPercent}% / {100 - civilianPercent}%
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Population Split
          </label>
          <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500/50"
              style={{ width: `${civilianPercent}%` }}
            />
            <div
              className="h-full bg-red-500/50"
              style={{ width: `${100 - civilianPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Civilians ({civilianPop.toLocaleString()})</span>
            <span>Military ({militaryPop.toLocaleString()})</span>
          </div>
        </div>

        {/* Conscription Ratio Slider */}
        <div className="mt-6 border-t border-gray-800 pt-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Conscription Ratio
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Adjust the balance between civilian workforce and military personnel.
            More civilians means faster economy growth. More military means a bigger army.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>10% military</span>
              <span className="text-sm font-medium text-blue-400">
                {conscriptionRatio}% military
              </span>
              <span>90% military</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={conscriptionRatio}
              onChange={(e) => setConscriptionRatio(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {conscriptionRatio <= 30
                  ? "Economy focused - faster resource generation"
                  : conscriptionRatio >= 70
                    ? "Military focused - larger standing army"
                    : "Balanced - moderate growth and defense"}
              </span>
              <button
                onClick={async () => {
                  setSavingConscription(true);
                  setError("");
                  try {
                    await api.post("/nation/conscription", {
                      ratio: conscriptionRatio,
                    });
                    await refreshNation();
                  } catch (err) {
                    if (err instanceof ApiError) {
                      setError(err.message);
                    } else {
                      setError("Failed to update conscription ratio");
                    }
                  } finally {
                    setSavingConscription(false);
                  }
                }}
                disabled={savingConscription}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {savingConscription ? "Saving..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
