import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/game", icon: "\u2302", label: "Dashboard", end: true },
  { to: "/game/nation", icon: "\ud83c\udfdb", label: "Nation" },
  { to: "/game/military", icon: "\u2694", label: "Military" },
  { to: "/game/cyber", icon: "\ud83d\udd12", label: "Cyber Ops" },
  { to: "/game/market", icon: "\ud83d\udcc8", label: "Market" },
  { to: "/game/alliance", icon: "\ud83e\udd1d", label: "Alliance" },
  { to: "/game/rankings", icon: "\ud83c\udfc6", label: "Rankings" },
  { to: "/game/profile", icon: "\u2699", label: "Profile" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  nationName: string;
  allianceName: string | null;
}

export default function Sidebar({
  collapsed,
  onToggle,
  nationName,
  allianceName,
}: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-56"
      } flex flex-col bg-gray-950 border-r border-gray-800 transition-all duration-200 shrink-0`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-white">
            HEGEMON
          </span>
        )}
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "\u25b6" : "\u25c0"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent"
              } ${collapsed ? "justify-center px-2" : ""}`
            }
          >
            <span className="text-lg shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-800 p-3">
        {!collapsed && (
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
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="text-base">{"\u23fb"}</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
