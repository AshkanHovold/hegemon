import Fastify from "fastify";
import cors from "@fastify/cors";

const port = Number(process.env.API_PORT) || 4100;

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/", async () => {
  return { name: "hegemon-api", status: "ok" };
});

app.listen({ port, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Hegemon API listening on ${address}`);
});
