import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { ApiError } from "../lib/api";
import GameIcon from "../components/GameIcon";

type GovType = "militarist" | "industrialist" | "technologist";

const GOV_OPTIONS: {
  type: GovType;
  label: string;
  bonus: string;
  icon: string;
}[] = [
  {
    type: "militarist",
    label: "Militarist",
    bonus: "+50 starting Infantry",
    icon: "unit-infantry",
  },
  {
    type: "industrialist",
    label: "Industrialist",
    bonus: "+500 starting Materials",
    icon: "building-factory",
  },
  {
    type: "technologist",
    label: "Technologist",
    bonus: "+200 starting Tech Points",
    icon: "resource-tech",
  },
];

const THEME_COLORS = [
  { name: "Red", value: "#ef4444", tw: "bg-red-500" },
  { name: "Blue", value: "#3b82f6", tw: "bg-blue-500" },
  { name: "Green", value: "#22c55e", tw: "bg-green-500" },
  { name: "Amber", value: "#f59e0b", tw: "bg-amber-500" },
  { name: "Purple", value: "#a855f7", tw: "bg-purple-500" },
  { name: "Cyan", value: "#06b6d4", tw: "bg-cyan-500" },
];

export default function CreateNation() {
  const navigate = useNavigate();
  const { createNation, round } = useGame();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [govType, setGovType] = useState<GovType>("militarist");
  const [themeColor, setThemeColor] = useState(THEME_COLORS[1].value);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      localStorage.setItem("hegemon_gov_type", govType);
      localStorage.setItem("hegemon_theme_color", themeColor);
      await createNation(name.trim());
      navigate("/game", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create nation");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            HEGEMON
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {round
              ? `Round ${round.number} - ${round.phase} Phase`
              : "Create your nation"}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-5"
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              Found Your Nation
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose a name that will strike fear into your enemies
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Nation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Iron Republic"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              required
              minLength={2}
              maxLength={30}
              disabled={submitting}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-600">
                Letters, numbers, spaces, hyphens only
              </p>
              <span className={`text-xs tabular-nums ${name.length > 25 ? "text-amber-400" : "text-gray-600"}`}>
                {name.length}/30
              </span>
            </div>
          </div>

          {/* Government Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Government Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GOV_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setGovType(opt.type)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-all ${
                    govType === opt.type
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <GameIcon name={opt.icon} size={28} />
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {opt.bonus}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nation Color
            </label>
            <div className="flex gap-3">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setThemeColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${c.tw} ${
                    themeColor === c.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {submitting ? "Creating..." : "Found Your Nation"}
          </button>
        </form>
      </div>
    </div>
  );
}
