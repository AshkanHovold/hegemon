import { useState } from "react";
import { Outlet, Navigate, NavLink } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Tutorial from "./Tutorial";
import WhileAway from "./WhileAway";
import { useGame } from "../context/GameContext";

const MOBILE_NAV = [
  { to: "/game", label: "Dashboard", icon: "home", end: true },
  { to: "/game/nation", label: "Nation", icon: "nation" },
  { to: "/game/military", label: "Military", icon: "military" },
  { to: "/game/market", label: "Market", icon: "market" },
];

const MORE_NAV = [
  { to: "/game/cyber", label: "Cyber Ops" },
  { to: "/game/alliance", label: "Alliance" },
  { to: "/game/rankings", label: "Rankings" },
  { to: "/game/profile", label: "Profile" },
  { to: "/game/help", label: "Help" },
];

function MobileNavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "home":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
        </svg>
      );
    case "nation":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case "military":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case "market":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-3 left-3 z-40 md:hidden bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, bottom nav used instead */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        nationName={nation?.name ?? "Unknown"}
        allianceName={nation?.allianceMembership?.alliance?.name ?? null}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top resource bar */}
        <TopBar nation={nation} />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gray-950 border-t border-gray-800 flex items-center justify-around px-1 py-1.5 safe-area-bottom">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-blue-400"
                  : "text-gray-500"
              }`
            }
          >
            <MobileNavIcon icon={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            moreOpen ? "text-blue-400" : "text-gray-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
          <span>More</span>
        </button>
      </nav>

      {/* More panel (slide-up) */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-14 left-0 right-0 z-[61] md:hidden bg-gray-900 border-t border-gray-800 rounded-t-xl p-4 animate-slide-up safe-area-bottom">
            <div className="grid grid-cols-3 gap-2">
              {MORE_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `text-center py-3 px-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "bg-gray-800 text-gray-400 hover:text-gray-200 border border-transparent"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tutorial overlay */}
      <Tutorial />

      {/* While-away modal */}
      <WhileAway />
    </div>
  );
}
