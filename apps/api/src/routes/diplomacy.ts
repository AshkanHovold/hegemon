import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { wsManager } from "../ws.js";

export async function diplomacyRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // Helper: get current nation with alliance membership
  async function getNationWithAlliance(userId: string) {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return null;
    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId, roundId: round.id } },
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
    return nation;
  }

  // ── GET /diplomacy - get all pacts and wars for my alliance ──────────
  app.get("/diplomacy", async (req, reply) => {
    const nation = await getNationWithAlliance(req.user!.id);
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });
    if (!nation.allianceMembership) {
      return reply.status(400).send({ error: "Not in an alliance" });
    }

    const allianceId = nation.allianceMembership.allianceId;

    const [pacts, wars] = await Promise.all([
      prisma.alliancePact.findMany({
        where: {
          OR: [{ senderId: allianceId }, { receiverId: allianceId }],
          status: { in: ["PENDING", "ACTIVE"] },
        },
        include: {
          sender: { select: { id: true, name: true, tag: true } },
          receiver: { select: { id: true, name: true, tag: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.allianceWar.findMany({
        where: {
          OR: [{ aggressorId: allianceId }, { defenderId: allianceId }],
          active: true,
        },
        include: {
          aggressor: { select: { id: true, name: true, tag: true } },
          defender: { select: { id: true, name: true, tag: true } },
        },
        orderBy: { declaredAt: "desc" },
      }),
    ]);

    return reply.send({
      pacts: pacts.map((p) => ({
        id: p.id,
        sender: p.sender,
        receiver: p.receiver,
        status: p.status,
        expiresAt: p.expiresAt,
        createdAt: p.createdAt,
        isIncoming: p.receiverId === allianceId,
      })),
      wars: wars.map((w) => ({
        id: w.id,
        aggressor: w.aggressor,
        defender: w.defender,
        declaredAt: w.declaredAt,
        isAggressor: w.aggressorId === allianceId,
      })),
      allianceId,
    });
  });

  // ── POST /diplomacy/pact - propose a NAP ─────────────────────────────
  app.post<{ Body: { targetAllianceId: string } }>(
    "/diplomacy/pact",
    async (req, reply) => {
      const { targetAllianceId } = req.body;
      if (!targetAllianceId) {
        return reply.status(400).send({ error: "targetAllianceId is required" });
      }

      const nation = await getNationWithAlliance(req.user!.id);
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });
      if (!nation.allianceMembership) {
        return reply.status(400).send({ error: "Not in an alliance" });
      }

      const role = nation.allianceMembership.role;
      if (role !== "PRESIDENT" && role !== "VICE_PRESIDENT") {
        return reply.status(403).send({ error: "Only President or Vice President can propose pacts" });
      }

      const myAllianceId = nation.allianceMembership.allianceId;
      if (myAllianceId === targetAllianceId) {
        return reply.status(400).send({ error: "Cannot make a pact with your own alliance" });
      }

      // Check target exists
      const target = await prisma.alliance.findUnique({
        where: { id: targetAllianceId },
        include: { members: { select: { nationId: true } } },
      });
      if (!target) return reply.status(404).send({ error: "Target alliance not found" });

      // Check no existing pact
      const existing = await prisma.alliancePact.findFirst({
        where: {
          OR: [
            { senderId: myAllianceId, receiverId: targetAllianceId },
            { senderId: targetAllianceId, receiverId: myAllianceId },
          ],
          status: { in: ["PENDING", "ACTIVE"] },
        },
      });
      if (existing) {
        return reply.status(400).send({ error: "A pact already exists between these alliances" });
      }

      // Check no active war
      const war = await prisma.allianceWar.findFirst({
        where: {
          OR: [
            { aggressorId: myAllianceId, defenderId: targetAllianceId },
            { aggressorId: targetAllianceId, defenderId: myAllianceId },
          ],
          active: true,
        },
      });
      if (war) {
        return reply.status(400).send({ error: "Cannot propose a pact during war" });
      }

      const pact = await prisma.alliancePact.create({
        data: {
          senderId: myAllianceId,
          receiverId: targetAllianceId,
        },
        include: {
          sender: { select: { id: true, name: true, tag: true } },
          receiver: { select: { id: true, name: true, tag: true } },
        },
      });

      // Notify target alliance members
      const targetMemberIds = target.members.map((m) => m.nationId);
      wsManager.sendToMany(targetMemberIds, "pact_proposed", {
        pactId: pact.id,
        fromAlliance: pact.sender.name,
      });

      return reply.status(201).send({ pact });
    }
  );

  // ── POST /diplomacy/pact/:id/accept - accept a NAP proposal ─────────
  app.post<{ Params: { id: string } }>(
    "/diplomacy/pact/:id/accept",
    async (req, reply) => {
      const nation = await getNationWithAlliance(req.user!.id);
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });
      if (!nation.allianceMembership) {
        return reply.status(400).send({ error: "Not in an alliance" });
      }

      const role = nation.allianceMembership.role;
      if (role !== "PRESIDENT" && role !== "VICE_PRESIDENT") {
        return reply.status(403).send({ error: "Only President or Vice President can accept pacts" });
      }

      const pact = await prisma.alliancePact.findUnique({
        where: { id: req.params.id },
        include: {
          sender: { include: { members: { select: { nationId: true } } } },
        },
      });
      if (!pact) return reply.status(404).send({ error: "Pact not found" });
      if (pact.receiverId !== nation.allianceMembership.allianceId) {
        return reply.status(403).send({ error: "This pact was not proposed to your alliance" });
      }
      if (pact.status !== "PENDING") {
        return reply.status(400).send({ error: "Pact is not pending" });
      }

      const updated = await prisma.alliancePact.update({
        where: { id: pact.id },
        data: { status: "ACTIVE" },
      });

      // Notify sender alliance
      const senderMemberIds = pact.sender.members.map((m) => m.nationId);
      wsManager.sendToMany(senderMemberIds, "pact_accepted", {
        pactId: pact.id,
        byAlliance: nation.allianceMembership.alliance.name,
      });

      return reply.send({ pact: updated });
    }
  );

  // ── POST /diplomacy/pact/:id/reject - reject/cancel a NAP ───────────
  app.post<{ Params: { id: string } }>(
    "/diplomacy/pact/:id/reject",
    async (req, reply) => {
      const nation = await getNationWithAlliance(req.user!.id);
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });
      if (!nation.allianceMembership) {
        return reply.status(400).send({ error: "Not in an alliance" });
      }

      const role = nation.allianceMembership.role;
      if (role !== "PRESIDENT" && role !== "VICE_PRESIDENT") {
        return reply.status(403).send({ error: "Only President or Vice President can manage pacts" });
      }

      const pact = await prisma.alliancePact.findUnique({
        where: { id: req.params.id },
      });
      if (!pact) return reply.status(404).send({ error: "Pact not found" });

      const myAllianceId = nation.allianceMembership.allianceId;
      if (pact.senderId !== myAllianceId && pact.receiverId !== myAllianceId) {
        return reply.status(403).send({ error: "Not your pact" });
      }

      await prisma.alliancePact.update({
        where: { id: pact.id },
        data: { status: "CANCELLED" },
      });

      return reply.send({ cancelled: true });
    }
  );

  // ── POST /diplomacy/war - declare war on another alliance ────────────
  app.post<{ Body: { targetAllianceId: string } }>(
    "/diplomacy/war",
    async (req, reply) => {
      const { targetAllianceId } = req.body;
      if (!targetAllianceId) {
        return reply.status(400).send({ error: "targetAllianceId is required" });
      }

      const nation = await getNationWithAlliance(req.user!.id);
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });
      if (!nation.allianceMembership) {
        return reply.status(400).send({ error: "Not in an alliance" });
      }

      const role = nation.allianceMembership.role;
      if (role !== "PRESIDENT" && role !== "MINISTER_OF_WAR") {
        return reply.status(403).send({ error: "Only President or Minister of War can declare war" });
      }

      // Check round phase
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (round?.phase === "GROWTH") {
        return reply.status(400).send({ error: "Cannot declare war during Growth phase" });
      }

      const myAllianceId = nation.allianceMembership.allianceId;
      if (myAllianceId === targetAllianceId) {
        return reply.status(400).send({ error: "Cannot declare war on your own alliance" });
      }

      const target = await prisma.alliance.findUnique({
        where: { id: targetAllianceId },
        include: { members: { select: { nationId: true } } },
      });
      if (!target) return reply.status(404).send({ error: "Target alliance not found" });

      // Check no existing active war
      const existingWar = await prisma.allianceWar.findFirst({
        where: {
          OR: [
            { aggressorId: myAllianceId, defenderId: targetAllianceId },
            { aggressorId: targetAllianceId, defenderId: myAllianceId },
          ],
          active: true,
        },
      });
      if (existingWar) {
        return reply.status(400).send({ error: "Already at war with this alliance" });
      }

      // Cancel any active NAP between them
      await prisma.alliancePact.updateMany({
        where: {
          OR: [
            { senderId: myAllianceId, receiverId: targetAllianceId },
            { senderId: targetAllianceId, receiverId: myAllianceId },
          ],
          status: { in: ["PENDING", "ACTIVE"] },
        },
        data: { status: "CANCELLED" },
      });

      const war = await prisma.allianceWar.create({
        data: {
          aggressorId: myAllianceId,
          defenderId: targetAllianceId,
        },
        include: {
          aggressor: { select: { id: true, name: true, tag: true } },
          defender: { select: { id: true, name: true, tag: true } },
        },
      });

      // Notify both alliances
      const myMemberIds = nation.allianceMembership.alliance.members.map((m) => m.nationId);
      const targetMemberIds = target.members.map((m) => m.nationId);

      wsManager.sendToMany(targetMemberIds, "war_declared", {
        warId: war.id,
        byAlliance: war.aggressor.name,
      });
      wsManager.sendToMany(myMemberIds, "war_declared", {
        warId: war.id,
        againstAlliance: war.defender.name,
      });

      return reply.status(201).send({ war });
    }
  );

  // ── POST /diplomacy/war/:id/end - end a war (both sides can agree) ──
  app.post<{ Params: { id: string } }>(
    "/diplomacy/war/:id/end",
    async (req, reply) => {
      const nation = await getNationWithAlliance(req.user!.id);
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });
      if (!nation.allianceMembership) {
        return reply.status(400).send({ error: "Not in an alliance" });
      }

      const role = nation.allianceMembership.role;
      if (role !== "PRESIDENT") {
        return reply.status(403).send({ error: "Only the President can end a war" });
      }

      const war = await prisma.allianceWar.findUnique({
        where: { id: req.params.id },
      });
      if (!war || !war.active) {
        return reply.status(404).send({ error: "Active war not found" });
      }

      const myAllianceId = nation.allianceMembership.allianceId;
      if (war.aggressorId !== myAllianceId && war.defenderId !== myAllianceId) {
        return reply.status(403).send({ error: "Not involved in this war" });
      }

      await prisma.allianceWar.update({
        where: { id: war.id },
        data: { active: false, endedAt: new Date() },
      });

      return reply.send({ ended: true });
    }
  );
}
