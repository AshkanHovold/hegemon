import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function roundRoutes(app: FastifyInstance) {
  // Get the active round — no auth required
  app.get("/round/active", async (_req, reply) => {
    const round = await prisma.round.findFirst({
      where: { active: true },
    });

    if (!round) {
      return reply.status(404).send({ error: "No active round" });
    }

    return reply.send({ round });
  });

  // Dev bootstrap: seed a round if none exists
  app.post("/round/seed", async (_req, reply) => {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return reply.status(500).send({ error: "ADMIN_SECRET not configured" });
    }
    const secret = _req.headers["x-admin-secret"] as string | undefined;
    if (secret !== adminSecret) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const existing = await prisma.round.findFirst({
      where: { active: true },
    });

    if (existing) {
      return reply.status(409).send({ error: "Active round already exists", round: existing });
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000); // 28 days

    const round = await prisma.round.create({
      data: {
        number: 1,
        startedAt: now,
        endsAt,
        phase: "GROWTH",
        active: true,
      },
    });

    return reply.status(201).send({ round });
  });
}
