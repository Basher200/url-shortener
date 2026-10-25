import { describe, it, expect } from "vitest";
import { InMemoryLinkRepository } from "../../src/infrastructure/inMemoryLinkRepository.js";
import { CodeAlreadyExistsError } from "../../src/domain/errors.js";

describe("InMemoryLinkRepository", () => {
  it("inserts a link and returns it with defaults", async () => {
    const repo = new InMemoryLinkRepository();

    const link = await repo.insert({ code: "abc1234", longUrl: "https://example.com" });

    expect(link.id).toBe(1n);
    expect(link.code).toBe("abc1234");
    expect(link.longUrl).toBe("https://example.com");
    expect(link.isActive).toBe(true);
    expect(link.expiresAt).toBeNull();
    expect(link.createdAt).toBeInstanceOf(Date);
  });

  it("gives each new link a higher id", async () => {
    const repo = new InMemoryLinkRepository();

    const first = await repo.insert({ code: "aaa1111", longUrl: "https://a.com" });
    const second = await repo.insert({ code: "bbb2222", longUrl: "https://b.com" });

    expect(second.id).toBeGreaterThan(first.id);
  });

  it("finds an inserted link by its code", async () => {
    const repo = new InMemoryLinkRepository();
    await repo.insert({ code: "abc1234", longUrl: "https://example.com" });

    const found = await repo.findByCode("abc1234");

    expect(found.longUrl).toBe("https://example.com");
  });

  it("returns null when the code does not exist", async () => {
    const repo = new InMemoryLinkRepository();

    expect(await repo.findByCode("missing")).toBeNull();
  });

  it("rejects a duplicate code", async () => {
    const repo = new InMemoryLinkRepository();
    await repo.insert({ code: "abc1234", longUrl: "https://a.com" });

    await expect(
      repo.insert({ code: "abc1234", longUrl: "https://b.com" }),
    ).rejects.toThrow(CodeAlreadyExistsError);
  });

  it("does not let callers change stored data through a returned object", async () => {
    const repo = new InMemoryLinkRepository();
    const link = await repo.insert({ code: "abc1234", longUrl: "https://example.com" });

    link.longUrl = "https://evil.com";

    const found = await repo.findByCode("abc1234");
    expect(found.longUrl).toBe("https://example.com");
  });
});