# Hegemon

**Browser-based multiplayer nation-strategy game.**

Build your nation. Grow your economy. Hack your enemies. Dominate the market. Coordinate with your alliance. All from a browser tab.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Fastify + TypeScript + Prisma ORM
- **Database:** PostgreSQL 16
- **Infrastructure:** Docker Compose, pnpm monorepo

## Architecture

```
hegemon/
  apps/
    api/          # Fastify REST API (port 4100)
      src/
        config/   # Game balance constants
        engine/   # Tick engine (10-min game loop)
        middleware/# JWT auth middleware
        routes/   # All API route handlers
      prisma/     # Database schema and migrations
    web/          # React SPA served by nginx (port 3100)
      src/
        components/  # Layout, Sidebar, ResourceBar, TopBar
        context/     # AuthContext, GameContext (with smart auto-refresh)
        hooks/       # useCountdown (shared timer logic)
        lib/         # API client, types, game constants
        pages/       # All game pages (12 total)
  packages/
    shared/       # Shared TypeScript config
  docker-compose.yml
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js >= 20 (for local dev only)
- pnpm >= 9

### Quick Start (Docker)

```bash
# Clone the repo
git clone https://github.com/AshkanHovold/hegemon.git
cd hegemon

# Copy environment file
cp .env.example .env

# Start everything (Postgres + API + Web)
docker compose up -d

# Seed the first round
curl -X POST http://localhost:4100/round/seed

# Open the game
open http://localhost:3100
```

### Local Development

```bash
pnpm install

# Start the database only
docker compose up postgres -d

# Generate Prisma client and run migrations
cd apps/api && pnpm exec prisma migrate deploy && cd ../..

# Run API and web in parallel
pnpm dev
```

### Fresh Reset

```bash
# Wipe database and start over
docker compose down -v && docker compose up -d
curl -X POST http://localhost:4100/round/seed
```

### Environment Variables

See `.env.example` for all options:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://hegemon:hegemon_dev@localhost:5433/hegemon` | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | `hegemon_dev` | Database password |
| `API_PORT` | `4100` | API server port |
| `JWT_SECRET` | `hegemon-dev-secret-change-me` | JWT signing secret (change in production!) |
| `CORS_ORIGINS` | `http://localhost:3100` | Comma-separated allowed origins |
| `DEV_SECRET` | `hegemon-dev` | Secret for dev resource grant endpoint |
| `VITE_API_URL` | `http://localhost:4100` | API URL baked into frontend at build time |

---

## Game Mechanics

### Round Structure

Each round lasts **28 days**. All players start with identical resources. Rankings calculated at round end.

| Phase | Days | Rules |
|-------|------|-------|
| **Growth** | 1-7 | Build up your economy and military |
| **Open** | 8-21 | Full warfare, espionage, diplomacy, market trading |
| **Endgame** | 22-28 | Final wars, score multipliers |

### Tick Engine

A **tick** runs every **10 minutes** (144 ticks/day, ~4,032 ticks/round). Each tick:

1. **Resource production** — Buildings generate resources based on type and level
2. **Energy regeneration** — Base 2/tick + 0.5 per Power Plant level, capped at energyCap
3. **Population growth** — +10 base per tick per Residential level (if food surplus exists)
4. **Food consumption** — 0.01 food per population per tick
5. **Starvation** — If food goes negative, population dies (up to 10% loss per tick)
6. **Construction completion** — Buildings with elapsed `buildsAt` timestamps finish
7. **Training completion** — Troops with elapsed `trainsAt` timestamps become active

### Starting Resources (New Nation)

| Resource | Amount |
|----------|--------|
| Cash | $1,000 |
| Materials | 500 |
| Tech Points | 0 |
| Energy | 100 / 100 |
| Population | 1,000 (800 civilian, 200 military) |
| Food | 500 |
| Starting buildings | Housing Lv.1, Farms Lv.1, Factories Lv.1, Commercial Lv.1, Power Plants Lv.1 |
| Starting troops | 100 Infantry |

### Energy System

Energy is the core constraint that prevents 24/7 grinding. Every active action costs energy:

| Action | Energy Cost |
|--------|------------|
| Construct/Upgrade building | 5 |
| Train troops | 3 |
| Launch attack | 25 |
| Recon Scan | 5 |
| Network Infiltration | 15 |
| System Hack | 15 |
| Data Theft | 15 |
| Infrastructure Sabotage | 25 |
| Market Manipulation | 20 |
| Propaganda | 15 |
| EMP Strike | 40 |

