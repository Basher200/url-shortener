import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import pg from "pg";
import { PostgresLinkRepository } from "../../src/infrastructure/postgresLinkRepository.js";
import { makeCreateLink } from "../../src/application/createLink.js";
import { makeResolveLink } from "../../src/application/resolveLink.js";
import { AliasTakenError, CodeAlreadyExistsError } from "../../src/domain/errors.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://shortener:shortener@localhost:5433/shortener";

  
describe("PostgresLinkRepository", () => {
  let pool;
  let repo;

  beforeAll(() => {
    pool = new pg.Pool({ connectionString });
    repo = new PostgresLinkRepository(pool);
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE links RESTART IDENTITY");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("inserts a link and returns it with defaults", async () => {
    const link = await repo.insert({ code: "abc1234", longUrl: "https://example.com" });

    expect(link.id).toBe(1n);
    expect(link.code).toBe("abc1234");
    expect(link.longUrl).toBe("https://example.com");
    expect(link.isActive).toBe(true);
    expect(link.expiresAt).toBeNull();
    expect(link.createdAt).toBeInstanceOf(Date);
  });

  it("finds an inserted link by its code", async () => {
    await repo.insert({ code: "abc1234", longUrl: "https://example.com" });

    const found = await repo.findByCode("abc1234");

    expect(found.longUrl).toBe("https://example.com");
  });

  it("returns null when the code does not exist", async () => {
    expect(await repo.findByCode("missing")).toBeNull();
  });

  it("rejects a duplicate code with CodeAlreadyExistsError", async () => {
    await repo.insert({ code: "abc1234", longUrl: "https://a.com" });

    await expect(
      repo.insert({ code: "abc1234", longUrl: "https://b.com" }),
    ).rejects.toThrow(CodeAlreadyExistsError);
  });

  it("stores and returns the expiry date", async () => {
    const expiresAt = new Date("2027-01-01T00:00:00Z");

    await repo.insert({ code: "abc1234", longUrl: "https://example.com", expiresAt });
    const found = await repo.findByCode("abc1234");

    expect(found.expiresAt).toEqual(expiresAt);
  });

  it("stores a URL containing SQL special characters safely", async () => {
    const nasty = "https://example.com/?q='; DROP TABLE links;--";

    await repo.insert({ code: "abc1234", longUrl: nasty });
    const found = await repo.findByCode("abc1234");

    expect(found.longUrl).toBe(nasty);
  });

  it("works with createLink and resolveLink", async () => {
    const createLink = makeCreateLink({ linkRepository: repo });
    const resolveLink = makeResolveLink({ linkRepository: repo });

    await createLink({ longUrl: "https://example.com", alias: "my-cv" });
    const link = await resolveLink("my-cv");

    expect(link.longUrl).toBe("https://example.com");
  });

  it("reports a taken alias through createLink", async () => {
    const createLink = makeCreateLink({ linkRepository: repo });
    await createLink({ longUrl: "https://a.com", alias: "my-cv" });

    await expect(
      createLink({ longUrl: "https://b.com", alias: "my-cv" }),
    ).rejects.toThrow(AliasTakenError);
  });
});