export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  icon?: string;
  summary: string;
  content: string[];
}

export const HELP_CATEGORIES = [
  "Getting Started",
  "Resources",
  "Buildings",
  "Military",
  "Cyber Operations",
  "Market",
  "Alliances",
  "Combat",
  "Rounds & Phases",
  "Progression",
] as const;

export const HELP_ARTICLES: HelpArticle[] = [
  // ── Getting Started ────────────────────────────────────────────────
  {
    id: "overview",
    title: "Game Overview",
    category: "Getting Started",
    summary: "What is Hegemon and how to play.",
    content: [
      "Hegemon is a multiplayer strategy game where you build a nation, manage resources, train troops, and compete against other players.",
      "The game runs in rounds. Each round lasts a set number of days. Your goal is to climb the rankings by growing your economy, military, and alliance.",
      "The game operates on a tick system — every 10 minutes, your buildings produce resources, your population consumes food, and energy regenerates.",
    ],
  },
  {
    id: "first-steps",
    title: "Your First Steps",
    category: "Getting Started",
    summary: "What to do after creating your nation.",
    content: [
      "After creating your nation, you start with basic buildings (Housing, Farm, Factory, Commercial, Power Plant) at level 1 and 100 Infantry.",
      "You also get a 24-hour beginner shield that protects you from attacks. Use this time to build up your economy.",
      "Recommended first steps: 1) Upgrade your Commercial building for more cash. 2) Upgrade your Farm to produce more food. 3) Build a Research Lab for tech points. 4) Build a Barracks so you can train troops faster.",
      "Keep an eye on your energy — building and training cost energy, which regenerates slowly over time.",
    ],
  },
  {
    id: "beginner-shield",
    title: "Beginner Shield",
    category: "Getting Started",
    icon: "building-missile-defense",
    summary: "You are protected from attacks for 24 hours after creating your nation.",
    content: [
      "When you create a nation, you receive a 24-hour shield that prevents other players from attacking you or launching most cyber operations against you.",
      "Recon Scan can still be used against shielded nations.",
      "Warning: The System Hack cyber operation can remove your shield early! Build a Firewall Array to defend against this.",
      "Once your shield expires, you are vulnerable to attacks. Make sure you have troops and defenses ready.",
    ],
  },
  {
    id: "ticks",
    title: "Ticks & Production",
    category: "Getting Started",
    summary: "How the tick system works.",
    content: [
      "The game runs on a 10-minute tick cycle. Every tick, several things happen automatically:",
      "- Buildings produce resources (cash, materials, food, tech points) based on their type and level.",
      "- Energy regenerates based on your Power Plant level.",
      "- Population consumes food. If you run out of food, your civilians will start dying (starvation).",
      "- Building and troop training timers advance.",
      "Production scales linearly with building level — a level 5 Commercial building produces 5x more cash than a level 1.",
    ],
  },

  // ── Resources ─────────────────────────────────────────────────────
  {
    id: "cash",
    title: "Cash",
    category: "Resources",
    icon: "resource-cash",
    summary: "The primary currency for buying buildings, troops, and market trades.",
    content: [
      "Cash is your main currency. You need it for everything: upgrading buildings, training troops, placing market orders, and depositing into your alliance treasury.",
      "Cash is produced by Commercial buildings at a rate of 100 per level per tick.",
      "You can also earn cash by winning attacks (looting 5-15% of the defender's cash) or selling commodities on the market.",
    ],
  },
  {
    id: "materials",
    title: "Materials",
    category: "Resources",
    icon: "resource-materials",
    summary: "Required for construction and training alongside cash.",
    content: [
      "Materials are needed alongside cash for building upgrades and troop training.",
      "Materials are produced by Factories at a rate of 10 per level per tick.",
      "You can trade materials on the market, or loot them from other nations through attacks.",
    ],
  },
  {
    id: "food",
    title: "Food",
    category: "Resources",
    icon: "resource-food",
    summary: "Feeds your population. Running out causes starvation.",
    content: [
      "Food sustains your population. Each citizen consumes 0.01 food per tick.",
      "Food is produced by Farms at a rate of 15 per level per tick.",
      "If your food reaches zero, your civilians start dying — losing population reduces your economic output and military potential.",
      "You can buy food on the market if your farms aren't producing enough.",
    ],
  },
  {
    id: "tech-points",
    title: "Tech Points",
    category: "Resources",
    icon: "resource-tech",
    summary: "Used for research and advanced upgrades.",
    content: [
      "Tech points are produced by Research Labs at a rate of 5 per level per tick.",
      "Tech points contribute to your overall score and are needed for certain advanced operations.",
      "They can be stolen through the Data Theft cyber operation, or traded on the market.",
    ],
  },
  {
    id: "energy",
    title: "Energy",
    category: "Resources",
    icon: "resource-energy",
    summary: "Required for all actions — building, training, attacking, cyber ops.",
    content: [
      "Energy is consumed by nearly every action in the game:",
      "- Building/upgrading: 5 energy",
      "- Training troops: 3 energy",
      "- Launching attacks: 25 energy",
      "- Cyber operations: 5-40 energy depending on the operation",
      "Energy regenerates automatically each tick. Power Plants increase both your energy cap and regen rate.",
      "A level 1 Power Plant adds +20 to your energy cap and +0.5 to your regen rate per tick. These scale with level.",
      "Manage your energy carefully — running out means you can't take any actions until it regenerates.",
    ],
  },
  {
    id: "population",
    title: "Population",
    category: "Resources",
    icon: "resource-population",
    summary: "Your people — split between civilians and military.",
    content: [
      "Your population is divided into civilians and military personnel.",
      "Civilians contribute to your economic score. Military personnel can be recruited as troops.",
      "Population capacity is determined by your Housing (Residential) buildings — each level adds +50 capacity.",
      "Population grows naturally by 10 per tick as long as you have food and capacity.",
      "Training troops converts civilians into military personnel. If your population drops (from starvation or attacks), your military capacity is affected.",
    ],
  },

  // ── Buildings ─────────────────────────────────────────────────────
  {
    id: "buildings-overview",
    title: "Buildings Overview",
    category: "Buildings",
    icon: "building-residential",
    summary: "11 building types, each with unique production. Max level 20.",
    content: [
      "There are 11 building types in Hegemon. Each building can be upgraded to a maximum of level 20.",
      "You can only have one of each building type. If you don't have a building, you can construct it from the Nation page.",
      "Upgrade cost formula: Base cost * (target level ^ 1.5). Base costs are $500 cash and 200 materials.",
      "Build time: 5 minutes per target level (e.g., upgrading to level 5 takes 25 minutes).",
      "You can have up to 2 buildings under construction at the same time.",
      "Each building upgrade costs 5 energy.",
    ],
  },
  {
    id: "building-economy",
    title: "Economy Buildings",
    category: "Buildings",
    icon: "building-commercial",
    summary: "Commercial, Factory, Farm, Research Lab — produce resources each tick.",
    content: [
      "Commercial District: Produces +100 cash per level per tick. Your main income source.",
      "Factory: Produces +10 materials per level per tick. Essential for construction and troop training.",
      "Farm: Produces +15 food per level per tick. Keeps your population alive.",
      "Research Lab: Produces +5 tech points per level per tick. Boosts your score.",
      "Tip: Prioritize Commercial and Farm early. Cash fuels everything, and running out of food is catastrophic.",
    ],
  },
  {
    id: "building-infrastructure",
    title: "Infrastructure Buildings",
    category: "Buildings",
    icon: "building-power-plant",
    summary: "Housing, Power Plant — population and energy.",
    content: [
      "Housing (Residential): Adds +50 population capacity per level. More population means more civilians and military potential.",
      "Power Plant: Adds +20 energy cap and +0.5 energy regen per level per tick. Critical for sustaining actions.",
      "Without sufficient power, you'll constantly run out of energy and be unable to build, train, or attack.",
    ],
  },
  {
    id: "building-military",
    title: "Military & Defense Buildings",
    category: "Buildings",
    icon: "building-barracks",
    summary: "Barracks, Missile Defense, Firewall Array, Intelligence HQ, Cyber Center.",
    content: [
      "Barracks: +10% training speed per level. Reduces the time it takes to train troops.",
      "Missile Defense: +5% defense bonus per level. Increases your troops' defensive power when attacked.",
      "Firewall Array: +10% cyber defense per level. Reduces the success chance of enemy cyber operations against you. At level 10, it blocks 50% of incoming cyber attacks.",
      "Intelligence HQ: +10% intel success per level. Increases the success chance of your own cyber operations.",
      "Cyber Center: +1 cyber operation slot per level. Required to launch any cyber operations. Higher levels also increase cyber op success chance (base 60% + 5% per Cyber Center level, capped at 95%).",
    ],
  },

  // ── Military ──────────────────────────────────────────────────────
  {
    id: "troops-overview",
    title: "Troop Types",
    category: "Military",
    icon: "unit-infantry",
    summary: "5 unit types with different ATK/DEF stats and costs.",
    content: [
      "Infantry — ATK: 3, DEF: 2 | Cost: $100 + 20 mat | Train: 30s. Cheap and fast to produce. Good for early game and bulk.",
      "Tanks (Armor) — ATK: 15, DEF: 12 | Cost: $800 + 300 mat | Train: 2 min. Balanced heavy units with strong defense.",
      "Air Force — ATK: 20, DEF: 5 | Cost: $1,200 + 100 mat | Train: 3 min. Highest attack power but very fragile.",
      "Drones — ATK: 10, DEF: 3 | Cost: $500 + 50 mat | Train: 1 min. Good cost-efficient damage dealers.",
      "Navy — ATK: 12, DEF: 10 | Cost: $1,000 + 400 mat | Train: 4 min. Material-heavy but well-rounded.",
      "Each training action costs 3 energy. You can train up to 1,000 units per batch.",
    ],
  },
  {
    id: "training",
    title: "Training Troops",
    category: "Military",
    icon: "building-barracks",
    summary: "How to recruit and train military units.",
    content: [
      "To train troops, go to the Military page and select a unit type and quantity.",
      "Training requires cash, materials, and 3 energy. Costs scale linearly with quantity.",
      "Training time depends on the unit type — Infantry train in 30 seconds each, while Navy take 4 minutes.",
      "Barracks buildings reduce training time by 10% per level.",
      "You need available military population to train troops. If your military pop is fully allocated, you need to grow your population first.",
    ],
  },

  // ── Combat ────────────────────────────────────────────────────────
  {
    id: "combat-mechanics",
    title: "Combat Mechanics",
    category: "Combat",
    icon: "unit-armor",
    summary: "How attacks are resolved — power, randomness, losses, and loot.",
    content: [
      "To attack another nation, select a target and choose which troops to send. Attacking costs 25 energy.",
      "Combat compares your total ATK power vs the defender's total DEF power.",
      "There is a random factor of +/-15% applied to your attack, so outcomes aren't 100% predictable.",
      "The defender gets a fortification bonus from Missile Defense buildings (+5% DEF per level).",
      "Winner's troops lose 10-20% of committed forces. Loser's troops lose 30-50%.",
      "If you win, you loot 5-15% of the defender's cash and materials.",
      "There is a 10-minute cooldown between attacks against the same target.",
      "You cannot attack nations that have an active beginner shield.",
    ],
  },
  {
    id: "combat-strategy",
    title: "Combat Strategy Tips",
    category: "Combat",
    summary: "Tips for winning battles.",
    content: [
      "Scout first: Use Recon Scan (5 energy) to see your target's resources and troop counts before committing to an attack (25 energy).",
      "Air Force has the highest ATK but lowest DEF — great for overwhelming weaker targets, risky against well-defended ones.",
      "Build Missile Defense to boost your defense when attacked. Each level adds +5% to your total defensive power.",
      "Don't send all your troops! Keep some reserves to defend your own nation.",
      "Attack targets with high resources but weak military for the best loot-to-loss ratio.",
      "The Military page shows your odds (Favorable/Risky/Unfavorable) based on your selected ATK vs target's military score.",
    ],
  },

  // ── Cyber Operations ──────────────────────────────────────────────
  {
    id: "cyber-overview",
    title: "Cyber Operations Overview",
    category: "Cyber Operations",
    icon: "cyber-hack",
    summary: "8 cyber ops with different effects, costs, and cooldowns.",
    content: [
      "Cyber operations let you spy on, steal from, and sabotage other nations without direct military conflict.",
      "You need a Cyber Center building to launch any cyber operations.",
      "Success chance: Base 60% + 5% per Cyber Center level, capped at 95%. Reduced by target's Firewall Array (5% per level).",
      "Each op has an energy cost and a cooldown period before you can use the same op type again.",
      "Cyber ops are unavailable during the Growth phase of a round.",
    ],
  },
  {
    id: "cyber-intel",
    title: "Intelligence Ops",
    category: "Cyber Operations",
    icon: "cyber-recon",
    summary: "Recon Scan and Network Infiltration for gathering intel.",
    content: [
      "Recon Scan (5 energy, 5 min cooldown): Reveals target's troop counts and resource levels. Can be used even against shielded nations. Cheapest op available.",
      "Network Infiltration (15 energy, 30 min cooldown): Full intel on target — troops, buildings, resources, and alliance info. More detailed than Recon Scan.",
    ],
  },
  {
    id: "cyber-offensive",
    title: "Offensive Cyber Ops",
    category: "Cyber Operations",
    icon: "cyber-sabotage",
    summary: "Sabotage, theft, and disruption operations.",
    content: [
      "System Hack (15 energy, 30 min cooldown): Removes the target's beginner shield, making them attackable.",
      "Data Theft (15 energy, 15 min cooldown): Steals 10% of target's tech points (capped by your Cyber Center level * 50).",
      "Market Manipulation (20 energy, 60 min cooldown): Steals 5% of target's cash directly into your treasury.",
      "Propaganda (15 energy, 45 min cooldown): Kills 5% of target's civilian population through unrest.",
      "Infrastructure Sabotage (25 energy, 60 min cooldown): Permanently reduces target's energy regen by 25%.",
      "EMP Strike (40 energy, 120 min cooldown): Drains 50% of target's current energy. The most expensive but devastating op.",
    ],
  },

  // ── Market ────────────────────────────────────────────────────────
  {
    id: "market-overview",
    title: "Market Overview",
    category: "Market",
    icon: "resource-materials",
    summary: "Buy and sell Materials, Tech Points, and Food for cash.",
    content: [
      "The market lets you trade three commodities: Materials, Tech Points, and Food. All trades are priced in cash.",
      "The market uses a limit order book — you place buy or sell orders at a specific price and quantity.",
      "If your order matches an existing order on the book, it executes immediately. Otherwise, it sits on the book waiting for a match.",
      "There is a 3.5% fee on buy orders. Sell orders have no fee.",
      "Max order: 10,000 units. Max price: $100,000 per unit.",
    ],
  },
  {
    id: "market-trading",
    title: "How to Trade",
    category: "Market",
    summary: "Placing, matching, and cancelling orders.",
    content: [
      "To buy: Set the price you're willing to pay per unit and quantity. If there are sell orders at or below your price, they match instantly.",
      "To sell: Set your ask price and quantity. If there are buy orders at or above your price, they match instantly.",
      "Unmatched orders remain on the book. You can cancel open orders anytime to get your resources back.",
      "The order book shows current bids (buy orders) and asks (sell orders) with depth visualization.",
      "Check the Price History chart for recent price trends before trading.",
      "Tip: Buy food if your farms can't keep up with population growth. Sell excess materials or tech points for cash.",
    ],
  },

  // ── Alliances ─────────────────────────────────────────────────────
  {
    id: "alliance-overview",
    title: "Alliance Overview",
    category: "Alliances",
    icon: "building-intelligence-hq",
    summary: "Join or create alliances for mutual defense and shared resources.",
    content: [
      "Alliances allow players to team up. Benefits include shared treasury, coordinated attacks, and higher combined ranking.",
      "To create an alliance, provide a name (2-30 chars), a unique tag (alphanumeric), and optional description.",
      "To join, browse available alliances on the Alliance page and request to join.",
      "Alliance rankings are shown separately, aggregating all members' scores.",
    ],
  },
  {
    id: "alliance-roles",
    title: "Alliance Roles",
    category: "Alliances",
    summary: "Role hierarchy and permissions within alliances.",
    content: [
      "President: Full control — can kick, promote, manage treasury, and transfer leadership. Created automatically when you found an alliance.",
      "Vice President: Can kick members of lower rank. Cannot promote or manage treasury.",
      "Minister of War / Minister of Intelligence / Minister of Trade: Specialized roles. Minister of Trade can withdraw from the treasury.",
      "Member: Basic membership. Can deposit into the treasury and participate in alliance activities.",
      "If the President leaves, leadership transfers to the longest-serving Vice President (or oldest member if none).",
    ],
  },
  {
    id: "alliance-treasury",
    title: "Alliance Treasury",
    category: "Alliances",
    summary: "Deposit and withdraw shared funds.",
    content: [
      "Any alliance member can deposit cash from their nation into the alliance treasury.",
      "Only the President and Minister of Trade can withdraw from the treasury.",
      "The treasury is shared — use it to fund alliance-wide operations or help struggling members.",
    ],
  },

  // ── Rounds & Phases ───────────────────────────────────────────────
  {
    id: "rounds",
    title: "How Rounds Work",
    category: "Rounds & Phases",
    summary: "Each round is a fresh start with different phases.",
    content: [
      "The game is played in rounds, each lasting a set number of days. When a round ends, rankings are finalized and a new round can begin.",
      "Each nation is created fresh for each round — resources, buildings, and troops don't carry over.",
      "Your user account persists between rounds, but your nation starts from scratch.",
    ],
  },
  {
    id: "phases",
    title: "Round Phases",
    category: "Rounds & Phases",
    summary: "Growth, Open, Endgame — different rules apply.",
    content: [
      "Growth Phase: The opening period. Attacks and cyber operations are disabled. Focus on building your economy and infrastructure. Beginner shields are active.",
      "Open Phase: Full gameplay. Attacks, cyber operations, and all features are enabled. The main competitive phase.",
      "Endgame Phase: Final stretch of the round. All features remain active. Rankings become crucial as the round approaches its end.",
      "The current phase and day are shown on your Dashboard.",
    ],
  },

  // ── Scoring ───────────────────────────────────────────────────────
  {
    id: "scoring",
    title: "Scoring & Rankings",
    category: "Rounds & Phases",
    icon: "building-commercial",
    summary: "How your score is calculated.",
    content: [
      "Your total score is a combination of military score and economic score.",
      "Military score is based on the total power (ATK + DEF) of all your troops.",
      "Economic score is based on your resources, buildings, population, and tech points.",
      "Rankings can be viewed by Overall, Military, or Economic categories.",
      "Alliance rankings aggregate all members' scores. Coordinate with your alliance to dominate the leaderboard.",
    ],
  },

  // ── Progression ────────────────────────────────────────────────
  {
    id: "achievements",
    title: "Achievements",
    category: "Progression",
    icon: "resource-tech",
    summary: "Unlock achievements by reaching milestones.",
    content: [
      "Achievements are milestones that track your progress in the game.",
      "There are 14 achievements covering building, military, economy, espionage, trading, and diplomacy.",
      "Unlocked achievements are displayed on your profile and in the Achievements page.",
      "Examples: 'First Blood' (win your first attack), 'Tycoon' (accumulate 100,000 cash), 'Spy Master' (use all 8 cyber ops).",
      "Achievements are checked automatically when you perform actions in the game.",
    ],
  },
  {
    id: "missions",
    title: "Starter Missions",
    category: "Progression",
    icon: "building-commercial",
    summary: "Complete missions to earn bonus resources.",
    content: [
      "When you create your nation, you receive 6 starter missions that guide you through the basics.",
      "Each mission has a specific objective (e.g. 'Upgrade Commercial to Level 3') and a reward in cash or materials.",
      "Your mission progress is tracked automatically. Check the Dashboard to see your current missions.",
      "Once a mission is completed, click 'Claim' to receive the reward.",
      "Missions are a great way to get a head start and learn the game mechanics.",
    ],
  },
  {
    id: "daily-login",
    title: "Daily Login Bonus",
    category: "Progression",
    icon: "resource-cash",
    summary: "Log in daily to earn bonus resources.",
    content: [
      "Each day you log in, you can claim a daily bonus of cash and materials.",
      "Your streak increases each consecutive day you claim the bonus.",
      "Higher streaks give better rewards. Missing a day resets your streak.",
      "Check the Dashboard for the daily claim button.",
    ],
  },
  {
    id: "messages",
    title: "Messaging",
    category: "Progression",
    icon: "building-intelligence-hq",
    summary: "Send and receive messages from other players.",
    content: [
      "Use the Messages page to communicate with other nations.",
      "You can send messages to any nation by searching for their name.",
      "Messages have a subject and body. You can reply to received messages.",
      "Unread messages are highlighted with a blue indicator.",
      "There is a rate limit of 20 messages per hour to prevent spam.",
    ],
  },
  {
    id: "unit-advantages",
    title: "Unit Type Advantages",
    category: "Combat",
    icon: "unit-armor",
    summary: "Each unit type has strengths and weaknesses.",
    content: [
      "Combat uses a rock-paper-scissors system where each troop type has advantages and disadvantages.",
      "Infantry beats Drones (1.3x damage), Armor beats Infantry, Air Force beats Armor, Drones beat Air Force.",
      "Navy provides balanced support but excels at coastal operations.",
      "When your troops have a type advantage, they deal 30% more damage. When disadvantaged, they deal 30% less.",
      "A well-balanced army composition is often more effective than specializing in one unit type.",
    ],
  },
];

/** Lookup a single article by ID */
export function getArticle(id: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.id === id);
}

/** Get all articles in a category */
export function getArticlesByCategory(category: string): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === category);
}
