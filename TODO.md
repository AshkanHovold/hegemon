# Hegemon — Development Status & Code Review TODO

## Phase 1–6: Foundation through Frontend — DONE
<details>
<summary>Click to expand completed phases</summary>

### Phase 1: Foundation
- [x] Game design document
- [x] Monorepo setup (pnpm workspaces)
- [x] Fastify API skeleton (port 4100)
- [x] React + Vite + Tailwind web app (port 3100)
- [x] Shared types package
- [x] Docker Compose (Postgres + API + Web)
- [x] Database schema (Prisma) — nations, users, buildings, troops, resources, market, alliances, attacks, cyber ops
- [x] Auth system (register/login, JWT sessions)
- [x] API: core CRUD endpoints (nation, buildings, troops)

### Phase 2: Game Engine
- [x] Tick engine (runs every 10 minutes, processes all nations)
- [x] Round management (seed round, active round lookup)
- [x] Energy system (capped pool, regen per tick, spend on actions)

### Phase 3: Core Gameplay APIs
- [x] Building system — construct, upgrade, level cap (20)
- [x] Military — train units (5 types), barracks speed bonus
- [x] Combat — instant resolution, ATK vs DEF, troop losses, looting
- [x] Cyber operations — all 8 op types
- [x] Round phase enforcement
- [x] Beginner shield (24h)
- [x] Attack cooldowns (10 min)

### Phase 4: Market
- [x] Order book (buy/sell matching, price-time priority)
- [x] Trade endpoints
- [x] Price history tracking

### Phase 5: Alliances
- [x] Create/join/leave, roles/permissions, kick/promote
- [x] Alliance treasury

### Phase 6: Frontend — Game UI
- [x] All game pages implemented
- [x] Toast notifications, error boundary, confirmation dialogs
- [x] Auto-refresh (60s tick sync + build/train completion)
- [x] E2E tests — 51/51 passing

</details>

---

## Code Review Findings (sorted by priority)

### P0 — Critical (Security & Data Integrity)

- [x] **Remove all hardcoded default secrets** — JWT, admin, dev secrets now require env vars (fail at startup if missing)

- [x] **Gate dev/admin endpoints** — Dev endpoints return 404 if `DEV_SECRET` env var not set; admin endpoints require `ADMIN_SECRET`

- [ ] **Fix tick engine single-process constraint** — `setInterval` in `tick.ts` means multiple API instances = duplicate tick processing
  - **Fix:** Use `pg_advisory_lock` or Redis distributed lock

- [ ] **Fix in-memory rate limiter** — `auth.ts:9-14` uses `Map()`, won't work across multiple instances
  - **Fix:** Use `@fastify/rate-limit` with Redis store

### P1 — High (Architecture & Major Quality)

- [x] **Add WebSocket support** — Server-side ConnectionManager, JWT auth, reconnection with exponential backoff, ping/pong keepalive. Frontend GameContext integration with event-driven refresh. Polling reduced to 5min fallback.

- [x] **Remove unused shared package dependency** — Removed `@hegemon/shared` from both apps' package.json (was never imported)

- [ ] **Eliminate duplicate type definitions** — Frontend `apps/web/src/lib/types.ts` redefines all types independently
  - **Fix:** Generate from Prisma schema, share via package or codegen

- [ ] **Split oversized page components** — 8 files over 400 lines mixing data fetching + business logic + UI
  - `Military.tsx` (908), `Market.tsx` (687), `Cyber.tsx` (593), `Alliance.tsx` (560)
  - `Dashboard.tsx` (559), `Profile.tsx` (514), `Rankings.tsx` (484), `Nation.tsx` (437)
  - **Fix:** Extract sub-components and custom data-fetching hooks

- [x] **Fix daily login race condition** — Converted to interactive `prisma.$transaction()` for atomic check-then-create

- [ ] **Audit market fill/refund logic** — `market.ts:287-356` complex with uncertain comments
  - **Fix:** Write unit tests for all fill scenarios, simplify formula

- [x] **Fix admin tick route HTTP method** — Changed `/admin/tick` from GET to POST

- [x] **Fix mission progress hack** — Added `claimed` and `claimedAt` fields to Mission model, removed `progress: -1` hack

### P2 — Medium (Code Quality & UX)

- [ ] **Fix bare catch blocks** (11+ instances across API and frontend)
  - API: `tick.ts:214`, `auth.ts:191`, `nation.ts:274`
  - Frontend: `Military.tsx:102-115`, `Cyber.tsx:170-187`, `Messages.tsx:71-137`, `Profile.tsx:40-66`
  - **Fix:** Add `console.error()` minimum, show error UI where appropriate

- [x] **Add missing database indexes** — Added `Message(receiverId, createdAt)` and `Nation(roundId, createdAt)` indexes

- [x] **Fix N+1 in achievements** — Batched achievement creation with `prisma.achievement.createMany()`

- [ ] **Fix unsafe type casts** (partially done)
  - [x] `alliance.ts:360` — Fixed `role as any` → proper union type
  - [ ] `attack.ts:288-370` — `ops: any[]`
  - [ ] `attack.ts:361-362` — untyped JSON losses
  - [ ] `types.ts:93` — `techNodes: unknown[]`
  - **Fix:** Add Zod validation, proper interfaces

