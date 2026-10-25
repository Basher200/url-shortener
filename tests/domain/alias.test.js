import { describe, it, expect } from "vitest";
import { validateAlias } from "../../src/domain/validation.js";
import { InvalidAliasError } from "../../src/domain/errors.js";

describe("validateAlias", () => {
  it("accepts valid aliases", () => {
    expect(validateAlias("my-cv")).toBe("my-cv");
    expect(validateAlias("Link2026")).toBe("Link2026");
  });

  it("rejects an alias that is too short", () => {
    expect(() => validateAlias("ab")).toThrow(InvalidAliasError);
  });

  it("rejects an alias that is too long", () => {
    expect(() => validateAlias("a".repeat(31))).toThrow(InvalidAliasError);
  });

  it("rejects an alias containing a space", () => {
    expect(() => validateAlias("my cv")).toThrow(InvalidAliasError);
  });

  it("rejects an alias containing an underscore", () => {
    expect(() => validateAlias("my_cv")).toThrow(InvalidAliasError);
  });

  it("rejects a reserved alias", () => {
    expect(() => validateAlias("api")).toThrow(InvalidAliasError);
  });

  it("rejects a reserved alias written in a different case", () => {
    expect(() => validateAlias("Health")).toThrow(InvalidAliasError);
  });
});