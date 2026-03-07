import { useState, useEffect, useCallback } from "react";

/** Returns the ms until the next 10-minute boundary. */
function msUntilNextTick(): number {
  const now = Date.now();
  const tenMin = 10 * 60 * 1000;
  const remainder = now % tenMin;
  return tenMin - remainder;
}

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TickCountdown({ onTick }: { onTick?: () => void }) {
  const [remaining, setRemaining] = useState(msUntilNextTick);
  const [flash, setFlash] = useState(false);

  const handleTick = useCallback(() => {
    setFlash(true);
    onTick?.();
    setTimeout(() => setFlash(false), 1200);
  }, [onTick]);

  useEffect(() => {
    const id = setInterval(() => {
      const ms = msUntilNextTick();
      setRemaining(ms);
      // If we just crossed the boundary (less than 1s to go means next frame is a tick)
      if (ms > 9 * 60 * 1000 + 59 * 1000) {
        handleTick();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [handleTick]);

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors duration-300 ${
        flash
          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
          : "bg-gray-900/80 border-gray-800 text-gray-400"
      }`}
    >
      {flash ? (
        <span className="text-xs font-semibold text-emerald-400">Tick!</span>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-xs tabular-nums font-medium">
            {formatMs(remaining)}
          </span>
        </>
      )}
    </div>
  );
}
