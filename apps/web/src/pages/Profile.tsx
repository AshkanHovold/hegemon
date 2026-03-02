import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const { nation, round } = useGame();

  const [nationName, setNationName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
                onClick={() => console.log("Update nation name:", nationName)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
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

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Email</label>
            <input
              type="email"
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
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => alert("Coming soon")}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Coming soon
            </button>
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
