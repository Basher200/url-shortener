import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/api/app.js";
import { InMemoryLinkRepository } from "../../src/infrastructure/inMemoryLinkRepository.js";

function appWith(linkRepository) {
  return buildApp({ linkRepository, baseUrl: "http://short.test", logger: false });
}

function create(app, payload) {
  return app.inject({ method: "POST", url: "/api/v1/links", payload });
}

function open(app, code) {
  return app.inject({ method: "GET", url: `/${code}` });
}

describe("GET /:code", () => {
  it("redirects with 302 to the original URL", async () => {
    const app = appWith(new InMemoryLinkRepository());
    await create(app, { longUrl: "https://example.com/page", alias: "my-cv" });

    const res = await open(app, "my-cv");

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("https://example.com/page");
  });

  it("keeps the query string of the original URL intact", async () => {
    const app = appWith(new InMemoryLinkRepository());
    const longUrl = "https://example.com/search?q=node&page=2";
    await create(app, { longUrl, alias: "search" });

    const res = await open(app, "search");

    expect(res.headers.location).toBe(longUrl);
  });

  it("returns 404 LINK_NOT_FOUND for an unknown code", async () => {
    const app = appWith(new InMemoryLinkRepository());

    const res = await open(app, "missing");

    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("LINK_NOT_FOUND");
  });

  it("returns 410 LINK_GONE for an expired link", async () => {
    const linkRepository = new InMemoryLinkRepository();
    await linkRepository.insert({
      code: "old-link",
      longUrl: "https://example.com",
      expiresAt: new Date("2020-01-01T00:00:00Z"),
    });
    const app = appWith(linkRepository);

    const res = await open(app, "old-link");

    expect(res.statusCode).toBe(410);
    expect(res.json().error.code).toBe("LINK_GONE");
    expect(res.json().error.message).toContain("expired");
  });

  it("returns 410 LINK_GONE for a disabled link", async () => {
    const linkRepository = {
      insert: async () => {
        throw new Error("not used in this test");
      },
      findByCode: async () => ({
        id: 1n,
        code: "off-link",
        longUrl: "https://example.com",
        isActive: false,
        expiresAt: null,
        createdAt: new Date(),
      }),
    };
    const app = appWith(linkRepository);

    const res = await open(app, "off-link");

    expect(res.statusCode).toBe(410);
    expect(res.json().error.message).toContain("disabled");
  });

  it("does not shadow the /health route", async () => {
    const app = appWith(new InMemoryLinkRepository());

    const res = await open(app, "health");

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });
});