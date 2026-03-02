import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "$",
    title: "Economy",
    description:
      "Build a thriving economy. Trade on the open market, manage resources, and fund your rise to power.",
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
  {
    icon: "\u2694",
    title: "Military",
    description:
      "Raise armies, train elite units, and wage war against rival nations. Conquer or be conquered.",
    color: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
  },
  {
    icon: "\ud83d\udd12",
    title: "Cyber Warfare",
    description:
      "Hack enemy infrastructure, steal intelligence, sabotage production. The invisible battlefield.",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
  },
  {
    icon: "\ud83e\udd1d",
    title: "Alliances",
    description:
      "Form powerful alliances, coordinate attacks, share resources. Together you are unstoppable.",
    color: "text-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-900">
        <span className="text-xl font-bold tracking-tight">HEGEMON</span>
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
      <section className="flex flex-col items-center justify-center text-center px-4 py-32">
        <div className="relative">
          <h1 className="text-7xl sm:text-8xl font-black tracking-tighter text-white">
            HEGEMON
          </h1>
          <div className="absolute inset-0 text-7xl sm:text-8xl font-black tracking-tighter text-blue-500 blur-2xl opacity-30">
            HEGEMON
          </div>
        </div>
        <p className="mt-4 text-xl sm:text-2xl text-gray-400 max-w-xl">
          Build your nation. Forge alliances. Wage war.
          <br />
          <span className="text-gray-300 font-medium">
            Become the dominant power.
          </span>
        </p>
        <div className="flex gap-4 mt-10">
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
        <p className="mt-6 text-sm text-gray-600">
          Round 7 in progress &middot; 1,247 active nations &middot; Day 14 of
          28
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
              <div className={`text-3xl mb-3 ${feat.color}`}>{feat.icon}</div>
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

      {/* Stats bar */}
      <section className="border-t border-gray-900 py-12">
        <div className="max-w-4xl mx-auto flex justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-white">7</div>
            <div className="text-sm text-gray-500">Rounds Played</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">12,480</div>
            <div className="text-sm text-gray-500">Nations Created</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">342</div>
            <div className="text-sm text-gray-500">Alliances Formed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">89,120</div>
            <div className="text-sm text-gray-500">Battles Fought</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-6 text-center text-sm text-gray-600">
        Hegemon &copy; 2026 &middot; A browser-based strategy game
      </footer>
    </div>
  );
}
