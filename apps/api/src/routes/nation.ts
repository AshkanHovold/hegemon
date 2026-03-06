import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

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

  // ── Dev cheat: grant resources ───────────────────────────────────────
  app.post("/nation/dev/grant", async (req, reply) => {
    const secret = (req.headers["x-dev-secret"] as string) || "";
    if (secret !== (process.env.DEV_SECRET || "hegemon-dev")) {
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

  // ── Dev cheat: complete all build/train queues instantly ─────────────
  app.post("/nation/dev/complete-all", async (req, reply) => {
    const secret = (req.headers["x-dev-secret"] as string) || "";
    if (secret !== (process.env.DEV_SECRET || "hegemon-dev")) {
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
}
