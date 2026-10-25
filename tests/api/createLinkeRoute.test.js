import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/api/app.js";
import { InMemoryLinkRepository } from "../../src/infrastructure/inMemoryLinkRepository.js";

function setup() {
  return buildApp({
    linkRepository: new InMemoryLinkRepository(),
    baseUrl: "http://short.test",
    logger: false,
  });
}

function post(app, payload) {
  return app.inject({ method: "POST", url: "/api/v1/links", payload });
}

describe("POST /api/v1/links", () => {
  it("creates a link with a generated code", async () => {
    const app = setup();

    const res = await post(app, { longUrl: "https://example.com/page" });
    const body = res.json();

    expect(res.statusCode).toBe(201);
    expect(body.code).toHaveLength(7);
    expect(body.shortUrl).toBe(`http://short.test/${body.code}`);
    expect(body.longUrl).toBe("https://example.com/page");
    expect(body.expiresAt).toBeNull();
  });

  it("creates a link with a custom alias", async () => {
    const app = setup();

    const res = await post(app, { longUrl: "https://example.com", alias: "my-cv" });

    expect(res.statusCode).toBe(201);
    expect(res.json().code).toBe("my-cv");
    expect(res.json().shortUrl).toBe("http://short.test/my-cv");
  });

  it("creates a link with an expiry date", async () => {
    const app = setup();

    const res = await post(app, {
      longUrl: "https://example.com",
      expiresAt: "2099-01-01T00:00:00Z",
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().expiresAt).toBe("2099-01-01T00:00:00.000Z");
  });

  it("returns 400 INVALID_URL for a bad URL", async () => {
    const app = setup();

    const res = await post(app, { longUrl: "not a url" });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("INVALID_URL");
  });

  it("returns 400 INVALID_ALIAS for a reserved alias", async () => {
    const app = setup();

    const res = await post(app, { longUrl: "https://example.com", alias: "api" });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("INVALID_ALIAS");
  });

  it("returns 400 INVALID_EXPIRY for a date in the past", async () => {
    const app = setup();

    const res = await post(app, {
      longUrl: "https://example.com",
      expiresAt: "2020-01-01T00:00:00Z",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("INVALID_EXPIRY");
  });

  it("returns 400 INVALID_EXPIRY for text that is not a date", async () => {
    const app = setup();

    const res = await post(app, { longUrl: "https://example.com", expiresAt: "hello" });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("INVALID_EXPIRY");
  });

  it("returns 400 VALIDATION_ERROR when longUrl is missing", async () => {
    const app = setup();

    const res = await post(app, { alias: "my-cv" });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 409 ALIAS_TAKEN when the alias is already used", async () => {
    const app = setup();
    await post(app, { longUrl: "https://a.com", alias: "my-cv" });

    const res = await post(app, { longUrl: "https://b.com", alias: "my-cv" });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("ALIAS_TAKEN");
  });

  it("returns 400 BAD_REQUEST for malformed JSON", async () => {
    const app = setup();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/links",
      headers: { "content-type": "application/json" },
      payload: "{bad json",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("returns 404 ROUTE_NOT_FOUND for an unknown route", async () => {
    const app = setup();

    const res = await app.inject({ method: "GET", url: "/api/v1/unknown" });

    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("ROUTE_NOT_FOUND");
  });
});