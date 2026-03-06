import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { ApiError } from "../lib/api";

export default function CreateNation() {
  const navigate = useNavigate();
  const { createNation, round } = useGame();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
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
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
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
              Name Your Nation
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
