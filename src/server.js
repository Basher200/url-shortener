import pg from "pg";
import { buildApp } from "./api/app.js";
import { PostgresLinkRepository } from "./infrastructure/postgresLinkRepository.js";

const port = Number(process.env.PORT) || 3000;
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}`;
const logger = process.env.LOG_LEVEL !== "silent";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const app = buildApp({
  linkRepository: new PostgresLinkRepository(pool),
  baseUrl,
  logger,
});

app.addHook("onClose", async () => {
  await pool.end();
});

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});