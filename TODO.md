# Hegemon — Development Status

## Phase 1: Foundation
- [x] Game design document
- [x] Monorepo setup (pnpm workspaces)
- [x] Fastify API skeleton (port 4100)
- [x] React + Vite + Tailwind web app (port 3100)
- [x] Shared types package
- [x] Docker Compose (Postgres + API + Web)
- [x] Database schema (Prisma) — nations, users, buildings, troops, resources, market, alliances, attacks, cyber ops
- [x] Auth system (register/login, JWT sessions)
- [x] API: core CRUD endpoints (nation, buildings, troops)

## Phase 2: Game Engine
- [x] Tick engine (runs every 10 minutes, processes all nations)
  - [x] Resource production (cash, materials, tech, food, energy regen)
  - [x] Population growth (housing-based, food-gated, starvation on deficit)
  - [x] Construction completion (buildsAt timestamp check)
  - [x] Troop training completion (trainsAt timestamp check)
- [x] Round management (seed round, active round lookup)
- [x] Energy system (capped pool, regen per tick, spend on actions)

## Phase 3: Core Gameplay APIs
- [x] Building system — construct new buildings, upgrade existing
- [x] Military — train units (5 types), barracks speed bonus
- [x] Combat — instant resolution, ATK vs DEF with randomness, troop losses, resource looting
- [x] Cyber operations — 8 op types, 3 fully functional (recon, data theft, EMP)
- [ ] Tech tree — research nodes, unlock bonuses (schema exists, no endpoints)

## Phase 4: Market
- [x] Order book (buy/sell matching engine, price-time priority)
- [ ] Price history tracking / charts
- [x] Trade endpoints (place, cancel, view orders, trade history)
- [ ] Market manipulation (cyber op stored but not processed)

## Phase 5: Alliances
- [x] Create/join/leave alliance
- [x] Roles and permissions (6 roles)
- [ ] Alliance treasury (field exists, no deposit/withdraw)
- [ ] NAPs and war declarations
- [ ] WebSocket chat
- [ ] Coordinated attack bonuses

## Phase 6: Frontend — Game UI
- [x] Auth pages (login/register)
- [x] Dashboard (resource bars, energy, production rates, quick actions, dev tools)
- [x] Nation management (building grid, construction queue with progress bars, upgrade)
- [x] Military (troops table, training with progress bars, nation picker for attacks, battle history)
- [x] Cyber operations (op cards by category, target selection, active ops, defense log)
- [x] Market (order book with depth, buy/sell forms, your orders, trade history)
- [x] Alliance (create/join, member roster with roles, browse alliances)
- [x] Rankings (sortable leaderboard: overall, military, economic)
- [x] Profile / settings (account info, notification preferences)
- [x] Landing page

## Phase 7: Visual Identity & Assets
- [x] Game logo/wordmark
- [x] Landing page with feature cards and stats
- [x] UI icons for resources (6 types — generated PNG)
- [x] UI icons for buildings (11 types — generated PNG)
- [x] UI icons for military units (5 types — generated PNG)
- [x] UI icons for cyber operations (8 types — generated PNG)
- [x] Favicon
- [ ] PWA icons
- [ ] Alliance emblems / nation flags

## Phase 8: Polish & Launch Prep
- [ ] PWA manifest + service worker
- [ ] Notification system (in-app + push)
- [ ] Tutorial / onboarding flow
- [ ] Admin panel (round management, moderation)
- [ ] Rate limiting, security hardening
- [ ] Load testing the tick engine
- [ ] Deploy (VPS, Traefik, CI/CD)

## Not Yet Implemented (from game design doc)
- [ ] Round phase enforcement (Growth phase should block attacks)
- [ ] Damage caps / shields (casual server mode)
- [ ] Attack cooldowns between same targets
- [ ] Remaining cyber ops effects (network infiltration, system hack, infrastructure sabotage, market manipulation, propaganda)
- [ ] Population allocation slider (civilian/military ratio is auto 80/20)
- [ ] Alliance chat (WebSocket)
- [ ] Alliance coordinated attack bonuses
- [ ] Alliance war declarations / NAPs
- [ ] PvE mode with AI rogue states
- [ ] Price charts on market
- [ ] Notification feed / event log
