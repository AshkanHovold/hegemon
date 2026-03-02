# Hegemon — Development TODO

## Phase 1: Foundation (current)

- [x] Game design document
- [x] Monorepo setup (pnpm workspaces)
- [x] Fastify API skeleton (port 4100)
- [x] React + Vite + Tailwind web app (port 3100)
- [x] Shared types package
- [x] Docker Compose (Postgres)
- [ ] Database schema (Prisma) — nations, users, buildings, troops, resources, market, alliances
- [ ] Auth system (register/login, JWT sessions)
- [ ] API: core CRUD endpoints (nation, buildings, troops)

## Phase 2: Game Engine

- [ ] Tick engine (runs every 10 minutes, processes all nations)
  - [ ] Resource production (cash, materials, tech, food, energy regen)
  - [ ] Population growth
  - [ ] Construction progress
  - [ ] Troop training progress
- [ ] Round management (create round, track phase, reset)
- [ ] Energy system (pool, regen, spend on actions)

## Phase 3: Core Gameplay APIs

- [ ] Building system — construct, upgrade, demolish
- [ ] Military — train units, view army
- [ ] Combat — attack resolver, damage caps, cooldowns
- [ ] Cyber operations — all 8 ops with counters
- [ ] Tech tree — research nodes, unlock bonuses

## Phase 4: Market

- [ ] Order book (buy/sell matching engine)
- [ ] Price history tracking
- [ ] Trade endpoints
- [ ] Market manipulation (cyber op integration)

## Phase 5: Alliances

- [ ] Create/join/leave alliance
- [ ] Roles and permissions
- [ ] Alliance treasury
- [ ] NAPs and war declarations
- [ ] WebSocket chat (Socket.io)
- [ ] Coordinated attack bonuses

## Phase 6: Frontend — Game UI

- [ ] Auth pages (login/register)
- [ ] Dashboard (resource bars, energy, notifications, quick actions)
- [ ] Nation management (buildings grid, population slider)
- [ ] Military screen (troops, training, attack interface)
- [ ] Cyber operations screen
- [ ] Market (order book, price charts, trade history)
- [ ] Alliance (members, chat, war room, diplomacy)
- [ ] Rankings (individual + alliance)
- [ ] Profile / settings

## Phase 7: Visual Identity & Assets

- [ ] Generate game logo/wordmark
- [ ] Landing page with art
- [ ] UI icons for resources (cash, materials, tech, energy, population, food)
- [ ] UI icons for buildings (11 types)
- [ ] UI icons for military units (5 types)
- [ ] UI icons for cyber operations (8 types)
- [ ] Favicon and PWA icons
- [ ] Alliance emblems / nation flags (template set)

## Phase 8: Polish & Launch Prep

- [ ] PWA manifest + service worker
- [ ] Notification system (in-app + push)
- [ ] Tutorial / onboarding flow
- [ ] Admin panel (round management, moderation)
- [ ] Rate limiting, security hardening
- [ ] Load testing the tick engine
- [ ] Deploy (VPS, Traefik, CI/CD)
