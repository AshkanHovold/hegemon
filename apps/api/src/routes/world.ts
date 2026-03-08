import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

interface NewsItem {
  type: string;
  message: string;
  timestamp: Date;
}

export async function worldRoutes(app: FastifyInstance) {
  // GET /world/news - public endpoint, no auth required
  app.get("/world/news", async (_req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const events: NewsItem[] = [];

    // Recent attacks (last 20)
    const recentAttacks = await prisma.attack.findMany({
      where: {
        attacker: { roundId: round.id },
        resolved: true,
      },
      include: {
        attacker: { select: { name: true } },
        defender: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    for (const attack of recentAttacks) {
      const winner = attack.attackerWon
        ? attack.attacker.name
        : attack.defender.name;
      const loser = attack.attackerWon
        ? attack.defender.name
        : attack.attacker.name;
      events.push({
        type: "ATTACK",
        message: `${attack.attacker.name} attacked ${attack.defender.name} - ${winner} was victorious over ${loser}`,
        timestamp: attack.createdAt,
      });
    }

    // New alliances formed (last 10)
    const recentAlliances = await prisma.alliance.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    for (const alliance of recentAlliances) {
      events.push({
        type: "ALLIANCE_FORMED",
        message: `Alliance "${alliance.name}" [${alliance.tag}] has been formed`,
        timestamp: alliance.createdAt,
      });
    }

    // New nations created (last 10)
    const recentNations = await prisma.nation.findMany({
      where: { roundId: round.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { name: true, createdAt: true },
    });

    for (const nation of recentNations) {
      events.push({
        type: "NATION_CREATED",
        message: `${nation.name} has entered the world stage`,
        timestamp: nation.createdAt,
      });
    }

    // Recent wars declared (last 10)
    const recentWars = await prisma.allianceWar.findMany({
      include: {
        aggressor: { select: { name: true, tag: true } },
        defender: { select: { name: true, tag: true } },
      },
      orderBy: { declaredAt: "desc" },
      take: 10,
    });

    for (const war of recentWars) {
      events.push({
        type: "WAR_DECLARED",
        message: `[${war.aggressor.tag}] ${war.aggressor.name} declared war on [${war.defender.tag}] ${war.defender.name}!`,
        timestamp: war.declaredAt,
      });
    }

    // Recent NAPs formed (last 5)
    const recentPacts = await prisma.alliancePact.findMany({
      where: { status: "ACTIVE" },
      include: {
        sender: { select: { name: true, tag: true } },
        receiver: { select: { name: true, tag: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const pact of recentPacts) {
      events.push({
        type: "NAP_SIGNED",
        message: `[${pact.sender.tag}] ${pact.sender.name} and [${pact.receiver.tag}] ${pact.receiver.name} signed a Non-Aggression Pact`,
        timestamp: pact.createdAt,
      });
    }

    // Sort all events by timestamp descending and take top 20
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const topEvents = events.slice(0, 20);

    return reply.send({ events: topEvents });
  });
}
