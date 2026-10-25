import { describe, it, expect } from "vitest";
import { validateExpiry } from "../../src/domain/validation.js";
import { InvalidExpiryError } from "../../src/domain/errors.js";

describe("validateExpiry", () => {
  const now = new Date("2026-10-18T12:00:00Z");

  it("accepts a date in the future", () => {
    const future = new Date("2026-12-01T00:00:00Z");
    expect(validateExpiry(future, now)).toBe(future);
  });

  it("rejects a date in the past", () => {
    const past = new Date("2026-01-01T00:00:00Z");
    expect(() => validateExpiry(past, now)).toThrow(InvalidExpiryError);
  });

  it("rejects an invalid date", () => {
    const invalid = new Date("not a date");
    expect(() => validateExpiry(invalid, now)).toThrow(InvalidExpiryError);
  });
});