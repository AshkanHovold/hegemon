import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * WebSocket connection manager.
 *
 * Tracks active connections by nationId so we can push
 * real-time updates to specific players or broadcast to all.
 */
class ConnectionManager {
  // nationId → Set of WebSocket connections (player can have multiple tabs)
  private connections = new Map<string, Set<WebSocket>>();
  // ws → nationId (reverse lookup for cleanup)
  private wsToNation = new Map<WebSocket, string>();

  add(nationId: string, ws: WebSocket) {
    if (!this.connections.has(nationId)) {
      this.connections.set(nationId, new Set());
    }
    this.connections.get(nationId)!.add(ws);
    this.wsToNation.set(ws, nationId);
  }

  remove(ws: WebSocket) {
    const nationId = this.wsToNation.get(ws);
    if (nationId) {
      const set = this.connections.get(nationId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          this.connections.delete(nationId);
        }
      }
      this.wsToNation.delete(ws);
    }
  }

  /** Send a message to a specific nation (all their tabs/devices). */
  sendTo(nationId: string, event: string, data: unknown) {
    const set = this.connections.get(nationId);
    if (!set) return;

    const message = JSON.stringify({ event, data });
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  /** Broadcast to ALL connected players. */
  broadcast(event: string, data: unknown) {
    const message = JSON.stringify({ event, data });
    for (const [, set] of this.connections) {
      for (const ws of set) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      }
    }
  }

  /** Broadcast to multiple specific nations. */
  sendToMany(nationIds: string[], event: string, data: unknown) {
    const message = JSON.stringify({ event, data });
    for (const nationId of nationIds) {
      const set = this.connections.get(nationId);
      if (!set) continue;
      for (const ws of set) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      }
    }
  }

  get onlineCount(): number {
    return this.connections.size;
  }
}

/** Singleton connection manager */
export const wsManager = new ConnectionManager();

/**
 * Register the WebSocket route.
 *
 * Clients connect to: ws://host:4100/ws?token=<jwt>
 * The token is verified and the connection is associated with
 * the player's nation in the active round.
 */
export async function wsRoute(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, async (socket, req) => {
    const ws = socket as unknown as WebSocket;

    // Authenticate via query param token
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token || !JWT_SECRET) {
      ws.close(4001, "Authentication required");
      return;
    }

    let userId: string;
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
      userId = payload.sub;
    } catch {
      ws.close(4001, "Invalid token");
      return;
    }

    // Look up nation for active round
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) {
      ws.close(4002, "No active round");
      return;
    }

    const nation = await prisma.nation.findUnique({
      where: { userId_roundId: { userId, roundId: round.id } },
    });

    if (!nation) {
      ws.close(4003, "No nation in current round");
      return;
    }

    // Register the connection
    wsManager.add(nation.id, ws);

    // Send initial connection confirmation
    const msg = JSON.stringify({
      event: "connected",
      data: { nationId: nation.id, online: wsManager.onlineCount },
    });
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }

    // Handle client messages (ping/pong for keepalive)
    ws.on("message", (raw: Buffer | string) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.event === "ping") {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: "pong" }));
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    // Cleanup on disconnect
    ws.on("close", () => {
      wsManager.remove(ws);
    });

    ws.on("error", () => {
      wsManager.remove(ws);
    });
  });
}
