import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { wsManager } from "../ws.js";

interface SendMessageBody {
  receiverId: string;
  subject: string;
  body: string;
}

interface InboxQuery {
  page?: string;
  limit?: string;
}

export async function messageRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // Helper: get current nation
  async function getCurrentNation(userId: string) {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return null;
    return prisma.nation.findUnique({
      where: { userId_roundId: { userId, roundId: round.id } },
    });
  }

  // GET /nation/messages - inbox (paginated, newest first)
  app.get<{ Querystring: InboxQuery }>("/nation/messages", async (req, reply) => {
    const nation = await getCurrentNation(req.user!.id);
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const page = Math.max(parseInt(req.query.page || "1", 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10) || 20, 1), 50);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { receiverId: nation.id },
        include: {
          sender: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { receiverId: nation.id } }),
    ]);

    return reply.send({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender.name,
        subject: m.subject,
        body: m.body,
        read: m.read,
        createdAt: m.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // GET /nation/messages/unread-count
  app.get("/nation/messages/unread-count", async (req, reply) => {
    const nation = await getCurrentNation(req.user!.id);
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const count = await prisma.message.count({
      where: { receiverId: nation.id, read: false },
    });

    return reply.send({ unreadCount: count });
  });

  // POST /nation/messages - send message
  app.post<{ Body: SendMessageBody }>("/nation/messages", async (req, reply) => {
    const nation = await getCurrentNation(req.user!.id);
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const { receiverId, subject, body } = req.body;

    // Validate
    if (!receiverId) {
      return reply.status(400).send({ error: "receiverId is required" });
    }
    if (!subject || subject.length < 1 || subject.length > 100) {
      return reply.status(400).send({ error: "Subject must be 1-100 characters" });
    }
    if (!body || body.length < 1 || body.length > 1000) {
      return reply.status(400).send({ error: "Body must be 1-1000 characters" });
    }
    if (receiverId === nation.id) {
      return reply.status(400).send({ error: "Cannot send a message to yourself" });
    }

    // Check receiver exists
    const receiver = await prisma.nation.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      return reply.status(404).send({ error: "Receiver nation not found" });
    }

    // Rate limit: max 20 messages per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.message.count({
      where: {
        senderId: nation.id,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentCount >= 20) {
      return reply.status(429).send({ error: "Max 20 messages per hour" });
    }

    const message = await prisma.message.create({
      data: {
        senderId: nation.id,
        receiverId,
        subject,
        body,
      },
    });

    // Notify receiver in real-time
    wsManager.sendTo(receiverId, "new_message", {
      id: message.id,
      senderName: nation.name,
      subject: message.subject,
    });

    return reply.status(201).send({
      message: {
        id: message.id,
        receiverId: message.receiverId,
        subject: message.subject,
        body: message.body,
        createdAt: message.createdAt,
      },
    });
  });

  // PATCH /nation/messages/:id/read - mark as read
  app.patch<{ Params: { id: string } }>(
    "/nation/messages/:id/read",
    async (req, reply) => {
      const nation = await getCurrentNation(req.user!.id);
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });

      const message = await prisma.message.findUnique({
        where: { id: req.params.id },
      });

      if (!message) return reply.status(404).send({ error: "Message not found" });
      if (message.receiverId !== nation.id) {
        return reply.status(403).send({ error: "Not your message" });
      }

      const updated = await prisma.message.update({
        where: { id: message.id },
        data: { read: true },
      });

      return reply.send({ message: { id: updated.id, read: updated.read } });
    }
  );

  // DELETE /nation/messages/:id - delete (only receiver can delete)
  app.delete<{ Params: { id: string } }>(
    "/nation/messages/:id",
    async (req, reply) => {
      const nation = await getCurrentNation(req.user!.id);
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });

      const message = await prisma.message.findUnique({
        where: { id: req.params.id },
      });

      if (!message) return reply.status(404).send({ error: "Message not found" });
      if (message.receiverId !== nation.id) {
        return reply.status(403).send({ error: "Only the receiver can delete a message" });
      }

      await prisma.message.delete({ where: { id: message.id } });

      return reply.send({ deleted: true });
    }
  );
}
