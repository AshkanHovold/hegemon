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
    web/          # React SPA served by nginx (port 3100)
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

# Start everything
docker compose up -d

# Seed the first round
curl -X POST http://localhost:4100/round/seed
```

The game is now running at **http://localhost:3100**.

### Local Development

```bash
pnpm install

# Start the database
docker compose up postgres -d

# Run API and web in parallel
pnpm dev
```

### Environment Variables

See `.env.example` for all available options:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://hegemon:hegemon_dev@localhost:5433/hegemon` | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | `hegemon_dev` | Database password |
| `API_PORT` | `4100` | API server port |
| `JWT_SECRET` | `hegemon-dev-secret-change-me` | JWT signing secret |
| `CORS_ORIGINS` | `http://localhost:3100` | Comma-separated allowed origins |
| `VITE_API_URL` | `http://localhost:4100` | API URL for the frontend |

## Game Overview

### Round Structure

Each round lasts **28 days**. All players start equal. Rankings at round end.

- **Days 1-7: Growth Phase** — Build up your economy and military
- **Days 8-21: Open Phase** — Full warfare, espionage, diplomacy, market trading
- **Days 22-28: Endgame** — Final wars, score multipliers, tension peaks

**Ticks** occur every 10 minutes — producing resources, growing population, regenerating energy.

### Resources

| Resource | Source | Purpose |
|----------|--------|---------|
| **Cash** | Commercial buildings, market trading, raiding | Universal currency |
| **Materials** | Factories, raiding | Construction, military hardware |
| **Tech Points** | Research labs, data theft | Unlock capabilities |
| **Energy** | Power plants (capped pool, regenerates) | Spend on actions — the core constraint |
| **Population** | Natural growth (housing + food) | Civilians (economy) and Military |
| **Food** | Farms | Feeds population. Deficit = decline |

### Buildings (11 types)

| Building | Effect per Level |
|----------|-----------------|
| Housing | +50 population capacity |
| Farms | +15 food/tick |
| Factories | +10 materials/tick |
| Commercial | +100 cash/tick |
| Power Plants | +20 energy cap, +0.5 regen/tick |
| Tech Labs | +5 tech points/tick |
| Barracks | +10% training speed |
| Cyber Center | +1 cyber operation slot |
| Missile Defense | +5% defense bonus |
| Firewall Array | +10% cyber defense |
| Intelligence HQ | +10% intel success rate |

Multiple buildings can be constructed/upgraded simultaneously. Build time: 5 minutes per level.

### Military

Five unit types with different ATK/DEF profiles:

| Unit | ATK | DEF | Train Time |
|------|-----|-----|------------|
| Infantry | 3 | 2 | 30s per unit |
| Tanks | 15 | 12 | 2m per unit |
| Air Force | 20 | 5 | 3m per unit |
| Drones | 10 | 3 | 1m per unit |
| Navy | 12 | 10 | 4m per unit |

**Combat** resolves instantly: attacker's total ATK vs defender's total DEF (with randomness and fortification bonuses). Winner takes lighter casualties and loots resources.

### Cyber Operations

8 cyber operation types including reconnaissance, data theft, EMP strikes, and infrastructure sabotage. Requires a Cyber Center building. Success rate influenced by attacker's cyber level vs defender's firewall level.

### Market

Player-driven commodity market with a full order-matching engine:
- Trade Materials, Tech Points, and Food
- Price-time priority matching
- Partial fills supported
- 3.5% buyer fee

### Alliances

Form alliances (up to 20 members), coordinate strategy, and compete for alliance rankings.

## API Endpoints

### Authentication
- `POST /auth/register` — Create account
- `POST /auth/login` — Login (returns JWT)
- `GET /auth/me` — Current user

### Nation
- `GET /nation` — Your nation (full details)
- `POST /nation` — Create nation in active round
- `GET /nation/:id` — Public nation overview

### Buildings
- `POST /nation/buildings/construct` — Build new building
- `POST /nation/buildings/:id/upgrade` — Upgrade existing building

### Troops
- `POST /nation/troops/train` — Train units

### Combat
- `POST /nation/attack` — Launch attack on another nation
- `GET /nation/attacks` — Your battle history

### Cyber Operations
- `GET /nation/cyber` — Active ops and defense log
- `POST /nation/cyber/launch` — Launch cyber operation

### Market
- `GET /market/orders?commodity=X` — Order book
- `POST /market/orders` — Place order
- `DELETE /market/orders/:id` — Cancel order
- `GET /market/trades` — Recent trades
- `GET /market/my-orders` — Your open orders

### Alliance
- `GET /alliances` — List all alliances
- `GET /alliance` — Your alliance details
- `POST /alliance` — Create alliance
- `POST /alliance/join` — Join alliance
- `DELETE /alliance/leave` — Leave alliance

### Rankings
- `GET /rankings?limit=50` — Top nations

### Admin
- `POST /admin/tick` — Manually trigger a game tick
- `POST /round/seed` — Bootstrap initial round

## License

MIT
