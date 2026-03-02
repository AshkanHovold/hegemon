import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.js";
import { nationRoutes } from "./routes/nation.js";
import { roundRoutes } from "./routes/round.js";
import { buildingRoutes } from "./routes/buildings.js";
import { troopRoutes } from "./routes/troops.js";
import { rankingsRoutes } from "./routes/rankings.js";
import { cyberRoutes } from "./routes/cyber.js";
import { allianceRoutes } from "./routes/alliance.js";
import { marketRoutes } from "./routes/market.js";
import { attackRoutes } from "./routes/attack.js";
import { adminTickRoute, startTickEngine } from "./engine/tick.js";

const port = Number(process.env.API_PORT) || 4100;

const app = Fastify({ logger: true });

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3100")
  .split(",")
  .map((s) => s.trim());

await app.register(cors, {
  origin: CORS_ORIGINS,
  credentials: true,
});

app.get("/", async () => {
  return { name: "hegemon-api", status: "ok" };
});

// Routes
await app.register(authRoutes);
await app.register(nationRoutes);
await app.register(roundRoutes);
await app.register(buildingRoutes);
await app.register(troopRoutes);
await app.register(rankingsRoutes);
await app.register(cyberRoutes);
await app.register(allianceRoutes);
await app.register(marketRoutes);
await app.register(attackRoutes);
await app.register(adminTickRoute);

app.listen({ port, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Hegemon API listening on ${address}`);

  // Start the tick engine after the server is listening
  startTickEngine();
});
