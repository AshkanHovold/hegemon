import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "hegemon-dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

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

    const token = signToken(user.id);

    return reply.send({
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
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
