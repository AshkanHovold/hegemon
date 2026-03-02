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
        name,
        userId: req.user!.id,
        roundId,
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
        allianceMembership: {
          select: {
            role: true,
            alliance: { select: { name: true, tag: true } },
          },
        },
        createdAt: true,
      },
    });

    if (!nation) {
      return reply.status(404).send({ error: "Nation not found" });
    }

    return reply.send({ nation });
  });
}
