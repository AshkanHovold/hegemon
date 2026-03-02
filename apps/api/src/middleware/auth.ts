import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hegemon-dev-secret-change-me";

export interface AuthUser {
  id: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as {
      sub: string;
    };
    req.user = { id: payload.sub };
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}
