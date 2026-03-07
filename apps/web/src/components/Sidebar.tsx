import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/game", icon: "/assets/icons/resource-cash.png", label: "Dashboard", end: true, tutorialId: null },
  { to: "/game/nation", icon: "/assets/icons/building-residential.png", label: "Nation", tutorialId: "nav-nation" },
  { to: "/game/military", icon: "/assets/icons/unit-infantry.png", label: "Military", tutorialId: "nav-military" },
  { to: "/game/cyber", icon: "/assets/icons/cyber-hack.png", label: "Cyber Ops", tutorialId: "nav-cyber" },
  { to: "/game/market", icon: "/assets/icons/resource-materials.png", label: "Market", tutorialId: "nav-market" },
  { to: "/game/alliance", icon: "/assets/icons/building-intelligence-hq.png", label: "Alliance", tutorialId: "nav-alliance" },
  { to: "/game/achievements", icon: "/assets/icons/resource-tech.png", label: "Achievements", tutorialId: null },
  { to: "/game/messages", icon: "messages", label: "Messages", tutorialId: null },
  { to: "/game/rankings", icon: "/assets/icons/building-commercial.png", label: "Rankings", tutorialId: null },
  { to: "/game/profile", icon: "/assets/icons/building-research-lab.png", label: "Profile", tutorialId: null },
  { to: "/game/help", icon: "help", label: "Help", tutorialId: "nav-help" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  nationName: string;
  allianceName: string | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
  nationName,
  allianceName,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleNavClick() {
    onMobileClose?.();
  }

  return (
    <aside
      className={`
        ${collapsed ? "w-16" : "w-56"}
        hidden md:flex flex-col bg-gray-950 border-r border-gray-800 transition-all duration-200 shrink-0

        ${mobileOpen
          ? "!fixed inset-y-0 left-0 z-50 !flex !w-56 shadow-2xl shadow-black/50"
          : ""
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        {(!collapsed || mobileOpen) && (
          <span className="text-lg font-bold tracking-tight text-white">
            HEGEMON
          </span>
        )}
        {/* Close button on mobile, collapse toggle on desktop */}
        {mobileOpen ? (
          <button
            onClick={onMobileClose}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 md:hidden"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 hidden md:block"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "\u25b6" : "\u25c0"}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={handleNavClick}
            title={collapsed && !mobileOpen ? item.label : undefined}
            data-tutorial={item.tutorialId ?? undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent"
              } ${collapsed && !mobileOpen ? "justify-center px-2" : ""}`
            }
          >
            {item.icon === "help" ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : item.icon === "messages" ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <img
                src={item.icon}
                alt={item.label}
                className="w-5 h-5 shrink-0 object-contain"
                loading="lazy"
              />
            )}
            {(!collapsed || mobileOpen) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-800 p-3">
        {(!collapsed || mobileOpen) && (
          <div className="mb-2 px-1">
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Nation
            </div>
            <div className="text-sm font-semibold text-gray-200 truncate">
              {nationName}
            </div>
            {allianceName && (
              <div className="text-xs text-blue-400 truncate">
                {allianceName}
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 w-full text-sm text-gray-500 hover:text-red-400 transition-colors px-1 py-1 rounded ${
            collapsed && !mobileOpen ? "justify-center" : ""
          }`}
        >
          <span className="text-base">{"\u23fb"}</span>
          {(!collapsed || mobileOpen) && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
