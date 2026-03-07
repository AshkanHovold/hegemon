import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { api, ApiError } from "../lib/api";
import { useToast } from "../components/Toast";
import NationEmblem, { useNationEmblem } from "../components/NationEmblem";
import EmblemPicker from "../components/EmblemPicker";

interface LifetimeStats {
  roundsPlayed: number;
  totalWins: number;
  totalLosses: number;
  bestRank: number | null;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { nation, round, refreshNation } = useGame();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const { emblem, setEmblem } = useNationEmblem();
  const [showEmblemPicker, setShowEmblemPicker] = useState(false);
  const [achievementCount, setAchievementCount] = useState<number | null>(null);
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null);
  const [loginStreak, setLoginStreak] = useState<number | null>(null);

  const [nationName, setNationName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => { document.title = "Profile - Hegemon"; }, []);

  // Fetch achievements count
  useEffect(() => {
    async function fetchAchievements() {
      try {
        const data = await api.get<{ achievements: unknown[] }>("/nation/achievements");
        setAchievementCount(data.achievements.length);
      } catch {
        // API not available
      }
    }
    fetchAchievements();
  }, []);

  // Fetch lifetime stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.get<{ stats: LifetimeStats }>("/auth/stats");
        setLifetimeStats(data.stats);
      } catch {
        // API not available
      }
    }
    fetchStats();
  }, []);

  // Fetch login streak
  useEffect(() => {
    async function fetchStreak() {
      try {
        const data = await api.get<{ streak: number }>("/auth/login-streak");
        setLoginStreak(data.streak);
      } catch {
        // API not available
      }
    }
    fetchStreak();
  }, []);

  const [notifications, setNotifications] = useState({
    attacks: true,
    construction: true,
    market: false,
    alliance: true,
    energy: true,
    roundEvents: true,
  });

  // Sync form state when context data loads
  useEffect(() => {
    setNationName(nation?.name ?? "");
  }, [nation?.name]);

  useEffect(() => {
    setEmail(user?.email ?? "");
  }, [user?.email]);

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function daysRemaining(): number | null {
    if (!round?.endsAt) return null;
    const now = new Date();
    const end = new Date(round.endsAt);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const remaining = daysRemaining();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Nation Settings */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Nation Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Nation Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nationName}
                onChange={(e) => setNationName(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
              />
              <button
                disabled={saving || nationName === nation?.name}
                onClick={async () => {
                  setSaving(true);
                  setSaveMsg("");
                  try {
                    await api.patch("/nation/name", { name: nationName });
                    toast("success", "Nation name updated");
                    setSaveMsg("Name updated!");
                    await refreshNation();
                  } catch (err) {
                    if (err instanceof ApiError) {
                      setSaveMsg(err.message);
                      toast("error", err.message);
                    } else {
                      setSaveMsg("Failed to update name");
                      toast("error", "Failed to update name");
                    }
                  } finally {
                    setSaving(false);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
            {saveMsg && (
              <p className={`text-xs mt-1 ${saveMsg.startsWith("Name") ? "text-emerald-400" : "text-red-400"}`}>
                {saveMsg}
              </p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Can be changed once per round.
            </p>
          </div>

          {/* Current Round Info */}
          {round && (
            <div className="border-t border-gray-800 pt-4">
              <h3 className="text-xs text-gray-500 mb-3">Current Round</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-500">Round</div>
                  <div className="text-sm font-medium text-gray-200">
                    #{round.number}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-500">Phase</div>
                  <div className="text-sm font-medium text-gray-200">
                    {round.phase}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-500">Days Left</div>
                  <div className="text-sm font-medium text-gray-200">
                    {remaining !== null ? remaining : "--"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emblem */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Nation Emblem</h2>
        <div className="flex items-center gap-4">
          <NationEmblem color={emblem.color} symbol={emblem.symbol} size={64} />
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Your emblem represents your nation across the game.
            </p>
            <button
              onClick={() => setShowEmblemPicker(true)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
            >
              Change Emblem
            </button>
          </div>
        </div>
      </div>

      {showEmblemPicker && (
        <EmblemPicker
          current={emblem}
          onSave={(config) => {
            setEmblem(config);
            setShowEmblemPicker(false);
            toast("success", "Emblem updated");
          }}
          onClose={() => setShowEmblemPicker(false)}
        />
      )}

      {/* Achievements Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Achievements</h2>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {achievementCount !== null ? (
              <>
                <span className="text-lg font-bold text-amber-400">
                  {achievementCount}
                </span>{" "}
                / 14 unlocked
              </>
            ) : (
              <span className="text-gray-600">No data available</span>
            )}
          </div>
          <Link
            to="/game/achievements"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            View All
          </Link>
        </div>
      </div>

      {/* Lifetime Stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Lifetime Stats
        </h2>
        {lifetimeStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500">Rounds Played</div>
              <div className="text-lg font-bold text-blue-400 tabular-nums">
                {lifetimeStats.roundsPlayed}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500">Total Wins</div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums">
                {lifetimeStats.totalWins}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500">Total Losses</div>
              <div className="text-lg font-bold text-red-400 tabular-nums">
                {lifetimeStats.totalLosses}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500">Best Rank</div>
              <div className="text-lg font-bold text-amber-400 tabular-nums">
                {lifetimeStats.bestRank !== null
                  ? `#${lifetimeStats.bestRank}`
                  : "--"}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Stats will be available after completing your first round.
          </p>
        )}
      </div>

      {/* Daily Login Streak */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">
          Daily Login Streak
        </h2>
        <div className="flex items-center gap-3">
          <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <svg
              className="w-6 h-6 text-orange-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="text-2xl font-bold text-orange-400 tabular-nums">
                {loginStreak !== null ? loginStreak : "--"}
              </div>
              <div className="text-xs text-gray-500">
                {loginStreak === 1 ? "day" : "days"}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Log in every day to build your streak. Longer streaks may unlock
            special rewards in future updates.
          </p>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Account Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Username
            </label>
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">
              {user?.username ?? "—"}
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} autoComplete="on">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-xs text-gray-500 mb-3">Change Password</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="current-password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="new-password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled
                  className="bg-blue-600/50 text-white/60 text-sm font-medium px-4 py-2 rounded-lg cursor-not-allowed"
                >
                  Save Changes
                </button>
                <span className="text-xs text-gray-600">Account editing coming soon</span>
              </div>
            </div>
          </form>

          <div className="flex gap-2 mt-4">
            <button
              onClick={logout}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-gray-700"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Notification Preferences
        </h2>
        <div className="space-y-3">
          {(
            [
              {
                key: "attacks" as const,
                label: "Incoming Attacks",
                desc: "Get notified when your nation is attacked",
              },
              {
                key: "construction" as const,
                label: "Construction Complete",
                desc: "Building and upgrade completions",
              },
              {
                key: "market" as const,
                label: "Market Orders",
                desc: "Order fills and market updates",
              },
              {
                key: "alliance" as const,
                label: "Alliance Activity",
                desc: "Chat messages, war declarations, member joins",
              },
              {
                key: "energy" as const,
                label: "Energy Full",
                desc: "Notify when energy is fully recharged",
              },
              {
                key: "roundEvents" as const,
                label: "Round Events",
                desc: "Phase changes, round start/end",
              },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-800/80 transition-colors"
            >
              <div>
                <div className="text-sm text-gray-200">{item.label}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
              <div
                onClick={(e) => {
                  e.preventDefault();
                  toggleNotification(item.key);
                }}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifications[item.key] ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications[item.key] ? "left-5" : "left-1"
                  }`}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Round History */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-2">
          Round History
        </h2>
        <p className="text-sm text-gray-500">
          Round history will be available after the first round ends.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-gray-900 border border-red-500/20 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-red-400 mb-2">
          Danger Zone
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button
          onClick={() => alert("Coming soon")}
          className="bg-red-700 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-red-600"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
