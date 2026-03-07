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

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Found Your Nation",
    desc: "Create your nation in seconds. Choose a name, pick your strategy, and start building.",
  },
  {
    step: "2",
    title: "Build & Grow",
    desc: "Construct buildings, train troops, and research technology. Resources generate every 10 minutes automatically.",
  },
  {
    step: "3",
    title: "Compete & Conquer",
    desc: "Attack rivals, steal resources, form alliances, and climb the rankings. The strongest nation wins the round.",
  },
];

const STATS = [
  { label: "Building Types", value: "11" },
  { label: "Troop Types", value: "5" },
  { label: "Cyber Operations", value: "8" },
  { label: "Tradeable Commodities", value: "3" },
];

export default function Landing() {
  useEffect(() => {
    document.title = "Hegemon - Build your nation. Wage war.";
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-gray-900">
        <div className="flex items-center gap-3">
          <img
            src="/assets/art/logo-emblem.png"
            alt="Hegemon"
            className="w-8 h-8 object-contain"
          />
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
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url(/assets/art/hero.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-transparent to-gray-950" />

        <div className="relative">
          <img
            src="/assets/art/logo-emblem.png"
            alt="Hegemon"
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 drop-shadow-2xl"
          />
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white">
            HEGEMON
          </h1>
          <div
            className="absolute inset-0 text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-blue-500 blur-2xl opacity-20 pointer-events-none"
            style={{ top: "5rem" }}
          >
            HEGEMON
          </div>
        </div>
        <p className="relative mt-4 text-lg sm:text-2xl text-gray-400 max-w-xl">
          Build your nation. Forge alliances. Wage war.
          <br />
          <span className="text-gray-300 font-medium">
            Become the dominant power.
          </span>
        </p>
        <div className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-10 w-full sm:w-auto px-4 sm:px-0">
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25 text-center"
          >
            Play Now — It's Free
          </Link>
          <Link
            to="/login"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-8 py-3 rounded-lg text-lg font-semibold transition-colors border border-gray-700 text-center"
          >
            Login
          </Link>
        </div>
        <p className="relative mt-5 text-sm text-gray-600">
          Browser-based multiplayer strategy &middot; No download required
          &middot; Free to play
        </p>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-900 bg-gray-900/30">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-black text-blue-400">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
          Multiple Paths to Power
        </h2>
        <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Economy, military, espionage, or diplomacy — choose your strategy and
          dominate.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              className={`${feat.bg} border ${feat.border} rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="mb-3">
                <GameIcon
                  name={feat.iconName}
                  size={40}
                  className="drop-shadow-lg"
                />
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

      {/* How It Works */}
      <section className="bg-gray-900/40 border-y border-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            Get Started in 60 Seconds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/register"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25"
            >
              Start Playing
            </Link>
          </div>
        </div>
      </section>

      {/* Game Features Detail */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
          Deep Strategy, Easy to Learn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <GameIcon name="building-commercial" size={28} />
              <h3 className="text-base font-semibold text-white">
                11 Building Types
              </h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              From Farms and Factories to Cyber Centers and Missile Defense.
              Each building produces unique resources or bonuses. Upgrade to
              level 20 for maximum output.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <GameIcon name="unit-armor" size={28} />
              <h3 className="text-base font-semibold text-white">
                Rock-Paper-Scissors Combat
              </h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              5 troop types with unique strengths and weaknesses. Infantry beats
              Drones, Air Force beats Armor, and more. Army composition matters
              — brute force alone won't win.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <GameIcon name="cyber-sabotage" size={28} />
              <h3 className="text-base font-semibold text-white">
                8 Cyber Operations
              </h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Recon Scan, Data Theft, EMP Strike, Propaganda and more. Spy on
              enemies, steal their tech, sabotage their infrastructure, or
              remove their shield before an attack.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <GameIcon name="resource-materials" size={28} />
              <h3 className="text-base font-semibold text-white">
                Live Market Exchange
              </h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              A real order-book market where you trade Materials, Tech Points,
              and Food with other players. Set limit orders, watch price charts,
              and exploit market inefficiencies.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-900 bg-gradient-to-b from-blue-600/5 to-transparent">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to Build Your Empire?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Join the battle. Every round is a fresh start — new strategies, new
            alliances, new rivals. Your nation awaits.
          </p>
          <Link
            to="/register"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            Create Your Nation
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-6 text-center text-sm text-gray-600">
        Hegemon &copy; 2026 &middot; A browser-based strategy game
      </footer>
    </div>
  );
}
