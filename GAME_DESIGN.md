# GAME DESIGN DOCUMENT

## Title

**Hegemon** — *become the dominant power*

## Overview

**Genre:** Browser-based multiplayer nation-strategy (persistent world, tick-based)
**Setting:** Near-future (2040s). Nations compete for dominance in a world of conventional military, cyber warfare, economic manipulation, and political alliances.
**Platform:** Web (React SPA + PWA for mobile)
**Session length:** 5-15 minutes, multiple times per day
**Round length:** 4 weeks. All players start equal. Rankings at round end. Reset.

**Elevator pitch:** Build your nation. Grow your economy. Hack your enemies. Dominate the market. Coordinate with your alliance. All from a browser tab at work.

---

## Round Structure

- A **round** lasts 4 real-world weeks (28 days)
- All players start with identical resources and a small nation
- **Ticks** occur every 10 minutes (144 ticks/day, ~4032 ticks/round)
- Each tick: passive income, construction progress, troop training, action cooldowns
- At round end: individual + alliance rankings calculated, awards given
- Optional: 2-3 day "cooldown" between rounds for signups

### Round Phases (built-in pacing)

- **Days 1-7: Growth Phase** — attacking is disabled or heavily penalized. Everyone builds up. Market opens.
- **Days 8-21: Open Phase** — full gameplay. War, espionage, diplomacy, market manipulation.
- **Days 22-28: Endgame** — score multipliers for territory, bonus events, final wars. Tension peaks.

---

## Resources

| Resource | How you get it | What it's for |
|----------|---------------|---------------|
| **Cash ($)** | Taxes (per tick, based on population + commercial buildings), market trading, raiding | Universal currency. Pay troops, buy on market, fund spy ops, research |
| **Materials** | Industrial buildings (per tick), raiding | Construction, fortifications, military hardware |
| **Tech Points** | Research labs (per tick), data theft (cyber op) | Unlock tech tree nodes, power cyber capabilities |
| **Energy** | Power grid (per tick), capped pool that refills | Spend on actions. THE core constraint — forces prioritization |
| **Population** | Grows naturally per tick (based on housing + food). Slow. | Split between Civilians (economy) and Military. Your most precious resource. |
| **Food** | Agricultural buildings (per tick) | Feeds population. Deficit = population decline + unrest |

### Energy — The Core Constraint

- You have an energy pool (e.g., starts at 100, upgradeable)
- Regenerates X per tick (e.g., 2/tick, upgradeable)
- Every active action costs energy: attacking, spy ops, market manipulation, building
- Passive income (per-tick resources) does NOT cost energy
- This prevents 24/7 grinders from dominating — even if you're always online, you're energy-gated
- Strategic choice: do I spend energy on offense, defense, economy, or intelligence?

---

## Nation Management

### Buildings / Infrastructure

Each nation has building slots (expandable). Buildings produce resources per tick or provide capabilities.

| Building | Effect | Category |
|----------|--------|----------|
| **Residential Block** | +population capacity, +tax income | Economy |
| **Farm** | +food per tick | Economy |
| **Factory** | +materials per tick | Economy |
| **Commercial District** | +cash per tick | Economy |
| **Power Plant** | +energy regen, +energy cap | Infrastructure |
| **Research Lab** | +tech points per tick | Tech |
| **Barracks** | +military training speed | Military |
| **Cyber Center** | +cyber op capacity, unlocks advanced ops | Cyber |
| **Missile Defense** | reduces incoming attack damage | Defense |
| **Firewall Array** | reduces incoming cyber attack success | Defense |
| **Intelligence HQ** | +spy defense, +intel reports | Defense |

Buildings take time (ticks) and materials to construct. Can be upgraded to higher levels.

### Population Management

- Population grows slowly each tick (based on housing capacity and food surplus)
- You allocate population between **Civilian** (drives economy) and **Military** (troops)
- Heavy militarization = weak economy. Pure economy = easy target.
- Population lost in war is SLOW to replace — makes war costly and meaningful

---

## Military System

### Unit Types

| Unit | Strength | Cost | Role |
|------|----------|------|------|
| **Infantry** | Balanced ATK/DEF | Low cash + low materials | Bread and butter. Garrison and offense. |
| **Armor** | High ATK, medium DEF | High materials | Offensive punch. Expensive to lose. |
| **Air Force** | High ATK, low DEF | High cash | Devastating offense, fragile. |
| **Drones** | Medium ATK, low DEF | Medium tech + cash | Fast raids, recon support |
| **Navy** | Controls trade routes | High materials + cash | Enables/blocks trade. Niche but strategic. |

### Combat Resolution

- Attacker sends forces → combat resolves based on ATK vs DEF totals
- Modifiers: tech level, fortifications, cyber debuffs, alliance bonuses
- Outcome: attacker wins → captures territory/resources/cash. Loses some troops.
- Outcome: defender wins → attacker loses troops, defender loses fewer
- Both sides always lose SOMETHING — war is never free
- Cooldown between attacks on same target (e.g., 12 hours on casual servers)

### Damage Caps (Casual Server)

- A nation can only lose X% of its military per 24h (e.g., 15%)
- A nation can only lose X% of its territory per 24h
- Once cap is hit, nation becomes "shielded" until reset
- This prevents the Earth 2025 "killed in 10 seconds" problem

---

## Cyber Warfare

The modern twist. A full second layer of gameplay alongside conventional military.

### Cyber Operations

