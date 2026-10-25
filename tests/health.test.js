import { describe, it, expect } from "vitest";
import { buildApp } from "../src/api/app.js";
import { InMemoryLinkRepository } from "../src/infrastructure/inMemoryLinkRepository.js";

describe("GET /health", () => {
  it("returns ok", async () => {
    const app = buildApp({ linkRepository: new InMemoryLinkRepository(), logger: false });
    const res = await app.inject({ method: "GET", url: "/health" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });
});