import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useGame } from "../context/GameContext";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { nation, round, loading, error, needsNation } = useGame();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-950 text-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-black tracking-tighter text-white mb-2">
            HEGEMON
          </div>
          <div className="text-sm text-gray-500">Loading game data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-950 text-gray-100 items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-2xl font-black tracking-tighter text-white mb-2">
            HEGEMON
          </div>
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (needsNation) {
    return <Navigate to="/game/create-nation" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        nationName={nation?.name ?? "Unknown"}
        allianceName={nation?.allianceMembership?.alliance?.name ?? null}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top resource bar */}
        <TopBar nation={nation} />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
