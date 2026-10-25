import { describe, it, expect } from "vitest";
import { generateCode, DEFAULT_CODE_LENGTH } from "../../src/domain/codeGenerator.js";

describe("generateCode", () => {
  it("returns a code of the default length", () => {
    expect(generateCode()).toHaveLength(DEFAULT_CODE_LENGTH);
  });

  it("returns a code of a custom length", () => {
    expect(generateCode(10)).toHaveLength(10);
  });

  it("uses only letters and digits", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateCode()).toMatch(/^[A-Za-z0-9]+$/);
    }
  });

  it("generates different codes each time", () => {
    const codes = new Set();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateCode());
    }
    expect(codes.size).toBe(1000);
  });

  it("rejects an invalid length", () => {
    expect(() => generateCode(0)).toThrow(RangeError);
    expect(() => generateCode(-3)).toThrow(RangeError);
    expect(() => generateCode(2.5)).toThrow(RangeError);
  });
});