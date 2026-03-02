import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { TROOP_STATS } from "../config/game.js";
import type { UnitType } from "../generated/prisma/enums.js";

interface RankingsQuery {
  limit?: string;
}

export async function rankingsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: RankingsQuery }>(
    "/rankings",
    async (req, reply) => {
      const limit = Math.min(
        Math.max(parseInt(req.query.limit || "20", 10) || 20, 1),
        100
      );

      // Get active round
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) {
        return reply.status(404).send({ error: "No active round" });
      }

      // Get all nations with troops
      const nations = await prisma.nation.findMany({
        where: { roundId: round.id },
        include: {
          troops: true,
          user: { select: { username: true } },
          allianceMembership: {
            select: {
              alliance: { select: { name: true, tag: true } },
            },
          },
        },
      });

      // Calculate scores and sort
      const ranked = nations
        .map((nation) => {
          // Military score: sum of (troop count * attack power)
          const military = nation.troops.reduce((sum, troop) => {
            const stats = TROOP_STATS[troop.type as UnitType];
            return sum + troop.count * (stats?.atk ?? 0);
          }, 0);

          // Economic score: cash + materials * 10 + techPoints * 20
          const economic =
            nation.cash +
            nation.materials * 10 +
            nation.techPoints * 20;

          const score = military + economic;

          return {
            id: nation.id,
            name: nation.name,
            username: nation.user.username,
            alliance: nation.allianceMembership?.alliance ?? null,
            population: nation.population,
            score: Math.round(score),
            military: Math.round(military),
            economic: Math.round(economic),
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Add rank numbers
      const rankings = ranked.map((n, i) => ({ rank: i + 1, ...n }));

      return reply.send({ rankings });
    }
  );
}
