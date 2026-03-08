import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { wsManager } from "../ws.js";

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
    if (name.length < 2 || name.length > 30) {
      return reply
        .status(400)
        .send({ error: "Alliance name must be 2-30 characters" });
    }
    if (tag.length < 2 || tag.length > 5) {
      return reply
        .status(400)
        .send({ error: "Tag must be 2-5 characters" });
    }
    if (!/^[a-zA-Z0-9]+$/.test(tag)) {
      return reply
        .status(400)
        .send({ error: "Tag must be alphanumeric only" });
    }
    if (description && description.length > 200) {
      return reply
        .status(400)
        .send({ error: "Description must be 200 characters or less" });
    }

    // Check tag uniqueness
    const existingTag = await prisma.alliance.findUnique({
      where: { tag: tag.toUpperCase() },
    });
    if (existingTag) {
      return reply
        .status(409)
        .send({ error: "An alliance with this tag already exists" });
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

    // If president, transfer or dissolve
    if (membership.role === "PRESIDENT") {
      // Check if there are other members
      const otherMembers = await prisma.allianceMember.findMany({
        where: {
          allianceId: membership.allianceId,
          id: { not: membership.id },
        },
        orderBy: { joinedAt: "asc" },
      });

      if (otherMembers.length === 0) {
        // Last member — dissolve
        await prisma.alliance.delete({ where: { id: membership.allianceId } });
        return reply.send({ message: "Alliance dissolved" });
      }

      // Transfer presidency to longest-serving VP, or oldest member
      const successor =
        otherMembers.find((m) => m.role === "VICE_PRESIDENT") ||
        otherMembers[0];

      await prisma.$transaction([
        prisma.allianceMember.update({
          where: { id: successor.id },
          data: { role: "PRESIDENT" },
        }),
        prisma.allianceMember.delete({ where: { id: membership.id } }),
      ]);

      return reply.send({
        message: "Left alliance. Presidency transferred.",
        newPresidentId: successor.nationId,
      });
    }

    // Otherwise just leave
    await prisma.allianceMember.delete({ where: { id: membership.id } });
    return reply.send({ message: "Left alliance" });
  });

  // ── Kick member ──────────────────────────────────────────────
  const ROLE_HIERARCHY: Record<string, number> = {
    PRESIDENT: 5,
    VICE_PRESIDENT: 4,
    MINISTER_OF_WAR: 3,
    MINISTER_OF_INTELLIGENCE: 3,
    MINISTER_OF_TRADE: 3,
    MEMBER: 1,
  };

  app.post<{ Body: { memberId: string } }>("/alliance/kick", async (req, reply) => {
    const { memberId } = req.body;
    if (!memberId) {
      return reply.status(400).send({ error: "memberId is required" });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { allianceMembership: true },
    });
    if (!nation || !nation.allianceMembership) {
      return reply.status(404).send({ error: "Not in an alliance" });
    }

    const myRole = nation.allianceMembership.role;
    if (myRole !== "PRESIDENT" && myRole !== "VICE_PRESIDENT") {
      return reply.status(403).send({ error: "Only PRESIDENT and VICE_PRESIDENT can kick members" });
    }

    const target = await prisma.allianceMember.findUnique({
      where: { id: memberId },
    });
    if (!target || target.allianceId !== nation.allianceMembership.allianceId) {
      return reply.status(404).send({ error: "Member not found in your alliance" });
    }

    const myRank = ROLE_HIERARCHY[myRole] ?? 0;
    const targetRank = ROLE_HIERARCHY[target.role] ?? 0;
    if (targetRank >= myRank) {
      return reply.status(403).send({ error: "Cannot kick someone of equal or higher role" });
    }

    await prisma.allianceMember.delete({ where: { id: target.id } });
    return reply.send({ message: "Member kicked" });
  });

  // ── Promote member ──────────────────────────────────────────
  const VALID_PROMOTE_ROLES = [
    "VICE_PRESIDENT",
    "MINISTER_OF_WAR",
    "MINISTER_OF_INTELLIGENCE",
    "MINISTER_OF_TRADE",
    "MEMBER",
  ];

  app.post<{ Body: { memberId: string; role: string } }>("/alliance/promote", async (req, reply) => {
    const { memberId, role } = req.body;
    if (!memberId || !role) {
      return reply.status(400).send({ error: "memberId and role are required" });
    }

    if (!VALID_PROMOTE_ROLES.includes(role)) {
      return reply.status(400).send({
        error: "Invalid role",
        validRoles: VALID_PROMOTE_ROLES,
      });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { allianceMembership: true },
    });
    if (!nation || !nation.allianceMembership) {
      return reply.status(404).send({ error: "Not in an alliance" });
    }

    if (nation.allianceMembership.role !== "PRESIDENT") {
      return reply.status(403).send({ error: "Only the PRESIDENT can promote members" });
    }

    const target = await prisma.allianceMember.findUnique({
      where: { id: memberId },
    });
    if (!target || target.allianceId !== nation.allianceMembership.allianceId) {
      return reply.status(404).send({ error: "Member not found in your alliance" });
    }

    if (target.id === nation.allianceMembership.id) {
      return reply.status(400).send({ error: "Cannot change your own role" });
    }

    const updated = await prisma.allianceMember.update({
      where: { id: target.id },
      data: { role: role as "VICE_PRESIDENT" | "MINISTER_OF_WAR" | "MINISTER_OF_INTELLIGENCE" | "MINISTER_OF_TRADE" | "MEMBER" },
    });

    return reply.send({ member: updated });
  });

  // ── Treasury deposit ────────────────────────────────────────
  app.post<{ Body: { amount: number } }>("/alliance/treasury/deposit", async (req, reply) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return reply.status(400).send({ error: "Amount must be positive" });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { allianceMembership: true },
    });
    if (!nation || !nation.allianceMembership) {
      return reply.status(404).send({ error: "Not in an alliance" });
    }

    if (nation.cash < amount) {
      return reply.status(400).send({ error: "Not enough cash", have: nation.cash, need: amount });
    }

    await prisma.$transaction([
      prisma.nation.update({
        where: { id: nation.id },
        data: { cash: { decrement: amount } },
      }),
      prisma.alliance.update({
        where: { id: nation.allianceMembership.allianceId },
        data: { treasury: { increment: amount } },
      }),
    ]);

    return reply.send({ message: "Deposited to alliance treasury", amount });
  });

  // ── Treasury withdraw ───────────────────────────────────────
  app.post<{ Body: { amount: number } }>("/alliance/treasury/withdraw", async (req, reply) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return reply.status(400).send({ error: "Amount must be positive" });
    }

    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
      include: { allianceMembership: true },
    });
    if (!nation || !nation.allianceMembership) {
      return reply.status(404).send({ error: "Not in an alliance" });
    }

    const myRole = nation.allianceMembership.role;
    if (myRole !== "PRESIDENT" && myRole !== "MINISTER_OF_TRADE") {
      return reply.status(403).send({ error: "Only PRESIDENT and MINISTER_OF_TRADE can withdraw" });
    }

    const alliance = await prisma.alliance.findUnique({
      where: { id: nation.allianceMembership.allianceId },
    });
    if (!alliance || alliance.treasury < amount) {
      return reply.status(400).send({
        error: "Not enough funds in alliance treasury",
        have: alliance?.treasury ?? 0,
        need: amount,
      });
    }

    await prisma.$transaction([
      prisma.alliance.update({
        where: { id: alliance.id },
        data: { treasury: { decrement: amount } },
      }),
      prisma.nation.update({
        where: { id: nation.id },
        data: { cash: { increment: amount } },
      }),
    ]);

    return reply.send({ message: "Withdrawn from alliance treasury", amount });
  });

  // ── Alliance Chat ───────────────────────────────────────────────────

  // GET /alliance/chat - get recent chat messages
  app.get<{ Querystring: { before?: string; limit?: string } }>(
    "/alliance/chat",
    async (req, reply) => {
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) return reply.status(404).send({ error: "No active round" });

      const nation = await prisma.nation.findUnique({
        where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
        include: { allianceMembership: true },
      });
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });
      if (!nation.allianceMembership) {
        return reply.status(400).send({ error: "Not in an alliance" });
      }

      const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10) || 50, 1), 100);
      const before = req.query.before ? new Date(req.query.before) : undefined;

      const messages = await prisma.allianceChat.findMany({
        where: {
          allianceId: nation.allianceMembership.allianceId,
          ...(before ? { createdAt: { lt: before } } : {}),
        },
        include: {
          nation: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return reply.send({
        messages: messages.reverse().map((m) => ({
          id: m.id,
          nationId: m.nationId,
          nationName: m.nation.name,
          message: m.message,
          createdAt: m.createdAt,
        })),
      });
    }
  );

  // POST /alliance/chat - send a chat message
  app.post<{ Body: { message: string } }>(
    "/alliance/chat",
    async (req, reply) => {
      const { message } = req.body;

      if (!message || message.length < 1 || message.length > 500) {
        return reply.status(400).send({ error: "Message must be 1-500 characters" });
      }

      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) return reply.status(404).send({ error: "No active round" });

      const nation = await prisma.nation.findUnique({
        where: { userId_roundId: { userId: req.user!.id, roundId: round.id } },
        include: {
          allianceMembership: {
            include: {
              alliance: {
                include: {
                  members: { select: { nationId: true } },
                },
              },
            },
          },
        },
      });
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });
      if (!nation.allianceMembership) {
        return reply.status(400).send({ error: "Not in an alliance" });
      }

      const chatMsg = await prisma.allianceChat.create({
        data: {
          allianceId: nation.allianceMembership.allianceId,
          nationId: nation.id,
          message,
        },
      });

      // Broadcast to all alliance members via WebSocket
      const memberIds = nation.allianceMembership.alliance.members
        .map((m) => m.nationId)
        .filter((id) => id !== nation.id);

      wsManager.sendToMany(memberIds, "alliance_chat", {
        id: chatMsg.id,
        nationId: nation.id,
        nationName: nation.name,
        message: chatMsg.message,
        createdAt: chatMsg.createdAt,
      });

      return reply.status(201).send({
        chat: {
          id: chatMsg.id,
          nationId: nation.id,
          nationName: nation.name,
          message: chatMsg.message,
          createdAt: chatMsg.createdAt,
        },
      });
    }
  );
}
