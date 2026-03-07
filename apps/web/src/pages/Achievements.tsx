import { useState, useEffect } from "react";
import { api } from "../lib/api";
import GameIcon from "../components/GameIcon";

interface AchievementDef {
  key: string;
  title: string;
  desc: string;
  icon: string;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { key: "FIRST_BUILD", title: "First Foundation", desc: "Upgrade a building", icon: "building-residential" },
  { key: "FIRST_ARMY", title: "Call to Arms", desc: "Train troops beyond starting forces", icon: "unit-infantry" },
  { key: "FIRST_BLOOD", title: "First Blood", desc: "Win your first attack", icon: "unit-armor" },
  { key: "DEFENDER", title: "Iron Wall", desc: "Successfully defend an attack", icon: "building-missile-defense" },
  { key: "TYCOON", title: "Tycoon", desc: "Accumulate 100,000 cash", icon: "resource-cash" },
  { key: "INDUSTRIALIST", title: "Industrialist", desc: "Accumulate 50,000 materials", icon: "resource-materials" },
  { key: "ARCHITECT", title: "Master Architect", desc: "Build all 11 building types", icon: "building-commercial" },
  { key: "FORTIFIED", title: "Fully Fortified", desc: "Max level any building", icon: "building-power-plant" },
  { key: "WARLORD", title: "Warlord", desc: "Win 10 attacks", icon: "unit-air-force" },
  { key: "SPY_MASTER", title: "Spy Master", desc: "Use all 8 cyber op types", icon: "cyber-hack" },
  { key: "TRADER", title: "Market Mogul", desc: "Complete 10 trades", icon: "resource-materials" },
  { key: "ALLIANCE_FOUNDER", title: "Alliance Founder", desc: "Create an alliance", icon: "building-intelligence-hq" },
  { key: "TOP_10", title: "Elite", desc: "Reach top 10 rankings", icon: "building-commercial" },
  { key: "MILLION", title: "Millionaire", desc: "Reach 1,000,000 cash", icon: "resource-cash" },
];

interface UnlockedAchievement {
  type: string;
  unlockedAt: string | null;
  unlocked: boolean;
}

export default function Achievements() {
  const [unlocked, setUnlocked] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Achievements - Hegemon";
  }, []);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const data = await api.get<{ achievements: UnlockedAchievement[] }>("/nation/achievements");
        const map = new Map<string, string>();
        for (const a of data.achievements) {
          if (a.unlocked && a.unlockedAt) {
            map.set(a.type, a.unlockedAt);
          }
        }
        setUnlocked(map);
      } catch {
        // API not available yet - show all as locked
      } finally {
        setLoading(false);
      }
    }
    fetchAchievements();
  }, []);

  const unlockedCount = unlocked.size;
  const totalCount = ACHIEVEMENT_DEFS.length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Achievements
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading
            ? "Loading achievements..."
            : `${unlockedCount} / ${totalCount} unlocked`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-sm font-medium text-blue-400">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ACHIEVEMENT_DEFS.map((def) => {
          const isUnlocked = unlocked.has(def.key);
          const unlockedAt = unlocked.get(def.key);

          return (
            <div
              key={def.key}
              className={`relative bg-gray-900 border rounded-xl p-5 flex flex-col items-center text-center transition-all ${
                isUnlocked
                  ? "border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                  : "border-gray-800 opacity-60"
              }`}
            >
              {/* Lock overlay for locked achievements */}
              {!isUnlocked && (
                <div className="absolute top-3 right-3">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center mb-3 ${
                  isUnlocked
                    ? "bg-amber-500/20"
                    : "bg-gray-800 grayscale"
                }`}
              >
                <GameIcon name={def.icon} size={36} />
              </div>

              {/* Title */}
              <h3
                className={`text-sm font-semibold mb-1 ${
                  isUnlocked ? "text-amber-400" : "text-gray-500"
                }`}
              >
                {def.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-gray-500 mb-2">{def.desc}</p>

              {/* Unlock date */}
              {isUnlocked && unlockedAt && (
                <p className="text-xs text-emerald-400 mt-auto">
                  Unlocked{" "}
                  {new Date(unlockedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              {!isUnlocked && (
                <p className="text-xs text-gray-600 mt-auto">Locked</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