- [x] **Centralize frontend game constants** — Added `ENERGY_COSTS`, `MARKET_FEE_PERCENT`, `TICK_INTERVAL_MS` to `gameConstants.ts`; updated Military.tsx and Market.tsx to use them

- [ ] **Fix memory leak risks**
  - `Military.tsx:227` — `setTimeout` in async with no cancellation
  - `GameContext.tsx:144-150` — interval continues when nation is null
  - **Fix:** Use `AbortController`, check mounted state

- [x] **Fix CORS/API URL hardcoding** — docker-compose now uses `${CORS_ORIGINS}` and `${VITE_API_URL}` env vars with localhost defaults

- [x] **Add Docker health check wait** — Added API healthcheck and `condition: service_healthy` for web's depends_on

- [ ] **Add input sanitization** — String inputs (names, messages) not sanitized
  - **Fix:** Add Zod validation schemas on all routes

- [ ] **Standardize error response format** — Inconsistent error messages across routes
  - **Fix:** Use `{ error: string, code?: string }` everywhere

### P3 — Low (Polish)

- [ ] Add ARIA labels and semantic roles to interactive elements
- [ ] Add pagination to large queries (`world.ts:61-66` fetches all nations)
- [ ] Fix floating point precision in energy calculations (`tick.ts:73-88`)
- [ ] Add market order minimum price validation (currently allows price 0)
- [ ] Add rate limits on game actions (market orders, attacks)
- [ ] Replace `console.log` with Fastify logger in tick engine
- [ ] Consider soft deletes for audit trail
- [ ] Fix shared package build config (`main` points to `src/` but build outputs to `dist/`)
- [ ] Fix toast auto-dismiss (not cancellable, hardcoded 4s timeout)
- [ ] Add loading states to Alliance join, and other async buttons

---

## Feature Backlog

### Not Yet Implemented
- [x] Tech tree API endpoints — full implementation with 3 branches, 12 nodes, research/cancel, tick completion
- [x] WebSocket chat for alliances — AllianceChat model, REST endpoints, real-time WS broadcast, frontend chat UI
- [x] NAPs and war declarations — AlliancePact/AllianceWar models, diplomacy API, NAP enforcement in attacks, Diplomacy UI panel
- [ ] Coordinated attack bonuses
- [ ] Market cooldown / spam prevention
- [ ] CSRF protection
- [ ] Helmet security headers
- [ ] PWA manifest + service worker
- [ ] Push notifications
- [ ] Tutorial / onboarding flow improvements
- [ ] Admin panel (round management, moderation)
- [x] Population allocation slider — militaryAllocation field, PATCH endpoint, Profile page slider
- [ ] PvE mode with AI rogue states
- [ ] Alliance emblems / nation flags

### Test Coverage Gaps
- [ ] API unit tests (zero exist) — priority: tick engine, attack calc, market matching, missions
- [ ] E2E: Alliance workflows (create, join, leave, promote)
- [ ] E2E: Market order placement and cancellation
- [ ] E2E: Cyber ops execution
- [ ] E2E: Tech tree research
- [ ] E2E: Multi-player interactions (attack, trade, message between two nations)

---

## Recently Completed
- [x] Code review: comprehensive TODO with 35+ issues categorized by priority
- [x] P0: Remove all hardcoded default secrets (JWT, admin, dev)
- [x] P0: Gate dev endpoints — return 404 when DEV_SECRET not set
- [x] P1: Admin tick route GET → POST
- [x] P1: Mission model — add `claimed`/`claimedAt` fields, remove `progress: -1` hack
- [x] P1: Remove unused shared package dependency
- [x] P2: Add database indexes (Message, Nation)
- [x] P2: Fix N+1 in achievement checks (batch createMany)
- [x] P2: Centralize game constants (ENERGY_COSTS, MARKET_FEE_PERCENT)
- [x] P2: Fix CORS/API URL hardcoding in docker-compose
- [x] P2: Add Docker API healthcheck + web depends_on condition
- [x] P2: Fix alliance role unsafe cast (`as any` → union type)
- [x] P2: Auth routes use requireAuth middleware (removed manual JWT parsing)
- [x] P2: Tick engine uses Fastify logger instead of console.log
- [x] Fix all E2E tests (18 failing → 51/51 passing)
- [x] Fix Dashboard crash (API response shape mismatches)
- [x] Fix rate limiter blocking E2E tests (limits 1000 in dev mode)
- [x] Fix NationEmblem JSX type error
- [x] Fix Messages page (recipientId/receiverId mismatch)
- [x] Fix Achievements page (key/type mismatch)
- [x] Add missing /nation/search endpoint
- [x] Add missing route imports (Achievements, Messages, TechTree)
- [x] Add Achievements and Messages to Sidebar
- [x] P1: WebSocket real-time updates (server + client + GameContext integration)
- [x] Tech tree — full API + frontend with 3 branches, 12 nodes, research/cancel, tick completion
- [x] Alliance real-time chat — AllianceChat model, WS broadcast, chat UI
- [x] Daily login race condition — interactive $transaction
