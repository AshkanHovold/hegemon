import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  BUILDING_PRODUCTION,
  TICK_INTERVAL_MS,
} from "../config/game.js";
import type { BuildingType } from "../generated/prisma/enums.js";

interface CreateNationBody {
  name: string;
  roundId: string;
}

export async function nationRoutes(app: FastifyInstance) {
  // All nation routes require auth
  app.addHook("onRequest", requireAuth);

  // Get current user's nation for the active round
  app.get("/nation", async (req, reply) => {
    const round = await prisma.round.findFirst({
      where: { active: true },
    });

    if (!round) {
      return reply.status(404).send({ error: "No active round" });
    }

    const nation = await prisma.nation.findUnique({
      where: {
        userId_roundId: { userId: req.user!.id, roundId: round.id },
      },
      include: {
        buildings: true,
        troops: true,
        techNodes: true,
        allianceMembership: { include: { alliance: true } },
      },
    });

    if (!nation) {
      return reply.status(404).send({ error: "No nation in current round" });
    }

    return reply.send({ nation });
  });

  // Create a nation for a round
  app.post<{ Body: CreateNationBody }>("/nation", async (req, reply) => {
    const { name, roundId } = req.body;

    if (!name || !roundId) {
      return reply
        .status(400)
        .send({ error: "Nation name and round ID required" });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      return reply
        .status(400)
        .send({ error: "Nation name must be 2-30 characters" });
    }
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmedName)) {
      return reply
        .status(400)
        .send({ error: "Nation name can only contain letters, numbers, spaces, hyphens, and underscores" });
    }

    const existing = await prisma.nation.findUnique({
      where: {
        userId_roundId: { userId: req.user!.id, roundId },
      },
    });

    if (existing) {
      return reply
        .status(409)
        .send({ error: "You already have a nation in this round" });
    }

    const nation = await prisma.nation.create({
      data: {
        name: trimmedName,
        userId: req.user!.id,
        roundId,
        shieldUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        // Starting buildings
        buildings: {
          create: [
            { type: "RESIDENTIAL", level: 1 },
            { type: "FARM", level: 1 },
            { type: "FACTORY", level: 1 },
            { type: "COMMERCIAL", level: 1 },
            { type: "POWER_PLANT", level: 1 },
          ],
        },
        // Starting troops
        troops: {
          create: [
            { type: "INFANTRY", count: 100 },
            { type: "ARMOR", count: 0 },
            { type: "AIR_FORCE", count: 0 },
            { type: "DRONES", count: 0 },
            { type: "NAVY", count: 0 },
          ],
        },
      },
      include: {
        buildings: true,
        troops: true,
      },
    });

    return reply.status(201).send({ nation });
  });

  // ── Dev cheat: grant resources (dev/test only) ──────────────────────
  app.post("/nation/dev/grant", async (req, reply) => {
    const devSecret = process.env.DEV_SECRET;
    if (!devSecret) {
      return reply.status(404).send({ error: "Not found" });
    }
    const secret = (req.headers["x-dev-secret"] as string) || "";
    if (secret !== devSecret) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
    });
    if (!nation) return reply.status(404).send({ error: "No nation" });

    const updated = await prisma.nation.update({
      where: { id: nation.id },
      data: {
        cash: { increment: 50000 },
        materials: { increment: 20000 },
        techPoints: { increment: 5000 },
        food: { increment: 10000 },
        energy: nation.energyCap, // refill energy
      },
    });

    return reply.send({
      message: "Dev resources granted",
      granted: { cash: 50000, materials: 20000, techPoints: 5000, food: 10000, energy: "refilled" },
      nation: {
        cash: updated.cash,
        materials: updated.materials,
        techPoints: updated.techPoints,
        food: updated.food,
        energy: updated.energy,
      },
    });
  });

  // ── Dev cheat: complete all build/train queues instantly (dev/test only)
  app.post("/nation/dev/complete-all", async (req, reply) => {
    const devSecret = process.env.DEV_SECRET;
    if (!devSecret) {
      return reply.status(404).send({ error: "Not found" });
    }
    const secret = (req.headers["x-dev-secret"] as string) || "";
    if (secret !== devSecret) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { buildings: true, troops: true },
    });
    if (!nation) return reply.status(404).send({ error: "No nation" });

    const now = new Date();

    // Complete all building queues
    const buildingUpdates = nation.buildings
      .filter((b) => b.building && b.buildsAt && new Date(b.buildsAt) > now)
      .map((b) =>
        prisma.building.update({
          where: { id: b.id },
          data: { buildsAt: now },
        })
      );

    // Complete all troop training queues
    const troopUpdates = nation.troops
      .filter((t) => t.training > 0 && t.trainsAt && new Date(t.trainsAt) > now)
      .map((t) =>
        prisma.troop.update({
          where: { id: t.id },
          data: { trainsAt: now },
        })
      );

    await prisma.$transaction([...buildingUpdates, ...troopUpdates]);

    return reply.send({
      message: "All queues completed",
      completed: {
        buildings: buildingUpdates.length,
        troops: troopUpdates.length,
      },
    });
  });

  // Get nation overview (for other players — public info)
  app.get<{ Params: { id: string } }>("/nation/:id", async (req, reply) => {
    const nation = await prisma.nation.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        serverMode: true,
        population: true,
        civilians: true,
        military: true,
        cash: true,
        materials: true,
        techPoints: true,
        shieldUntil: true,
        allianceMembership: {
          select: {
            role: true,
            alliance: { select: { name: true, tag: true } },
          },
        },
        troops: {
          select: { type: true, count: true },
        },
        createdAt: true,
      },
    });

    if (!nation) {
      return reply.status(404).send({ error: "Nation not found" });
    }

    return reply.send({ nation });
  });

  // ── Daily Login Bonus ────────────────────────────────────────
  const DAILY_REWARDS: Record<number, { cash: number; materials: number; tech: number }> = {
    1: { cash: 1000, materials: 0, tech: 0 },
    2: { cash: 0, materials: 500, tech: 0 },
    3: { cash: 2000, materials: 1000, tech: 0 },
    4: { cash: 0, materials: 0, tech: 200 },
    5: { cash: 5000, materials: 2000, tech: 500 },
    6: { cash: 3000, materials: 0, tech: 0 },
  };
  const DAY_7_PLUS_REWARD = { cash: 10000, materials: 5000, tech: 1000 };

  function getRewardForDay(day: number): { cash: number; materials: number; tech: number } {
    if (day >= 7) return DAY_7_PLUS_REWARD;
    return DAILY_REWARDS[day] || DAILY_REWARDS[1];
  }

  function isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getUTCFullYear() === d2.getUTCFullYear() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCDate() === d2.getUTCDate()
    );
  }

  function isYesterday(d1: Date, today: Date): boolean {
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return isSameDay(d1, yesterday);
  }

  app.post("/nation/daily-claim", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const now = new Date();

    // Use interactive transaction to prevent race condition (check-then-create atomicity)
    try {
      const result = await prisma.$transaction(async (tx) => {
        const lastLogin = await tx.dailyLogin.findFirst({
          where: { nationId: nation.id },
          orderBy: { claimedAt: "desc" },
        });

        if (lastLogin && isSameDay(lastLogin.claimedAt, now)) {
          return { alreadyClaimed: true as const };
        }

        let day = 1;
        if (lastLogin && isYesterday(lastLogin.claimedAt, now)) {
          day = lastLogin.day + 1;
        }

        const rewards = getRewardForDay(day);

        const updateData: Record<string, unknown> = {};
        if (rewards.cash > 0) updateData.cash = { increment: rewards.cash };
        if (rewards.materials > 0) updateData.materials = { increment: rewards.materials };
        if (rewards.tech > 0) updateData.techPoints = { increment: rewards.tech };

        await tx.dailyLogin.create({
          data: { nationId: nation.id, day },
        });
        await tx.nation.update({
          where: { id: nation.id },
          data: updateData,
        });

        return { alreadyClaimed: false as const, day, rewards };
      });

      if (result.alreadyClaimed) {
        const nextClaimAt = new Date(now);
        nextClaimAt.setUTCDate(nextClaimAt.getUTCDate() + 1);
        nextClaimAt.setUTCHours(0, 0, 0, 0);
        return reply.status(400).send({
          error: "Already claimed today",
          claimed: false,
          nextClaimAt,
        });
      }

      const nextClaimAt = new Date(now);
      nextClaimAt.setUTCDate(nextClaimAt.getUTCDate() + 1);
      nextClaimAt.setUTCHours(0, 0, 0, 0);

      return reply.send({ claimed: true, day: result.day, rewards: result.rewards, nextClaimAt });
    } catch {
      return reply.status(500).send({ error: "Failed to claim daily reward" });
    }
  });

  app.get("/nation/daily-status", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const now = new Date();
    const lastLogin = await prisma.dailyLogin.findFirst({
      where: { nationId: nation.id },
      orderBy: { claimedAt: "desc" },
    });

    const claimableToday = !lastLogin || !isSameDay(lastLogin.claimedAt, now);

    let currentStreak = 0;
    if (lastLogin) {
      if (isSameDay(lastLogin.claimedAt, now) || isYesterday(lastLogin.claimedAt, now)) {
        currentStreak = lastLogin.day;
      }
    }

    const nextClaimAt = claimableToday
      ? null
      : (() => {
          const next = new Date(now);
          next.setUTCDate(next.getUTCDate() + 1);
          next.setUTCHours(0, 0, 0, 0);
          return next;
        })();

    return reply.send({
      currentStreak,
      claimableToday,
      lastClaimedAt: lastLogin?.claimedAt ?? null,
      nextClaimAt,
    });
  });

  // ── While You Were Away ─────────────────────────────────────
  app.get<{ Querystring: { since?: string } }>("/nation/away-summary", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { buildings: true },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const sinceParam = req.query.since;
    if (!sinceParam) {
      return reply.status(400).send({ error: "since query param (ISO timestamp) is required" });
    }
    const since = new Date(sinceParam);
    if (isNaN(since.getTime())) {
      return reply.status(400).send({ error: "Invalid since timestamp" });
    }

    const now = new Date();
    const elapsedMs = now.getTime() - since.getTime();
    const ticksElapsed = Math.floor(elapsedMs / TICK_INTERVAL_MS);

    // Calculate production from buildings
    let cashProduced = 0;
    let materialsProduced = 0;
    let techProduced = 0;
    let foodProduced = 0;

    for (const b of nation.buildings) {
      if (b.building) continue;
      const btype = b.type as BuildingType;
      switch (btype) {
        case "COMMERCIAL":
          cashProduced += BUILDING_PRODUCTION.COMMERCIAL.cash * b.level * ticksElapsed;
          break;
        case "FACTORY":
          materialsProduced += BUILDING_PRODUCTION.FACTORY.materials * b.level * ticksElapsed;
          break;
        case "RESEARCH_LAB":
          techProduced += BUILDING_PRODUCTION.RESEARCH_LAB.techPoints * b.level * ticksElapsed;
          break;
        case "FARM":
          foodProduced += BUILDING_PRODUCTION.FARM.food * b.level * ticksElapsed;
          break;
      }
    }

    // Attacks received since then
    const attacksReceived = await prisma.attack.findMany({
      where: {
        defenderId: nation.id,
        createdAt: { gte: since },
        resolved: true,
      },
      include: {
        attacker: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Market orders filled since then
    const ordersFilled = await prisma.marketOrder.findMany({
      where: {
        nationId: nation.id,
        status: "FILLED",
        filledAt: { gte: since },
      },
      orderBy: { filledAt: "desc" },
    });

    return reply.send({
      since: since.toISOString(),
      ticksElapsed,
      resourcesProduced: {
        cash: cashProduced,
        materials: materialsProduced,
        techPoints: techProduced,
        food: foodProduced,
      },
      attacksReceived: attacksReceived.map((a) => ({
        attackerName: a.attacker.name,
        attackerWon: a.attackerWon,
        lootCash: a.lootCash,
        lootMaterials: a.lootMaterials,
        createdAt: a.createdAt,
      })),
      ordersFilled: ordersFilled.map((o) => ({
        side: o.side,
        commodity: o.commodity,
        price: o.price,
        quantity: o.quantity,
        filledAt: o.filledAt,
      })),
    });
  });

  // ── Conscription ────────────────────────────────────────────
  app.post<{ Body: { ratio: number } }>("/nation/conscription", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const { ratio } = req.body;
    if (typeof ratio !== "number" || ratio < 0.1 || ratio > 0.9) {
      return reply.status(400).send({ error: "Ratio must be between 0.1 and 0.9" });
    }

    const updated = await prisma.nation.update({
      where: { id: nation.id },
      data: { conscriptionRatio: ratio },
    });

    return reply.send({
      conscriptionRatio: updated.conscriptionRatio,
      message: `Civilian ratio set to ${(ratio * 100).toFixed(0)}%`,
    });
  });

  // ── Rename nation ─────────────────────────────────────────────
  app.patch<{ Body: { name: string } }>("/nation/name", async (req, reply) => {
    const { name } = req.body;
    if (!name) {
      return reply.status(400).send({ error: "Name is required" });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      return reply
        .status(400)
        .send({ error: "Nation name must be 2-30 characters" });
    }
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmedName)) {
      return reply
        .status(400)
        .send({ error: "Nation name can only contain letters, numbers, spaces, hyphens, and underscores" });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
    });
    if (!nation) {
      return reply.status(404).send({ error: "No nation in current round" });
    }

    const updated = await prisma.nation.update({
      where: { id: nation.id },
      data: { name: trimmedName },
    });

    return reply.send({ nation: { id: updated.id, name: updated.name } });
  });

  // GET /nation/search?q=... - search nations by name
  app.get<{ Querystring: { q?: string } }>("/nation/search", async (req, reply) => {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) {
      return reply.send({ nations: [] });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.send({ nations: [] });

    const nations = await prisma.nation.findMany({
      where: {
        roundId: round.id,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true },
      take: 10,
    });

    return reply.send({ nations });
  });

  // ── Population Allocation ───────────────────────────────────────────
  app.patch<{ Body: { militaryAllocation: number } }>(
    "/nation/allocation",
    async (req, reply) => {
      const { militaryAllocation } = req.body;

      if (
        typeof militaryAllocation !== "number" ||
        militaryAllocation < 0 ||
        militaryAllocation > 1
      ) {
        return reply
          .status(400)
          .send({ error: "militaryAllocation must be a number between 0 and 1" });
      }

      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) return reply.status(404).send({ error: "No active round" });

      const nation = await prisma.nation.findUnique({
        where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      });
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });

      // Round to 2 decimal places
      const rounded = Math.round(militaryAllocation * 100) / 100;

      await prisma.nation.update({
        where: { id: nation.id },
        data: { militaryAllocation: rounded },
      });

      return reply.send({
        militaryAllocation: rounded,
        civilianAllocation: Math.round((1 - rounded) * 100) / 100,
      });
    }
  );
}
