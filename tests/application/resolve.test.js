import { describe, it, expect } from "vitest";
import { makeResolveLink } from "../../src/application/resolveLink.js";
import { makeCreateLink } from "../../src/application/createLink.js";
import { InMemoryLinkRepository } from "../../src/infrastructure/inMemoryLinkRepository.js";
import { LinkGoneError, LinkNotFoundError } from "../../src/domain/errors.js";

const now = new Date("2026-10-18T12:00:00Z");

function makeLink(overrides = {}) {
  return {
    id: 1n,
    code: "abc1234",
    longUrl: "https://example.com",
    isActive: true,
    expiresAt: null,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    ...overrides,
  };
}

function resolverFor(link) {
  const linkRepository = { findByCode: async () => link };
  return makeResolveLink({ linkRepository, now: () => now });
}

describe("resolveLink", () => {
  it("returns the link when it is active", async () => {
    const resolveLink = resolverFor(makeLink());

    const link = await resolveLink("abc1234");

    expect(link.longUrl).toBe("https://example.com");
  });

  it("returns the link when the expiry is in the future", async () => {
    const resolveLink = resolverFor(
      makeLink({ expiresAt: new Date("2026-11-01T00:00:00Z") }),
    );

    const link = await resolveLink("abc1234");

    expect(link.code).toBe("abc1234");
  });

  it("throws LinkNotFoundError when the code does not exist", async () => {
    const resolveLink = resolverFor(null);

    await expect(resolveLink("missing")).rejects.toThrow(LinkNotFoundError);
  });

  it("throws LinkGoneError with reason 'expired' for an expired link", async () => {
    const resolveLink = resolverFor(
      makeLink({ expiresAt: new Date("2026-10-01T00:00:00Z") }),
    );

    await expect(resolveLink("abc1234")).rejects.toThrow(LinkGoneError);
    await expect(resolveLink("abc1234")).rejects.toMatchObject({ reason: "expired" });
  });

  it("treats a link expiring exactly now as expired", async () => {
    const resolveLink = resolverFor(makeLink({ expiresAt: now }));

    await expect(resolveLink("abc1234")).rejects.toMatchObject({ reason: "expired" });
  });

  it("throws LinkGoneError with reason 'disabled' for a disabled link", async () => {
    const resolveLink = resolverFor(makeLink({ isActive: false }));

    await expect(resolveLink("abc1234")).rejects.toMatchObject({ reason: "disabled" });
  });

  it("resolves a link that was just created (create + resolve together)", async () => {
    const linkRepository = new InMemoryLinkRepository();
    const createLink = makeCreateLink({ linkRepository });
    const resolveLink = makeResolveLink({ linkRepository });

    await createLink({ longUrl: "https://example.com", alias: "my-cv" });
    const link = await resolveLink("my-cv");

    expect(link.longUrl).toBe("https://example.com");
  });
});