Base pool: 100. Regen: 2/tick + 0.5 per Power Plant level. Passive income (resource production) does **not** cost energy.

---

### Buildings

11 building types. Multiple can be constructed/upgraded simultaneously.

**Cost formula:** `base_cost * (target_level ^ 1.5)`
- Base cost: $500 cash + 200 materials
- Build time: 5 minutes per level

| Building | Effect per Level | Category |
|----------|-----------------|----------|
| Housing | +50 population capacity | Economy |
| Farms | +15 food/tick | Economy |
| Factories | +10 materials/tick | Economy |
| Commercial | +100 cash/tick | Economy |
| Power Plants | +20 energy cap, +0.5 energy regen/tick | Infrastructure |
| Tech Labs | +5 tech points/tick | Tech |
| Barracks | +10% training speed (stacks, min 10% of base time) | Military |
| Cyber Center | +1 cyber operation slot | Cyber |
| Missile Defense | +5% defense bonus to all troops | Defense |
| Firewall Array | +10% cyber defense | Defense |
| Intelligence HQ | +10% intel operation success rate | Defense |

---

### Military

**5 unit types:**

| Unit | ATK | DEF | Cash | Materials | Train Time (per unit) |
|------|-----|-----|------|-----------|----------------------|
| Infantry | 3 | 2 | $100 | 20 | 30 seconds |
| Tanks | 15 | 12 | $800 | 300 | 2 minutes |
| Air Force | 20 | 5 | $1,200 | 100 | 3 minutes |
| Drones | 10 | 3 | $500 | 50 | 1 minute |
| Navy | 12 | 10 | $1,000 | 400 | 4 minutes |

Training speed is reduced by Barracks level (10% faster per level, minimum 10% of base time). Troops are recruited from the military population pool — you need enough military population to train.

---

### Combat System

Attacks resolve instantly when launched:

1. **Power calculation:**
   - Attacker power = sum of (troop count x ATK stat) for all unit types
   - Defender power = sum of (troop count x DEF stat) for all unit types
   - Defender gets +5% per Missile Defense building level

2. **Randomness:** Attacker's effective power is multiplied by a random factor between 0.85 and 1.15

3. **Outcome:** If effective attacker power > defender power, attacker wins

4. **Casualties:**
   - Winner loses 10-20% of each troop type (random)
   - Loser loses 30-50% of each troop type (random)

5. **Loot (attacker wins only):**
   - Steals 5-15% of defender's cash and materials

---

### Cyber Operations

Requires a **Cyber Center** building to launch operations. 8 operation types:

| Operation | Energy | Status | Effect |
|-----------|--------|--------|--------|
| Recon Scan | 5 | Working | Reveals target's troops and resources |
| Network Infiltration | 15 | Stored | See target's alliance plans |
| System Hack | 15 | Stored | Disable target defenses |
| Data Theft | 15 | Working | Steals 10% of target's tech points (max 50 x cyber level) |
| Infrastructure Sabotage | 25 | Stored | Reduce target energy regen |
| Market Manipulation | 20 | Stored | Move commodity prices |
| Propaganda | 15 | Stored | Reduce target morale |
| EMP Strike | 40 | Working | Drains 50% of target's energy instantly |

