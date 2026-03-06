import { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { api, ApiError } from "../lib/api";
import ConfirmDialog from "../components/ConfirmDialog";
import HelpTooltip from "../components/HelpTooltip";

interface AllianceInfo {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  treasury: number;
  members: {
    id: string;
    nationId: string;
    role: string;
    joinedAt: string;
    nation: {
      id: string;
      name: string;
      population: number;
      military: number;
      cash: number;
    };
  }[];
  createdAt: string;
}

interface AllianceListing {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  memberCount: number;
  totalPower: number;
}

function formatRole(role: string): string {
  switch (role) {
    case "PRESIDENT":
      return "President";
    case "VICE_PRESIDENT":
      return "Vice President";
    case "MINISTER_OF_WAR":
      return "War Minister";
    case "MINISTER_OF_INTELLIGENCE":
      return "Intel Minister";
    case "MINISTER_OF_TRADE":
      return "Trade Minister";
    default:
      return "Member";
  }
}

const ROLE_RANK: Record<string, number> = {
  PRESIDENT: 4,
  VICE_PRESIDENT: 3,
  MINISTER_OF_WAR: 2,
  MINISTER_OF_INTELLIGENCE: 2,
  MINISTER_OF_TRADE: 2,
  MEMBER: 1,
};

const PROMOTABLE_ROLES = [
  { value: "VICE_PRESIDENT", label: "Vice President" },
  { value: "MINISTER_OF_WAR", label: "War Minister" },
  { value: "MINISTER_OF_INTELLIGENCE", label: "Intel Minister" },
  { value: "MINISTER_OF_TRADE", label: "Trade Minister" },
  { value: "MEMBER", label: "Member" },
];

function roleColor(role: string): string {
  if (role === "PRESIDENT") return "text-amber-400";
  if (role.startsWith("MINISTER") || role === "VICE_PRESIDENT")
    return "text-blue-400";
  return "text-gray-500";
}

function NoAlliance({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [tab, setTab] = useState<"create" | "browse">("browse");
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alliances, setAlliances] = useState<AllianceListing[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.get<{ alliances: AllianceListing[] }>(
          "/alliances"
        );
        if (!cancelled) setAlliances(data.alliances);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    if (!name.trim() || !tag.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      await api.post("/alliance", {
        name: name.trim(),
        tag: tag.trim(),
        description: desc.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to create alliance");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin(allianceId: string) {
    setError("");
    try {
      await api.post("/alliance/join", { allianceId });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to join alliance");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">Alliance <HelpTooltip articleId="alliance-overview" size="md" /></h1>
        <p className="text-gray-500 mt-2">
          Join or create an alliance to unlock coordinated warfare, shared
          resources, and the alliance chat.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setTab("browse")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "browse"
              ? "bg-gray-800 text-white border border-gray-700"
              : "text-gray-500 hover:text-gray-300 border border-transparent"
          }`}
        >
          Browse Alliances
        </button>
        <button
          onClick={() => setTab("create")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "create"
              ? "bg-gray-800 text-white border border-gray-700"
              : "text-gray-500 hover:text-gray-300 border border-transparent"
          }`}
        >
          Create Alliance
        </button>
      </div>

      {tab === "create" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Alliance Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Steel Pact"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Tag (2-5 chars)
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              placeholder="SP"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Description (optional)
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="We fight for glory..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 h-20 resize-none"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={submitting || !name.trim() || !tag.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {submitting ? "Creating..." : "Create Alliance"}
          </button>
        </div>
      )}

      {tab === "browse" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loadingList ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Loading alliances...
            </div>
          ) : alliances.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No alliances exist yet. Be the first to create one!
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {alliances.map((a) => (
                <div
                  key={a.id}
                  className="px-5 py-4 flex items-center justify-between hover:bg-gray-800/50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {a.name}
                      </span>
                      <span className="text-xs text-blue-400 font-mono">
                        [{a.tag}]
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {a.memberCount}/20 members &middot; {a.totalPower}{" "}
                      military power
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoin(a.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Alliance() {
  const { nation, refreshNation } = useGame();
  const [alliance, setAlliance] = useState<AllianceInfo | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  async function fetchAlliance() {
    try {
      const data = await api.get<{
        alliance: AllianceInfo | null;
        membership: { role: string } | null;
      }>("/alliance");
      setAlliance(data.alliance);
      setMyRole(data.membership?.role ?? null);
    } catch {
      // no alliance
      setAlliance(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { document.title = "Alliance - Hegemon"; }, []);

  useEffect(() => {
    if (nation) fetchAlliance();
  }, [nation?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
        Loading alliance data...
      </div>
    );
  }

  if (!alliance) {
    return (
      <NoAlliance
        onCreated={async () => {
          await fetchAlliance();
          await refreshNation();
        }}
      />
    );
  }

  const totalPower = alliance.members.reduce(
    (sum, m) => sum + m.nation.military,
    0
  );

  async function handleLeave() {
    setShowLeaveDialog(false);
    setError("");
    try {
      await api.delete("/alliance/leave");
      setAlliance(null);
      setMyRole(null);
      await refreshNation();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to leave alliance");
    }
  }

  async function handleKick(memberId: string) {
    setError("");
    try {
      await api.post("/alliance/kick", { memberId });
      await fetchAlliance();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to kick member");
    }
  }

  async function handlePromote(memberId: string, role: string) {
    setError("");
    try {
      await api.post("/alliance/promote", { memberId, role });
      await fetchAlliance();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to promote member");
    }
  }

  const canManageMembers =
    myRole === "PRESIDENT" || myRole === "VICE_PRESIDENT";

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">Alliance <HelpTooltip articleId="alliance-overview" size="md" /></h1>
        <p className="text-gray-500 text-sm mt-1">
          Coordinate with your alliance members
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Alliance header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-wrap items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">
              {alliance.name}
            </span>
            <span className="text-sm text-blue-400 font-mono">
              [{alliance.tag}]
            </span>
          </div>
          {alliance.description && (
            <p className="text-xs text-gray-500 mt-1">
              {alliance.description}
            </p>
          )}
          <p className="text-xs text-gray-600 mt-0.5">
            Your role: <span className={roleColor(myRole ?? "")}>{formatRole(myRole ?? "MEMBER")}</span>
          </p>
        </div>

        <div className="flex gap-6 ml-auto items-center">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {alliance.members.length}/20
            </div>
            <div className="text-xs text-gray-500">Members</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">
              ${alliance.treasury.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Treasury</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-400">
              {totalPower.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total Power</div>
          </div>
          <button
            onClick={() => setShowLeaveDialog(true)}
            className="bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Members</h2>
          </div>
          <div className="divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
            {alliance.members.map((m) => {
              const isYou = m.nationId === nation?.id;
              const myRank = ROLE_RANK[myRole ?? "MEMBER"] ?? 1;
              const memberRank = ROLE_RANK[m.role] ?? 1;
              const canKick = canManageMembers && !isYou && memberRank < myRank;
              const canPromote = myRole === "PRESIDENT" && !isYou;
              return (
                <div
                  key={m.id}
                  className={`px-4 py-3 flex items-center justify-between ${
                    isYou ? "bg-blue-500/5" : ""
                  }`}
                >
                  <div>
                    <div className="text-sm text-gray-200">
                      {m.nation.name}
                      {isYou && (
                        <span className="text-xs text-blue-400 ml-1">
                          (you)
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${roleColor(m.role)}`}>
                      {formatRole(m.role)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 tabular-nums">
                        {m.nation.population.toLocaleString()} pop
                      </div>
                      <div className="text-xs text-red-400 tabular-nums">
                        {m.nation.military.toLocaleString()} mil
                      </div>
                    </div>
                    {(canKick || canPromote) && (
                      <div className="flex items-center gap-1 ml-1">
                        {canPromote && (
                          <select
                            value={m.role}
                            onChange={(e) => handlePromote(m.id, e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 px-1 py-0.5 focus:outline-none focus:border-blue-500"
                          >
                            {PROMOTABLE_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {canKick && (
                          <button
                            onClick={() => handleKick(m.id)}
                            className="text-xs text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                          >
                            Kick
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat placeholder */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[400px]">
          <div className="px-5 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Alliance Chat</h2>
          </div>

          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
            Real-time chat coming soon (WebSocket)
          </div>

          <div className="border-t border-gray-800 p-3 flex gap-2">
            <input
              type="text"
              disabled
              placeholder="Chat coming soon..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              disabled
              className="bg-blue-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* War room placeholder */}
      <div className="bg-gray-900 border border-red-500/20 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-red-400 mb-3">War Room</h2>
        <p className="text-sm text-gray-500">
          No active wars. Alliance warfare will be available in the Open phase.
        </p>
      </div>

      {/* Leave confirmation dialog */}
      <ConfirmDialog
        open={showLeaveDialog}
        title={myRole === "PRESIDENT" ? "Dissolve Alliance" : "Leave Alliance"}
        message={
          myRole === "PRESIDENT"
            ? "As president, leaving will dissolve the entire alliance. This cannot be undone. Continue?"
            : "Are you sure you want to leave the alliance?"
        }
        confirmLabel={myRole === "PRESIDENT" ? "Dissolve & Leave" : "Leave Alliance"}
        variant={myRole === "PRESIDENT" ? "danger" : "default"}
        onConfirm={handleLeave}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </div>
  );
}
