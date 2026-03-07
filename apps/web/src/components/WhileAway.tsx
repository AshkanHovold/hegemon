import { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { calculateProductionRates } from "../lib/gameConstants";
import { formatNumber } from "../lib/format";
import { api } from "../lib/api";

const LS_KEY = "hegemon_last_visit";
const THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

interface NationEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export default function WhileAway() {
  const { nation } = useGame();
  const [visible, setVisible] = useState(false);
  const [earned, setEarned] = useState({
    cash: 0,
    materials: 0,
    food: 0,
    tech: 0,
  });
  const [attacks, setAttacks] = useState<NationEvent[]>([]);

  useEffect(() => {
    if (!nation) return;

    const lastVisit = localStorage.getItem(LS_KEY);
    const now = Date.now();

    // Always update last visit
    localStorage.setItem(LS_KEY, now.toString());

    if (!lastVisit) return; // first visit, nothing to show

    const elapsed = now - Number(lastVisit);
    if (elapsed < THRESHOLD_MS) return;

    // Calculate approximate resources earned
    const rates = calculateProductionRates(nation.buildings);
    const tickInterval = 10 * 60 * 1000; // 10 minutes
    const ticksElapsed = Math.floor(elapsed / tickInterval);

    if (ticksElapsed > 0) {
      setEarned({
        cash: rates.cashRate * ticksElapsed,
        materials: rates.materialsRate * ticksElapsed,
        food: rates.foodRate * ticksElapsed,
        tech: rates.techRate * ticksElapsed,
      });
    }

    // Fetch attack events
    async function fetchAttacks() {
      try {
        const data = await api.get<{ events: NationEvent[] }>("/nation/events");
        const attackEvents = data.events.filter(
          (e) =>
            e.type === "ATTACK_RECEIVED" ||
            e.type === "DEFENSE" ||
            e.message.toLowerCase().includes("attack"),
        );
        const cutoff = Number(lastVisit);
        const recentAttacks = attackEvents.filter(
          (e) => new Date(e.createdAt).getTime() > cutoff,
        );
        setAttacks(recentAttacks);
      } catch {
        // endpoint may not exist yet
      }
    }

    fetchAttacks();
    setVisible(true);
  }, [nation?.id]);

  function dismiss() {
    setVisible(false);
  }

  if (!visible) return null;

  const hasResources =
    earned.cash > 0 || earned.materials > 0 || earned.food > 0 || earned.tech > 0;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={dismiss} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-[380px] max-w-[90vw] animate-slide-up">
        <h2 className="text-lg font-bold text-white mb-1">
          While you were away...
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Your nation has been busy producing resources.
        </p>

        {hasResources && (
          <div className="space-y-2 mb-4">
            {earned.cash > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Cash earned</span>
                <span className="text-amber-400 font-semibold">
                  +{formatNumber(earned.cash)}
                </span>
              </div>
            )}
            {earned.materials > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Materials earned</span>
                <span className="text-slate-300 font-semibold">
                  +{formatNumber(earned.materials)}
                </span>
              </div>
            )}
            {earned.food > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Food earned</span>
                <span className="text-emerald-400 font-semibold">
                  +{formatNumber(earned.food)}
                </span>
              </div>
            )}
            {earned.tech > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Tech points earned</span>
                <span className="text-cyan-400 font-semibold">
                  +{formatNumber(earned.tech)}
                </span>
              </div>
            )}
          </div>
        )}

        {attacks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-red-400 mb-2">
              Attacks Received
            </h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {attacks.map((a) => (
                <div
                  key={a.id}
                  className="text-xs text-gray-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5"
                >
                  {a.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={dismiss}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
        >
          Welcome back!
        </button>
      </div>
    </div>
  );
}
