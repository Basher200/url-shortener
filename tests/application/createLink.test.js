import { describe, it, expect } from "vitest";
import { makeCreateLink } from "../../src/application/createLink.js";
import { InMemoryLinkRepository } from "../../src/infrastructure/inMemoryLinkRepository.js";
import {
  AliasTakenError,
  CodeGenerationError,
  InvalidAliasError,
  InvalidExpiryError,
  InvalidUrlError,
} from "../../src/domain/errors.js";

const fixedNow = new Date("2026-10-18T12:00:00Z");

function setup(codeGenerator) {
  const linkRepository = new InMemoryLinkRepository();
  const createLink = makeCreateLink({
    linkRepository,
    codeGenerator,
    now: () => fixedNow,
  });
  return { linkRepository, createLink };
}

describe("createLink", () => {
  it("creates a link with a generated code", async () => {
    const { linkRepository, createLink } = setup();

    const link = await createLink({ longUrl: "https://example.com" });

    expect(link.code).toHaveLength(7);
    expect(link.longUrl).toBe("https://example.com");
    expect(await linkRepository.findByCode(link.code)).not.toBeNull();
  });

  it("uses the custom alias as the code", async () => {
    const { createLink } = setup();

    const link = await createLink({ longUrl: "https://example.com", alias: "my-cv" });

    expect(link.code).toBe("my-cv");
  });

  it("stores the expiry date", async () => {
    const { createLink } = setup();
    const expiresAt = new Date("2026-12-01T00:00:00Z");

    const link = await createLink({ longUrl: "https://example.com", expiresAt });

    expect(link.expiresAt).toEqual(expiresAt);
  });

  it("rejects an invalid URL", async () => {
    const { createLink } = setup();

    await expect(createLink({ longUrl: "not a url" })).rejects.toThrow(InvalidUrlError);
  });

  it("rejects an invalid alias", async () => {
    const { createLink } = setup();

    await expect(
      createLink({ longUrl: "https://example.com", alias: "api" }),
    ).rejects.toThrow(InvalidAliasError);
  });

  it("rejects an expiry date in the past", async () => {
    const { createLink } = setup();

    await expect(
      createLink({
        longUrl: "https://example.com",
        expiresAt: new Date("2026-01-01T00:00:00Z"),
      }),
    ).rejects.toThrow(InvalidExpiryError);
  });

  it("rejects an alias that is already taken", async () => {
    const { createLink } = setup();
    await createLink({ longUrl: "https://a.com", alias: "my-cv" });

    await expect(
      createLink({ longUrl: "https://b.com", alias: "my-cv" }),
    ).rejects.toThrow(AliasTakenError);
  });

  it("retries with a new code when the generated code already exists", async () => {
    const codes = ["taken01", "fresh02"];
    let i = 0;
    const { linkRepository, createLink } = setup(() => codes[i++]);
    await linkRepository.insert({ code: "taken01", longUrl: "https://old.com" });

    const link = await createLink({ longUrl: "https://example.com" });

    expect(link.code).toBe("fresh02");
  });

  it("gives up after too many collisions", async () => {
    const { linkRepository, createLink } = setup(() => "taken01");
    await linkRepository.insert({ code: "taken01", longUrl: "https://old.com" });

    await expect(createLink({ longUrl: "https://example.com" })).rejects.toThrow(
      CodeGenerationError,
    );
  });
});