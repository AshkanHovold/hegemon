import React, { useState, useEffect, useCallback } from "react";

export interface EmblemConfig {
  color: string;
  symbol: string;
}

const STORAGE_KEY = "hegemon_emblem";

const DEFAULT_EMBLEM: EmblemConfig = { color: "bg-blue-600", symbol: "shield" };

export function useNationEmblem() {
  const [emblem, setEmblemState] = useState<EmblemConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as EmblemConfig;
    } catch {
      // ignore
    }
    return DEFAULT_EMBLEM;
  });

  const setEmblem = useCallback((config: EmblemConfig) => {
    setEmblemState(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, []);

  return { emblem, setEmblem };
}

export const EMBLEM_COLORS = [
  { name: "Red", value: "bg-red-600" },
  { name: "Blue", value: "bg-blue-600" },
  { name: "Emerald", value: "bg-emerald-600" },
  { name: "Amber", value: "bg-amber-600" },
  { name: "Purple", value: "bg-purple-600" },
  { name: "Cyan", value: "bg-cyan-600" },
];

export const EMBLEM_SYMBOLS = [
  "shield",
  "sword",
  "star",
  "eagle",
  "crown",
  "lightning",
  "tower",
  "atom",
] as const;

export type EmblemSymbol = (typeof EMBLEM_SYMBOLS)[number];

/** SVG paths for each symbol, rendered as white on the colored background */
export function SymbolSvg({
  symbol,
  size = 32,
}: {
  symbol: string;
  size?: number;
}) {
  const paths: Record<string, React.ReactNode> = {
    shield: (
      <path
        d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
        fill="white"
      />
    ),
    sword: (
      <path
        d="M14.5 2.5L5 12l2.5 2.5-3.5 3.5 1.5 1.5 3.5-3.5L11.5 18.5 21 9l-6.5-6.5zM15 4l5 5-8.5 8.5-2-2L15 4z"
        fill="white"
      />
    ),
    star: (
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="white"
      />
    ),
    eagle: (
      <path
        d="M12 4c-1.5 0-3 .5-4 1.5C7 6.5 6.5 7.5 6 9c-.5 1.5 0 3 1 4l-3 3h4l1-1c1 .5 2 .5 3 .5s2 0 3-.5l1 1h4l-3-3c1-1 1.5-2.5 1-4-.5-1.5-1-2.5-2-3.5-1-1-2.5-1.5-4-1.5zm-2 5a1 1 0 110 2 1 1 0 010-2zm4 0a1 1 0 110 2 1 1 0 010-2zm-2 3l2 2h-4l2-2z"
        fill="white"
      />
    ),
    crown: (
      <path
        d="M2 17h20v2H2v-2zm2-5l4 4 4-6 4 6 4-4-1 9H5l-1-9z"
        fill="white"
      />
    ),
    lightning: (
      <path d="M7 2v11h3v9l7-12h-4l4-8H7z" fill="white" />
    ),
    tower: (
      <path
        d="M7 2h2v3h2V2h2v3h2V2h2v5h-1v3h1v2h-1v8H9v-8H8v-2h1V7H8V2h-1zm3 10v8h4v-8h-4z"
        fill="white"
      />
    ),
    atom: (
      <>
        <circle cx="12" cy="12" r="2" fill="white" />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          transform="rotate(120 12 12)"
        />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths[symbol] ?? paths.shield}
    </svg>
  );
}

interface NationEmblemProps {
  color: string;
  symbol: string;
  size?: number;
}

export default function NationEmblem({
  color,
  symbol,
  size = 64,
}: NationEmblemProps) {
  return (
    <div
      className={`${color} rounded-xl flex items-center justify-center`}
      style={{ width: size, height: size }}
    >
      <SymbolSvg symbol={symbol} size={size * 0.55} />
    </div>
  );
}
