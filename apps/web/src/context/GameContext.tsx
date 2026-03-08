import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "./AuthContext";
import { gameWs } from "../lib/ws";
import type { Nation, Round } from "../lib/types";

interface GameContextType {
  nation: Nation | null;
  round: Round | null;
  loading: boolean;
  error: string | null;
  needsNation: boolean;
  createNation: (name: string) => Promise<void>;
  refreshNation: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [nation, setNation] = useState<Nation | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsNation, setNeedsNation] = useState(false);

  const fetchGameData = useCallback(async () => {
    if (!user) {
      setNation(null);
      setRound(null);
      setNeedsNation(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsNation(false);

    try {
      // Fetch active round
      const roundData = await api.get<{ round: Round }>("/round/active");
      setRound(roundData.round);

      // Fetch nation
      try {
        const nationData = await api.get<{ nation: Nation }>("/nation");
        setNation(nationData.nation);
        setNeedsNation(false);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNation(null);
          setNeedsNation(true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // No active round
        setError("No active round found. The game may not have started yet.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load game data");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  const createNation = useCallback(
    async (name: string) => {
      if (!round) {
        throw new Error("No active round");
      }

      const data = await api.post<{ nation: Nation }>("/nation", {
        name,
        roundId: round.id,
      });

      setNation(data.nation);
      setNeedsNation(false);

      // Re-fetch full nation data to get all includes
      await fetchGameData();
    },
    [round, fetchGameData],
  );

  const refreshNation = useCallback(async () => {
    if (!user) return;
    try {
      const nationData = await api.get<{ nation: Nation }>("/nation");
      setNation(nationData.nation);
    } catch (err) {
      console.error("Failed to refresh nation:", err);
    }
  }, [user]);

  // WebSocket: connect when authenticated, auto-refresh on server events
  useEffect(() => {
    if (!token) {
      gameWs.disconnect();
      return;
    }

    gameWs.connect(token);

    const unsubs = [
      gameWs.on("tick", () => refreshNation()),
      gameWs.on("attacked", () => refreshNation()),
      gameWs.on("attack_resolved", () => refreshNation()),
      gameWs.on("order_filled", () => refreshNation()),
      gameWs.on("order_matched", () => refreshNation()),
      gameWs.on("new_message", () => refreshNation()),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
      gameWs.disconnect();
    };
  }, [token, refreshNation]);

  // Smart auto-refresh: check every second if any build/train timer has elapsed
  const completedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!nation) return;
    const id = setInterval(() => {
      const now = Date.now();
      let shouldRefresh = false;

      for (const b of nation.buildings) {
        if (b.building && b.buildsAt) {
          const key = `build-${b.id}`;
          if (new Date(b.buildsAt).getTime() <= now && !completedRef.current.has(key)) {
            completedRef.current.add(key);
            shouldRefresh = true;
          }
        }
      }

      for (const t of nation.troops) {
        if (t.training > 0 && t.trainsAt) {
          const key = `train-${t.id}`;
          if (new Date(t.trainsAt).getTime() <= now && !completedRef.current.has(key)) {
            completedRef.current.add(key);
            shouldRefresh = true;
          }
        }
      }

      for (const tech of nation.techNodes) {
        if (tech.researching && tech.researchAt) {
          const key = `tech-${tech.branch}-${tech.node}`;
          if (new Date(tech.researchAt).getTime() <= now && !completedRef.current.has(key)) {
            completedRef.current.add(key);
            shouldRefresh = true;
          }
        }
      }

      if (shouldRefresh) refreshNation();
    }, 1000);
    return () => clearInterval(id);
  }, [nation, refreshNation]);

  // Fallback polling every 5 minutes (WebSocket handles real-time updates)
  useEffect(() => {
    if (!user || !nation) return;
    const id = setInterval(() => {
      refreshNation();
    }, 300_000);
    return () => clearInterval(id);
  }, [user, nation?.id, refreshNation]);

  return (
    <GameContext.Provider
      value={{ nation, round, loading, error, needsNation, createNation, refreshNation }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return ctx;
}
