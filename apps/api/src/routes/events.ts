import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { OrderStatus } from "../generated/prisma/enums.js";

export async function eventRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // ── GET /nation/events - Recent events for the nation ─────────
  app.get("/nation/events", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: {
        userId_roundId: { userId: req.user!.id, roundId: round.id },
      },
    });
    if (!nation) {
      return reply.status(404).send({ error: "No nation in current round" });
    }

    // Fetch recent attacks received
    const attacksReceived = await prisma.attack.findMany({
      where: { defenderId: nation.id },
      include: {
        attacker: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Fetch recent cyber ops received
    const cyberOpsReceived = await prisma.cyberOp.findMany({
      where: { defenderId: nation.id },
      include: {
        attacker: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Fetch recent filled market orders
    const filledOrders = await prisma.marketOrder.findMany({
      where: {
        nationId: nation.id,
        status: OrderStatus.FILLED,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Merge all events into a single sorted list
    type Event = {
      type: string;
      createdAt: Date;
      data: Record<string, unknown>;
    };

    const events: Event[] = [];

    for (const attack of attacksReceived) {
      events.push({
        type: "ATTACK_RECEIVED",
        createdAt: attack.createdAt,
        data: {
          id: attack.id,
          attackerName: attack.attacker.name,
          attackerId: attack.attacker.id,
          attackerWon: attack.attackerWon,
          lootCash: attack.lootCash,
          lootMaterials: attack.lootMaterials,
          defenderLosses: attack.defenderLosses,
        },
      });
    }

    for (const op of cyberOpsReceived) {
      events.push({
        type: "CYBER_OP_RECEIVED",
        createdAt: op.createdAt,
        data: {
          id: op.id,
          attackerName: op.attacker.name,
          attackerId: op.attacker.id,
          opType: op.type,
          success: op.success,
        },
      });
    }

    for (const order of filledOrders) {
      events.push({
        type: "ORDER_FILLED",
        createdAt: order.filledAt || order.createdAt,
        data: {
          id: order.id,
          side: order.side,
          commodity: order.commodity,
          price: order.price,
          quantity: order.quantity,
        },
      });
    }

    // Sort by createdAt descending, take top 30
    events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const topEvents = events.slice(0, 30);

    return reply.send({ events: topEvents });
  });
}
