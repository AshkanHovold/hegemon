import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { TECH_TREE, ENERGY_COSTS_RESEARCH } from "../config/game.js";
import type { TechBranch } from "../generated/prisma/enums.js";

interface StartResearchBody {
  branch: string;
  nodeId: string;
}

export async function techRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // Helper: get current nation with tech
  async function getCurrentNation(userId: string) {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return null;
    return prisma.nation.findUnique({
      where: { userId_roundId: { userId, roundId: round.id } },
      include: { techNodes: true },
    });
  }

  // GET /nation/tech - get full tech tree with research status
  app.get("/nation/tech", async (req, reply) => {
    const nation = await getCurrentNation(req.user!.id);
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const researched = nation.techNodes;

    const branches = Object.entries(TECH_TREE).map(([branchKey, branch]) => ({
      key: branchKey,
      name: branch.name,
      nodes: branch.nodes.map((node) => {
        const research = researched.find(
          (r) => r.branch === branchKey && r.node === node.id
        );
        return {
          id: node.id,
          name: node.name,
          desc: node.desc,
          tier: node.tier,
          costTP: node.costTP,
          researchTimeMs: node.researchTimeMs,
          effect: node.effect,
          status: research
            ? research.researching
              ? ("researching" as const)
              : ("completed" as const)
            : ("locked" as const),
          researchAt: research?.researchAt ?? null,
          level: research?.level ?? 0,
        };
      }),
    }));

    return reply.send({
      branches,
      techPoints: nation.techPoints,
      energy: nation.energy,
    });
  });

  // POST /nation/tech/research - start researching a tech node
  app.post<{ Body: StartResearchBody }>("/nation/tech/research", async (req, reply) => {
    const { branch, nodeId } = req.body;

    if (!branch || !nodeId) {
      return reply.status(400).send({ error: "branch and nodeId are required" });
    }

    // Validate branch
    const branchKey = branch as keyof typeof TECH_TREE;
    const branchData = TECH_TREE[branchKey];
    if (!branchData) {
      return reply.status(400).send({ error: `Invalid branch: ${branch}` });
    }

    // Validate node
    const nodeData = branchData.nodes.find((n) => n.id === nodeId);
    if (!nodeData) {
      return reply.status(400).send({ error: `Invalid node: ${nodeId}` });
    }

    const nation = await getCurrentNation(req.user!.id);
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    // Check if already researching something
    const activeResearch = nation.techNodes.find((t) => t.researching);
    if (activeResearch) {
      return reply.status(400).send({
        error: "Already researching a technology",
        currentResearch: {
          branch: activeResearch.branch,
          node: activeResearch.node,
          completesAt: activeResearch.researchAt,
        },
      });
    }

    // Check if already completed
    const existing = nation.techNodes.find(
      (t) => t.branch === branchKey && t.node === nodeId
    );
    if (existing && !existing.researching) {
      return reply.status(400).send({ error: "Technology already researched" });
    }

    // Check prerequisites (previous tier must be completed)
    if (nodeData.tier > 1) {
      const prevNode = branchData.nodes.find((n) => n.tier === nodeData.tier - 1);
      if (prevNode) {
        const prevResearch = nation.techNodes.find(
          (t) => t.branch === branchKey && t.node === prevNode.id && !t.researching
        );
        if (!prevResearch) {
          return reply.status(400).send({
            error: `Must research ${prevNode.name} first`,
          });
        }
      }
    }

    // Check energy
    if (nation.energy < ENERGY_COSTS_RESEARCH) {
      return reply.status(400).send({
        error: "Not enough energy",
        need: ENERGY_COSTS_RESEARCH,
        have: nation.energy,
      });
    }

    // Check tech points
    if (nation.techPoints < nodeData.costTP) {
      return reply.status(400).send({
        error: "Not enough tech points",
        need: nodeData.costTP,
        have: nation.techPoints,
      });
    }

    const researchAt = new Date(Date.now() + nodeData.researchTimeMs);

    // Deduct resources and create research record
    await prisma.$transaction([
      prisma.nation.update({
        where: { id: nation.id },
        data: {
          energy: { decrement: ENERGY_COSTS_RESEARCH },
          techPoints: { decrement: nodeData.costTP },
        },
      }),
      prisma.techResearch.create({
        data: {
          nationId: nation.id,
          branch: branchKey as TechBranch,
          node: nodeId,
          researching: true,
          researchAt,
        },
      }),
    ]);

    return reply.status(201).send({
      research: {
        branch: branchKey,
        node: nodeId,
        name: nodeData.name,
        researchAt: researchAt.toISOString(),
      },
    });
  });

  // POST /nation/tech/cancel - cancel active research (no refund)
  app.post("/nation/tech/cancel", async (req, reply) => {
    const nation = await getCurrentNation(req.user!.id);
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const activeResearch = nation.techNodes.find((t) => t.researching);
    if (!activeResearch) {
      return reply.status(400).send({ error: "No active research to cancel" });
    }

    await prisma.techResearch.delete({
      where: { id: activeResearch.id },
    });

    return reply.send({ cancelled: true, node: activeResearch.node });
  });
}
