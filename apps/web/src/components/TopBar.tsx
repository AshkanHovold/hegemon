import { useState, useEffect, useRef } from "react";
import ResourceBar from "./ResourceBar";
import TickCountdown from "./TickCountdown";
import GameIcon from "./GameIcon";
import { formatNumber, timeAgo } from "../lib/format";
import { api } from "../lib/api";
import type { Nation } from "../lib/types";

interface NationEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

interface TopBarProps {
  nation: Nation | null;
}

export default function TopBar({ nation }: TopBarProps) {
  const cash = nation?.cash ?? 0;
  const materials = nation?.materials ?? 0;
  const tech = nation?.techPoints ?? 0;
  const population = nation?.population ?? 0;
  const food = nation?.food ?? 0;
  const energyCurrent = nation?.energy ?? 0;
  const energyMax = nation?.energyCap ?? 100;

  const energyPercent = energyMax > 0 ? (energyCurrent / energyMax) * 100 : 0;

  // Notification bell state
  const [showEvents, setShowEvents] = useState(false);
  const [events, setEvents] = useState<NationEvent[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!nation) return;
    async function fetchEvents() {
      try {
        const data = await api.get<{ events: NationEvent[] }>("/nation/events");
        setEvents(data.events);
        // Check if any events are from the last hour
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        setHasNew(data.events.some((e) => new Date(e.createdAt).getTime() > oneHourAgo));
      } catch {
        // ignore
      }
    }
    fetchEvents();
    const interval = setInterval(fetchEvents, 60_000);
    return () => clearInterval(interval);
  }, [nation?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowEvents(false);
      }
    }
    if (showEvents) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showEvents]);

  return (
    <div className="flex items-center gap-2 flex-wrap bg-gray-950/80 backdrop-blur border-b border-gray-800 px-4 py-2" data-tutorial="resource-bar">
      <ResourceBar
        iconName="resource-cash"
        label="Cash"
        value={formatNumber(cash)}
        colorClass="text-amber-400"
      />
      <ResourceBar
        iconName="resource-materials"
        label="Materials"
        value={formatNumber(materials)}
        colorClass="text-slate-300"
      />
      <ResourceBar
        iconName="resource-tech"
        label="Tech"
        value={formatNumber(tech)}
        colorClass="text-cyan-400"
      />
      <ResourceBar
        iconName="resource-population"
        label="Pop"
        value={formatNumber(population)}
        colorClass="text-violet-400"
      />
      <ResourceBar
        iconName="resource-food"
        label="Food"
        value={formatNumber(food)}
        colorClass="text-emerald-400"
      />

      {/* Notification bell */}
      <div className="relative ml-auto" ref={dropdownRef}>
        <button
          onClick={() => setShowEvents((prev) => !prev)}
          className="relative p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {hasNew && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {showEvents && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-800 text-sm font-semibold text-white">
              Recent Events
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-800">
              {events.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-600">
                  No events yet
                </div>
              ) : (
                events.slice(0, 20).map((event) => (
                  <div key={event.id} className="px-4 py-2.5">
                    <div className="text-sm text-gray-300">{event.message}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{timeAgo(event.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tick countdown */}
      <TickCountdown />

      {/* Energy bar - special treatment */}
      <div className="flex items-center gap-2 rounded-full bg-gray-900/80 border border-gray-800 px-3 py-1 text-sm">
        <GameIcon name="resource-energy" size={18} />
        <span className="text-gray-500 hidden lg:inline">Energy</span>
        <div className="w-24 h-3 bg-gray-800 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full energy-glow transition-all duration-500"
            style={{ width: `${energyPercent}%` }}
          />
        </div>
        <span className="text-blue-400 font-semibold tabular-nums">
          {Math.floor(energyCurrent)}/{Math.floor(energyMax)}
        </span>
      </div>
    </div>
  );
}
