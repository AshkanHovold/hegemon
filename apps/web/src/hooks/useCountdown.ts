import { useState, useEffect } from "react";

interface CountdownResult {
  /** Milliseconds remaining (0 when done) */
  remaining: number;
  /** Progress percentage 0-100 (null if no startTime provided) */
  percent: number | null;
  /** Human-readable label: "2m 15s", "45s", "Done" */
  label: string;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Done";
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Live countdown hook that ticks every second.
 * @param endTime   ISO timestamp when the action completes (null = inactive)
 * @param startTime ISO timestamp when the action started (null = no progress bar)
 */
export function useCountdown(
  endTime: string | null,
  startTime?: string | null,
): CountdownResult {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!endTime) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (!endTime) {
    return { remaining: 0, percent: null, label: "" };
  }

  const end = new Date(endTime).getTime();
  const remaining = Math.max(0, end - now);
  const label = formatRemaining(remaining);

  let percent: number | null = null;
  if (startTime) {
    const start = new Date(startTime).getTime();
    const total = end - start;
    if (total > 0) {
      const elapsed = now - start;
      percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
    } else {
      percent = 100;
    }
  }

  return { remaining, percent, label };
}
