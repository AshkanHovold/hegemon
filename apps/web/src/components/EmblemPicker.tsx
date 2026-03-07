import { useState } from "react";
import NationEmblem, {
  EMBLEM_COLORS,
  EMBLEM_SYMBOLS,
  SymbolSvg,
  type EmblemConfig,
} from "./NationEmblem";

interface EmblemPickerProps {
  current: EmblemConfig;
  onSave: (config: EmblemConfig) => void;
  onClose: () => void;
}

export default function EmblemPicker({
  current,
  onSave,
  onClose,
}: EmblemPickerProps) {
  const [selectedColor, setSelectedColor] = useState(current.color);
  const [selectedSymbol, setSelectedSymbol] = useState(current.symbol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">
            Choose Your Emblem
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-6">
          <NationEmblem color={selectedColor} symbol={selectedSymbol} size={80} />
        </div>

        {/* Color selection */}
        <div className="mb-5">
          <label className="block text-xs text-gray-500 mb-2">
            Background Color
          </label>
          <div className="flex gap-2">
            {EMBLEM_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(c.value)}
                className={`w-10 h-10 rounded-lg ${c.value} transition-all ${
                  selectedColor === c.value
                    ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110"
                    : "hover:scale-105"
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Symbol selection */}
        <div className="mb-6">
          <label className="block text-xs text-gray-500 mb-2">Symbol</label>
          <div className="grid grid-cols-4 gap-2">
            {EMBLEM_SYMBOLS.map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`h-14 rounded-lg bg-gray-800 flex items-center justify-center transition-all ${
                  selectedSymbol === sym
                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900 bg-gray-700"
                    : "hover:bg-gray-700"
                }`}
                title={sym}
              >
                <SymbolSvg symbol={sym} size={28} />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({ color: selectedColor, symbol: selectedSymbol })
            }
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Save Emblem
          </button>
        </div>
      </div>
    </div>
  );
}
