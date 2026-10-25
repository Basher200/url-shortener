import Fastify from "fastify";
import { makeCreateLink } from "../application/createLink.js";
import { makeResolveLink } from "../application/resolveLink.js";
import { registerErrorHandler } from "./errorHandler.js";
import { registerLinkRoutes } from "./linkRoutes.js";

export function buildApp({ linkRepository, baseUrl = "http://localhost:3000", logger = true }) {
  const app = Fastify({ logger });

  const createLink = makeCreateLink({ linkRepository });
  const resolveLink = makeResolveLink({ linkRepository });

  registerErrorHandler(app);

  app.get("/health", async () => ({ status: "ok" }));

  registerLinkRoutes(app, { createLink, resolveLink, baseUrl });

  return app;
}