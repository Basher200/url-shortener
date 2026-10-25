import { describe, it, expect } from "vitest";
import { getLinkStatus } from "../../src/domain/link.js";

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

describe("getLinkStatus", () => {
  it("is active when enabled and has no expiry", () => {
    expect(getLinkStatus(makeLink(), now)).toBe("active");
  });

  it("is active when the expiry is in the future", () => {
    const link = makeLink({ expiresAt: new Date("2026-11-01T00:00:00Z") });
    expect(getLinkStatus(link, now)).toBe("active");
  });

  it("is expired when the expiry has passed", () => {
    const link = makeLink({ expiresAt: new Date("2026-10-01T00:00:00Z") });
    expect(getLinkStatus(link, now)).toBe("expired");
  });

  it("is disabled when deactivated, even if not expired", () => {
    expect(getLinkStatus(makeLink({ isActive: false }), now)).toBe("disabled");
  });
});