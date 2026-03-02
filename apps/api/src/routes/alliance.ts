import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

interface CreateBody {
  name: string;
  tag: string;
  description?: string;
}

interface JoinBody {
  allianceId: string;
}

export async function allianceRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // ── List all alliances ────────────────────────────────────────────
  app.get("/alliances", async (_req, reply) => {
    const alliances = await prisma.alliance.findMany({
      include: {
        members: {
          include: {
            nation: { select: { name: true, population: true, military: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const result = alliances.map((a) => ({
      id: a.id,
      name: a.name,
      tag: a.tag,
      description: a.description,
      treasury: a.treasury,
      memberCount: a.members.length,
      totalPower: a.members.reduce((sum, m) => sum + m.nation.military, 0),
      createdAt: a.createdAt,
    }));

    return reply.send({ alliances: result });
  });

  // ── Get my alliance details ───────────────────────────────────────
  app.get("/alliance", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { allianceMembership: true },
    });
    if (!nation)
      return reply.status(404).send({ error: "No nation in current round" });

    if (!nation.allianceMembership) {
      return reply.send({ alliance: null, membership: null });
    }

    const alliance = await prisma.alliance.findUnique({
      where: { id: nation.allianceMembership.allianceId },
      include: {
        members: {
          include: {
            nation: {
              select: {
                id: true,
                name: true,
                population: true,
                military: true,
                cash: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return reply.send({
      alliance,
      membership: nation.allianceMembership,
    });
  });

  // ── Create alliance ───────────────────────────────────────────────
  app.post<{ Body: CreateBody }>("/alliance", async (req, reply) => {
    const { name, tag, description } = req.body;

    if (!name || !tag) {
      return reply
        .status(400)
        .send({ error: "Alliance name and tag are required" });
    }
    if (tag.length < 2 || tag.length > 5) {
      return reply
        .status(400)
        .send({ error: "Tag must be 2-5 characters" });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { allianceMembership: true },
    });
    if (!nation)
      return reply.status(404).send({ error: "No nation in current round" });
    if (nation.allianceMembership) {
      return reply
        .status(409)
        .send({ error: "You are already in an alliance" });
    }

    // Create alliance + membership in transaction
    const alliance = await prisma.alliance.create({
      data: {
        name,
        tag: tag.toUpperCase(),
        description: description || null,
        members: {
          create: {
            nationId: nation.id,
            role: "PRESIDENT",
          },
        },
      },
      include: { members: true },
    });

    return reply.status(201).send({ alliance });
  });

  // ── Join alliance ─────────────────────────────────────────────────
  app.post<{ Body: JoinBody }>("/alliance/join", async (req, reply) => {
    const { allianceId } = req.body;
    if (!allianceId) {
      return reply.status(400).send({ error: "Alliance ID required" });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { allianceMembership: true },
    });
    if (!nation)
      return reply.status(404).send({ error: "No nation in current round" });
    if (nation.allianceMembership) {
      return reply
        .status(409)
        .send({ error: "You are already in an alliance" });
    }

    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: { members: true },
    });
    if (!alliance) {
      return reply.status(404).send({ error: "Alliance not found" });
    }
    if (alliance.members.length >= 20) {
      return reply.status(400).send({ error: "Alliance is full (max 20)" });
    }

    const membership = await prisma.allianceMember.create({
      data: {
        nationId: nation.id,
        allianceId: alliance.id,
        role: "MEMBER",
      },
    });

    return reply.status(201).send({ membership });
  });

  // ── Leave alliance ────────────────────────────────────────────────
  app.delete("/alliance/leave", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { allianceMembership: true },
    });
    if (!nation || !nation.allianceMembership) {
      return reply.status(404).send({ error: "Not in an alliance" });
    }

    const membership = nation.allianceMembership;

    // If president, delete entire alliance
    if (membership.role === "PRESIDENT") {
      await prisma.alliance.delete({ where: { id: membership.allianceId } });
      return reply.send({ message: "Alliance dissolved" });
    }

    // Otherwise just leave
    await prisma.allianceMember.delete({ where: { id: membership.id } });
    return reply.send({ message: "Left alliance" });
  });
}