**Success rate:** Base 60% + (5% x Cyber Center level) - (5% x target's Firewall level), clamped to 10-95%.

("Stored" means the op is recorded but the effect is not yet processed server-side.)

---

### Market

Player-driven commodity exchange with a full order-matching engine.

**Tradeable commodities:** Materials, Tech Points, Food (Cash is the currency, not tradeable)

- **Order types:** BUY and SELL at a specified price and quantity
- **Matching:** Price-time priority — best price first, then earliest order
- **Partial fills:** Orders can be partially filled; remainder stays on the book
- **Buyer fee:** 3.5% added to cost
- **Self-trade prevention:** Can't fill your own orders
- **Cancellation:** Open/partial orders can be cancelled; unfilled quantity is refunded

---

### Alliances

- **Max members:** 20
- **Roles:** President, Vice President, Minister of War, Minister of Intelligence, Minister of Trade, Member
- **Tag:** 2-5 character tag displayed next to nation name
- President leaving dissolves the entire alliance

---

### Rankings & Scoring

**Score calculation:**
- Military score = sum of (troop count x ATK stat) per unit type
- Economic score = cash + (materials x 10) + (tech points x 20)
- Overall score = military + economic

Rankings are sortable by overall, military, or economic score.

---

## Frontend Features

| Page | Features |
|------|----------|
| **Dashboard** | Resource overview with production rates, energy status with time-to-full, round progress, quick action buttons, dev grant tool |
| **Nation** | Building grid with level indicators, construction queue with animated progress bars and live countdowns, unbuilt buildings available to construct, population management |
| **Military** | Troop overview table (count, training, ATK/DEF, totals), training form with unit selector and quantity, nation picker for attacks (searchable, shows rank/score/alliance), attack result banners, battle history log |
| **Cyber Ops** | Operation cards organized by category, target nation dropdown, active operations list, defense log |
| **Market** | Commodity tabs, order book with aggregated bid/ask depth, buy/sell order form, your open orders, recent trade history |
| **Alliance** | Create alliance form, browse/join alliances, member roster with roles, alliance stats |
| **Rankings** | Top 50 leaderboard sortable by overall/military/economic, shows alliance tags |
| **Profile** | Account settings, notification preferences |

**Smart auto-refresh:** A 1-second interval checks if any building or training timer has elapsed. When a completion is detected, the game data is automatically refreshed from the server — no manual page reload needed.

**Live countdown timers:** Buildings under construction and troops in training show animated progress bars with second-by-second countdowns.

---

## API Reference

All authenticated endpoints require `Authorization: Bearer <JWT_TOKEN>` header.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account (email, username, password) |
| POST | `/auth/login` | Login, returns JWT token |
| GET | `/auth/me` | Get current user info |

### Nation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nation` | Your nation with buildings, troops, alliance |
| POST | `/nation` | Create nation in active round |
| GET | `/nation/:id` | Public nation overview (limited info) |
| POST | `/nation/dev/grant` | Dev: grant resources (requires `x-dev-secret` header) |

### Buildings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nation/buildings/construct` | Build new building `{ type }` |
| POST | `/nation/buildings/:id/upgrade` | Upgrade existing building |

### Troops
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nation/troops/train` | Train units `{ type, count }` |

### Combat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nation/attack` | Launch attack `{ defenderId }` |
| GET | `/nation/attacks` | Your last 20 battles |

### Cyber Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nation/cyber` | Active ops and defense log |
| POST | `/nation/cyber/launch` | Launch op `{ type, targetId }` |

### Market
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/market/orders?commodity=X` | Order book for a commodity |
| POST | `/market/orders` | Place order `{ side, commodity, quantity, price }` |
| DELETE | `/market/orders/:id` | Cancel an order |
| GET | `/market/trades` | Recent filled trades |
| GET | `/market/my-orders` | Your open orders |

### Alliance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alliances` | List all alliances |
| GET | `/alliance` | Your alliance details |
| POST | `/alliance` | Create alliance `{ name, tag }` |
| POST | `/alliance/join` | Join alliance `{ allianceId }` |
| DELETE | `/alliance/leave` | Leave or dissolve alliance |

### Rankings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rankings?limit=50` | Top nations ranked by score |

### Admin / Dev
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/round/seed` | Bootstrap initial round |
| POST | `/admin/tick` | Manually trigger a game tick |

---

## Database Schema

Key models (see `apps/api/prisma/schema.prisma` for full schema):

- **User** — email, username, bcrypt password
- **Round** — number, dates, phase (GROWTH/OPEN/ENDGAME/ENDED), active flag
- **Nation** — all resources, population, links to buildings/troops/alliance
- **Building** — type (11 enum values), level, construction state
- **Troop** — type (5 enum values), count, training state
- **Attack** — attacker/defender, forces sent, results, losses, loot
- **CyberOp** — attacker/defender, type, success, result JSON
- **MarketOrder** — side, commodity, price, quantity, fill status
- **Alliance** — name, tag, members with roles

---

## Development Status

See [TODO.md](TODO.md) for a detailed checklist of implemented vs planned features.

**Implemented:** Auth, buildings, troops, combat, 3 cyber ops, market, alliances, rankings, tick engine, full frontend with 12 pages, live progress bars, auto-refresh.

**Not yet implemented:** Tech tree, remaining cyber op effects, round phase enforcement, damage caps, alliance chat, coordinated attacks, PWA, admin panel.

## License

MIT
