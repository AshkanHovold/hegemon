import { useEffect } from "react";
import { Link } from "react-router-dom";
import GameIcon from "../components/GameIcon";

const FEATURES = [
  {
    iconName: "resource-cash",
    title: "Economy",
    description:
      "Build a thriving economy. Trade on the open market, manage resources, and fund your rise to power.",
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
  {
    iconName: "unit-infantry",
    title: "Military",
    description:
      "Raise armies, train elite units, and wage war against rival nations. Conquer or be conquered.",
    color: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
  },
  {
    iconName: "cyber-hack",
    title: "Cyber Warfare",
    description:
      "Hack enemy infrastructure, steal intelligence, sabotage production. The invisible battlefield.",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
  },
  {
    iconName: "building-intelligence-hq",
    title: "Alliances",
    description:
      "Form powerful alliances, coordinate attacks, share resources. Together you are unstoppable.",
    color: "text-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
  },
];

export default function Landing() {
  useEffect(() => { document.title = "Hegemon - Build your nation. Wage war."; }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-900">
        <div className="flex items-center gap-3">
          <img src="/assets/art/logo-emblem.png" alt="Hegemon" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-tight">HEGEMON</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Play Now
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden">
        {/* Background hero image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url(/assets/art/hero.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-transparent to-gray-950" />

        <div className="relative">
          <img
            src="/assets/art/logo-emblem.png"
            alt="Hegemon"
            className="w-24 h-24 mx-auto mb-6 drop-shadow-2xl"
          />
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-white">
            HEGEMON
          </h1>
          <div className="absolute inset-0 text-6xl sm:text-8xl font-black tracking-tighter text-blue-500 blur-2xl opacity-20 pointer-events-none" style={{ top: "6rem" }}>
            HEGEMON
          </div>
        </div>
        <p className="relative mt-4 text-xl sm:text-2xl text-gray-400 max-w-xl">
          Build your nation. Forge alliances. Wage war.
          <br />
          <span className="text-gray-300 font-medium">
            Become the dominant power.
          </span>
        </p>
        <div className="relative flex gap-4 mt-10">
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            Play Now
          </Link>
          <Link
            to="/login"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-8 py-3 rounded-lg text-lg font-semibold transition-colors border border-gray-700"
          >
            Login
          </Link>
        </div>
        <p className="relative mt-6 text-sm text-gray-600">
          Browser-based multiplayer strategy &middot; Free to play
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              className={`${feat.bg} border ${feat.border} rounded-xl p-6 transition-all hover:scale-[1.02]`}
            >
              <div className="mb-3">
                <GameIcon name={feat.iconName} size={40} className="drop-shadow-lg" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-6 text-center text-sm text-gray-600">
        Hegemon &copy; 2026 &middot; A browser-based strategy game
      </footer>
    </div>
  );
}
