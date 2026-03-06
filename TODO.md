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
- [x] Building system — construct new buildings, upgrade existing, level cap (20)
- [x] Military — train units (5 types), barracks speed bonus, troop selection for attacks
- [x] Combat — instant resolution, ATK vs DEF with randomness, troop losses, resource looting
- [x] Cyber operations — all 8 op types fully functional
- [x] Round phase enforcement (Growth phase blocks attacks & cyber ops)
- [x] Beginner shield (24h protection for new nations)
- [x] Attack cooldowns (10 min between same targets)
- [ ] Tech tree — research nodes, unlock bonuses (schema exists, no endpoints)

## Phase 4: Market
- [x] Order book (buy/sell matching engine, price-time priority, transaction-safe)
- [x] Trade endpoints (place, cancel, view orders, trade history)
- [x] Price history tracking / charts
- [ ] Market cooldown / spam prevention

## Phase 5: Alliances
- [x] Create/join/leave alliance
- [x] Roles and permissions (6 roles)
- [x] Alliance kick/promote endpoints
- [x] Alliance president transfer (on leave)
- [x] Alliance treasury (deposit/withdraw)
- [x] Alliance name/tag validation & uniqueness
- [ ] NAPs and war declarations
- [ ] WebSocket chat
- [ ] Coordinated attack bonuses

## Phase 6: Frontend — Game UI
- [x] Auth pages (login/register with password strength)
- [x] Dashboard (resources, energy, round status, quick actions, active builds/trains, shield status, dev tools)
- [x] Nation management (building grid, construction queue, upgrade, level cap display)
- [x] Military (troops table, training, troop selection UI, nation picker, battle history)
- [x] Cyber operations (op cards, target selection, active ops, defense log, result details)
- [x] Market (order book with depth, buy/sell forms, orders, trade history, price chart)
- [x] Alliance (create/join, member roster with roles, browse, kick/promote, treasury)
- [x] Rankings (sortable leaderboard: overall/military/economic, individual/alliance tabs)
- [x] Profile / settings (nation rename, account info, notification preferences)
- [x] Landing page
- [x] Toast notifications system
- [x] Error boundary
- [x] Confirmation dialogs
- [x] Dynamic page titles
- [x] Event log / notification bell
- [x] Auto-refresh (60s tick sync + build/train completion detection)

## Phase 7: Visual Identity & Assets
- [x] Game logo/wordmark
- [x] Landing page with feature cards
- [x] UI icons for all game elements (resources, buildings, units, cyber ops)
- [x] Favicon (SVG)
- [ ] PWA icons
- [ ] Alliance emblems / nation flags

## Phase 8: Security & Hardening
- [x] Rate limiting on auth endpoints
- [x] Admin route authentication (tick, round seed)
- [x] Dev endpoint protection
- [x] Input validation (names, quantities, prices)
- [x] Database indexes for performance
- [x] Market transaction atomicity
- [x] Loot clamping (prevent negative/excess loot)
- [x] Construction queue limits
- [x] Troop training batch cap
- [ ] CSRF protection
- [ ] Helmet security headers

## Phase 9: Polish & Launch Prep
- [ ] PWA manifest + service worker
- [ ] Push notifications
- [ ] Tutorial / onboarding flow
- [ ] Admin panel (round management, moderation)
- [ ] Load testing the tick engine
- [ ] Deploy (VPS, Traefik, CI/CD)

## Not Yet Implemented (from game design doc)
- [ ] Population allocation slider (civilian/military ratio is auto 80/20)
- [ ] PvE mode with AI rogue states
- [ ] Alliance coordinated attack bonuses
- [ ] Alliance war declarations / NAPs
- [ ] Alliance chat (WebSocket)