| Operation | Energy Cost | Effect | Countered by |
|-----------|------------|--------|-------------|
| **Recon Scan** | Low | See target's troop counts, resources, buildings | Intelligence HQ |
| **Network Infiltration** | Medium | See target's alliance chat/plans for X ticks (!) | Firewall Array |
| **System Hack** | Medium | Disable target's defenses for X ticks (pre-attack setup) | Firewall Array |
| **Data Theft** | Medium | Steal tech points from target | Firewall Array + encryption tech |
| **Infrastructure Sabotage** | High | Reduce target's energy regen for X ticks | Firewall + Missile Defense |
| **Market Manipulation** | High | Artificially spike/crash a commodity price | (costs cash to execute) |
| **Propaganda** | Medium | Reduce target's population loyalty/morale | Intelligence HQ |
| **EMP Strike** | Very High | Disables ALL target buildings for X ticks. Devastating. | High-level Firewall + specific tech |

### Cyber Specialization

A nation can invest heavily in cyber instead of conventional military. Viable playstyle:
- Weak army, strong cyber
- Hack enemies before allies attack them conventionally
- Steal resources and tech instead of fighting for them
- Essential role in alliance warfare

---

## Stock Market

A global player-driven market per server.

### How it works

- 4 tradeable commodities: **Cash, Materials, Tech Points, Food**
- Players place **buy/sell orders** with quantities and prices
- Orders match automatically (like a real order book)
- Prices are purely player-driven (supply and demand)

### Strategic depth

- **Arbitrage** — buy low, sell high. Profit from market inefficiencies.
- **War profiteering** — prices spike during major wars (materials + food go up). Stockpile before.
- **Market manipulation** — a wealthy alliance buys up all materials before launching a war, starving enemies of building resources.
- **Sanctions** — alliance agreement: "nobody trades with nation X." Informal but enforceable through politics.
- **Cyber manipulation** — the "Market Manipulation" cyber op can artificially move prices to screw with enemies.

### Market Intelligence

- Players can see the order book (public)
- Trade history is public (you can see who's buying what — intelligence!)
- Cyber "Recon" can reveal a player's pending orders

---

## Alliance (Clan) System

### Structure

- **President** — full control, sets policy, declares war
- **Vice President** — backup leadership
- **Minister of War** — can initiate coordinated attacks
- **Minister of Intelligence** — sees all shared spy reports, coordinates cyber ops
- **Minister of Trade** — manages alliance treasury, sets market strategy
- **Members** — regular players

### Features

- **Alliance Chat** — real-time (WebSocket)
- **Forums / Message Board** — persistent threads for strategy, guides, onboarding new members
- **Shared Intelligence** — spy/recon reports automatically shared with alliance
- **Coordinated Attacks** — War Minister can declare a target. Members who attack that target get bonuses (e.g., +20% ATK). Encourages teamwork.
- **Alliance Treasury** — members donate resources. Treasury funds alliance-wide research or assists weaker members.
- **NAPs (Non-Aggression Pacts)** — formalized between alliances. Breaking a NAP visible to all players (reputation hit).
- **Alliance Wars** — formal war declaration. Bonus points for damaging war targets. War stats tracked.
- **Alliance Rankings** — total member strength, war victories, market dominance

---

## Three Server Modes

### Hardcore

- No damage caps
- Full loot on attacks (percentage of all resources)
- Alliances can wipe nations completely
- Fastest progression, highest risk
- For competitive players who want the Earth 2025 experience

### Casual PvP

- Damage caps per 24h (15% military, 10% territory, 20% resources)
- "Shield" activates when cap is hit — nation is untouchable until daily reset
- New player protection for first 72 hours (can't be attacked)
- Alliance warfare still meaningful, just takes sustained campaigns instead of blitzes
- THE default mode for most players

### PvE (Peaceful)

- No player-vs-player attacks or hostile cyber ops
- AI-controlled "rogue states" spawn on the map with varying difficulty
- Players/alliances raid AI nations for resources and ranking points
- Cooperative "boss" events — powerful AI nations that require multiple alliance members
- Competitive element: leaderboard for most AI conquests
- Still has market, still has alliances (for cooperative raids)

---

## Tech Tree (simplified starting point)

Research nodes cost Tech Points + time. Unlock capabilities and bonuses.

### Branches

- **Military** — unit upgrades, new unit types, combat bonuses
- **Cyber** — advanced cyber ops, better defenses, EMP capability
- **Economy** — building efficiency, tax bonuses, market advantages
- **Infrastructure** — energy upgrades, faster construction, population growth

Each branch has ~5-8 nodes. You can't research everything in one round — forces specialization and alliance composition variety.

---

## UI / Screens

### Dashboard (home)

- Nation overview: resources, population, military strength
- Energy bar with regen timer
- Active actions (building, training, attacks in progress)
- Notifications feed (attacks, spy ops, market orders, alliance messages)
- Quick actions: gather, build, train buttons

### Nation Management

- Buildings grid with levels, upgrade buttons, construction queue
- Population allocation slider (civilian ↔ military)
- Resource production summary

### Military

- Troop overview by type
- Training queue
- Attack interface: select target, choose forces, see estimated outcome
- Defense overview: fortifications, cyber defenses

### Cyber Operations

- Available ops list with costs
- Active ops and results
- Cyber defense status

### Market

- Order book (buy/sell for each commodity)
- Price charts (historical)
- Your active orders
- Trade history

### Alliance

- Member list with strengths
- Chat (real-time)
- Forums / threads
- War room: active wars, coordinated targets
- Treasury
- Diplomacy: NAPs, alliances, war declarations

### Rankings

- Individual: military, economic, overall
- Alliance: total power, war wins, market dominance
- Round history

### Profile / Settings

- Nation name, flag/emblem
- Notifications preferences
- Account settings
