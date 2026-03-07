import { useEffect } from "react";

interface TechNode {
  name: string;
  desc: string;
  cost: number;
}

interface TechBranch {
  name: string;
  color: string;
  lineColor: string;
  bgColor: string;
  nodes: TechNode[];
}

const TECH_BRANCHES: TechBranch[] = [
  {
    name: "Military",
    color: "text-red-400",
    lineColor: "bg-red-500/30",
    bgColor: "border-red-500/20",
    nodes: [
      { name: "Combat Training", desc: "Improves troop attack power by 10%", cost: 5 },
      { name: "Advanced Tactics", desc: "Unlocks flanking maneuvers, +15% attack", cost: 15 },
      { name: "Siege Warfare", desc: "Bonus damage against fortified targets", cost: 30 },
      { name: "Nuclear Arsenal", desc: "Unlocks devastating nuclear strike capability", cost: 60 },
    ],
  },
  {
    name: "Economy",
    color: "text-emerald-400",
    lineColor: "bg-emerald-500/30",
    bgColor: "border-emerald-500/20",
    nodes: [
      { name: "Trade Routes", desc: "Reduces market fees by 25%", cost: 5 },
      { name: "Banking", desc: "Earn interest on cash reserves", cost: 15 },
      { name: "Stock Exchange", desc: "Advanced market orders and bulk trading", cost: 30 },
      { name: "Global Markets", desc: "Access to international trade and rare resources", cost: 60 },
    ],
  },
  {
    name: "Cyber",
    color: "text-cyan-400",
    lineColor: "bg-cyan-500/30",
    bgColor: "border-cyan-500/20",
    nodes: [
      { name: "Basic Hacking", desc: "Improves cyber op success rate by 10%", cost: 5 },
      { name: "Advanced Infiltration", desc: "Unlocks stealth ops, harder to detect", cost: 15 },
      { name: "Zero Day Exploits", desc: "Bypass firewalls on first attack", cost: 30 },
      { name: "AI Warfare", desc: "Autonomous cyber attacks with AI-driven targeting", cost: 60 },
    ],
  },
];

export default function TechTree() {
  useEffect(() => {
    document.title = "Tech Tree - Hegemon";
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Tech Tree
        </h1>
        <p className="text-amber-400 text-sm mt-1">
          Coming in the next update - Research technologies to gain strategic advantages
        </p>
      </div>

      {/* Branches */}
      <div className="space-y-8">
        {TECH_BRANCHES.map((branch) => (
          <div key={branch.name} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className={`text-sm font-semibold ${branch.color} mb-4`}>
              {branch.name} Branch
            </h2>

            {/* Horizontal scrollable node list */}
            <div className="overflow-x-auto">
              <div className="flex items-center gap-0 min-w-max pb-2">
                {branch.nodes.map((node, idx) => (
                  <div key={node.name} className="flex items-center">
                    {/* Node card */}
                    <div
                      className={`relative bg-gray-800 border ${branch.bgColor} rounded-xl p-4 w-56 flex-shrink-0 opacity-60`}
                    >
                      {/* Lock icon */}
                      <div className="absolute top-3 right-3">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      {/* Node content */}
                      <div className="text-xs text-gray-600 mb-1">
                        Tier {idx + 1}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-1">
                        {node.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">{node.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {node.cost} TP
                        </span>
                        <span className="text-xs text-gray-600 font-medium">
                          Locked
                        </span>
                      </div>
                    </div>

                    {/* Connector line between nodes */}
                    {idx < branch.nodes.length - 1 && (
                      <div className="flex items-center px-1 flex-shrink-0">
                        <div className={`w-8 h-0.5 ${branch.lineColor}`} />
                        <svg
                          className={`w-3 h-3 -ml-1 ${branch.color} opacity-30`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Prerequisites note */}
            <p className="text-xs text-gray-600 mt-3">
              Each node requires the previous node in the branch to be researched first.
            </p>
          </div>
        ))}
      </div>

      {/* Info card */}
      <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-amber-400 mb-2">
          About the Tech Tree
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          The Tech Tree will allow you to research technologies using Tech Points earned from
          your Research Lab. Each branch offers unique advantages: Military tech boosts combat
          power, Economy tech improves resource generation and trade, and Cyber tech enhances
          your digital warfare capabilities. Plan your research path carefully - each tier
          requires the previous one to be completed first.
        </p>
      </div>
    </div>
  );
}
