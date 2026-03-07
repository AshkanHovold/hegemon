import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "hegemon-dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const registerAttempts = new Map<string, { count: number; resetAt: number }>();
const IS_DEV = process.env.NODE_ENV !== "production";
const MAX_LOGIN_ATTEMPTS = IS_DEV ? 1000 : 10;
const MAX_REGISTER_ATTEMPTS = IS_DEV ? 1000 : 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(
  store: Map<string, { count: number; resetAt: number }>,
  ip: string,
  maxAttempts: number,
): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= maxAttempts) {
      return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count++;
  } else {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }
  return { limited: false };
}

function resetRateLimit(
  store: Map<string, { count: number; resetAt: number }>,
  ip: string,
): void {
  store.delete(ip);
}

interface RegisterBody {
  email: string;
  username: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>("/auth/register", async (req, reply) => {
    const regLimit = checkRateLimit(registerAttempts, req.ip, MAX_REGISTER_ATTEMPTS);
    if (regLimit.limited) {
      return reply.status(429).send({
        error: "Too many registration attempts, please try again later",
        retryAfter: regLimit.retryAfter,
      });
    }

    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return reply.status(400).send({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return reply
        .status(400)
        .send({ error: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return reply
        .status(409)
        .send({ error: "Email or username already taken" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hash },
    });

    const token = signToken(user.id);

    return reply.status(201).send({
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  });

  app.post<{ Body: LoginBody }>("/auth/login", async (req, reply) => {
    const loginLimit = checkRateLimit(loginAttempts, req.ip, MAX_LOGIN_ATTEMPTS);
    if (loginLimit.limited) {
      return reply.status(429).send({
        error: "Too many login attempts, please try again later",
        retryAfter: loginLimit.retryAfter,
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return reply
        .status(400)
        .send({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    // Reset rate limit on successful login
    resetRateLimit(loginAttempts, req.ip);

    const token = signToken(user.id);

    return reply.send({
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  });

  // GET /auth/stats - cross-round player stats
  app.get("/auth/stats", async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "No token provided" });
    }

    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as {
        sub: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          username: true,
          totalWins: true,
          totalLosses: true,
          roundsPlayed: true,
          bestRank: true,
        },
      });

      if (!user) {
        return reply.status(401).send({ error: "User not found" });
      }

      // Get current round nation stats
      const round = await prisma.round.findFirst({ where: { active: true } });
      let nationStats = null;
      if (round) {
        const nation = await prisma.nation.findUnique({
          where: { userId_roundId: { userId: user.id, roundId: round.id } },
          select: {
            id: true,
            name: true,
            cash: true,
            materials: true,
            techPoints: true,
            population: true,
          },
        });
        if (nation) {
          nationStats = nation;
        }
      }

      return reply.send({
        stats: {
          totalWins: user.totalWins,
          totalLosses: user.totalLosses,
          roundsPlayed: user.roundsPlayed,
          bestRank: user.bestRank,
        },
        currentNation: nationStats,
      });
    } catch {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });

  app.get("/auth/me", async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "No token provided" });
    }

    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as {
        sub: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, username: true, createdAt: true },
      });

      if (!user) {
        return reply.status(401).send({ error: "User not found" });
      }

      return reply.send({ user });
    } catch {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });
}
