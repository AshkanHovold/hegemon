FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ── Install deps ──────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ── Generate Prisma client ────────────────────────────────
FROM deps AS generate
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/
COPY apps/api/tsconfig.json apps/api/
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./
RUN cd apps/api && pnpm exec prisma generate

# ── Runtime (use tsx — Prisma generated code needs extensionless imports) ──
FROM generate AS runtime
COPY apps/api/src apps/api/src
COPY apps/api/docker-entrypoint.sh apps/api/

WORKDIR /app/apps/api
EXPOSE 4100

CMD ["sh", "docker-entrypoint.sh"]
