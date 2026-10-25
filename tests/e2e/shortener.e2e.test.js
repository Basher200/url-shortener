import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { buildApp } from "../../src/api/app.js";
import { PostgresLinkRepository } from "../../src/infrastructure/postgresLinkRepository.js";
import { createTestPool } from "../helpers/database.js";

describe("end-to-end: API + PostgreSQL", () => {
  let pool;
  let app;

  beforeAll(async () => {
    pool = createTestPool();
    app = buildApp({
      linkRepository: new PostgresLinkRepository(pool),
      baseUrl: "http://short.test",
      logger: false,
    });
    await app.ready();
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE links RESTART IDENTITY");
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  function create(payload) {
    return app.inject({ method: "POST", url: "/api/v1/links", payload });
  }

  function open(code) {
    return app.inject({ method: "GET", url: `/${code}` });
  }

  it("creates a link, stores it in the database, and redirects to it", async () => {
    const created = await create({ longUrl: "https://example.com/page?id=1" });
    const { code } = created.json();

    expect(created.statusCode).toBe(201);

    const { rows } = await pool.query("SELECT long_url FROM links WHERE code = $1", [code]);
    expect(rows).toHaveLength(1);
    expect(rows[0].long_url).toBe("https://example.com/page?id=1");

    const redirect = await open(code);
    expect(redirect.statusCode).toBe(302);
    expect(redirect.headers.location).toBe("https://example.com/page?id=1");
  });

  it("stores the expiry date in the database", async () => {
    await create({
      longUrl: "https://example.com",
      alias: "with-expiry",
      expiresAt: "2099-01-01T00:00:00Z",
    });

    const { rows } = await pool.query("SELECT expires_at FROM links WHERE code = 'with-expiry'");

    expect(rows[0].expires_at).toEqual(new Date("2099-01-01T00:00:00Z"));
  });

  it("rejects a duplicate alias and keeps only one row", async () => {
    const first = await create({ longUrl: "https://a.com", alias: "my-cv" });
    const second = await create({ longUrl: "https://b.com", alias: "my-cv" });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe("ALIAS_TAKEN");

    const { rows } = await pool.query("SELECT long_url FROM links WHERE code = 'my-cv'");
    expect(rows).toHaveLength(1);
    expect(rows[0].long_url).toBe("https://a.com");
  });

  it("lets exactly one of 10 simultaneous requests win the same alias", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        create({ longUrl: "https://example.com", alias: "race-test" }),
      ),
    );

    const statuses = results.map((r) => r.statusCode);

    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(9);

    const { rows } = await pool.query(
      "SELECT count(*)::int AS n FROM links WHERE code = 'race-test'",
    );
    expect(rows[0].n).toBe(1);
  });

  it("returns 410 for a link whose expiry has passed", async () => {
    await pool.query(
      `INSERT INTO links (code, long_url, expires_at)
       VALUES ('old-link', 'https://example.com', now() - interval '1 day')`,
    );

    const res = await open("old-link");

    expect(res.statusCode).toBe(410);
    expect(res.json().error.message).toContain("expired");
  });

  it("returns 410 for a link that was disabled", async () => {
    await create({ longUrl: "https://example.com", alias: "to-disable" });
    await pool.query("UPDATE links SET is_active = false WHERE code = 'to-disable'");

    const res = await open("to-disable");

    expect(res.statusCode).toBe(410);
    expect(res.json().error.message).toContain("disabled");
  });

  it("returns 404 for a code that was never created", async () => {
    const res = await open("never-existed");

    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("LINK_NOT_FOUND");
  });
});