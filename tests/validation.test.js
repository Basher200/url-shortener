import { describe, it, expect } from "vitest";
import { validateLongUrl } from "../src/domain/validation.js";
import { InvalidUrlError } from "../src/domain/errors.js";

describe("validateLongUrl", () => {
  it("accepts a valid https URL", () => {
    expect(validateLongUrl("https://example.com/page?id=1")).toBe(
      "https://example.com/page?id=1",
    );
  });

  it("accepts a valid http URL", () => {
    expect(validateLongUrl("http://example.com")).toBe("http://example.com");
  });

  it("removes surrounding spaces", () => {
    expect(validateLongUrl("  https://example.com  ")).toBe("https://example.com");
  });

  it("rejects an empty string", () => {
    expect(() => validateLongUrl("")).toThrow(InvalidUrlError);
  });

  it("rejects text that is not a URL", () => {
    expect(() => validateLongUrl("hello world")).toThrow(InvalidUrlError);
  });

  it("rejects javascript: URLs", () => {
    expect(() => validateLongUrl("javascript:alert(1)")).toThrow(InvalidUrlError);
  });

  it("rejects ftp: URLs", () => {
    expect(() => validateLongUrl("ftp://example.com")).toThrow(InvalidUrlError);
  });

  it("rejects URLs longer than 2048 characters", () => {
    const longUrl = "https://example.com/" + "a".repeat(2100);
    expect(() => validateLongUrl(longUrl)).toThrow(InvalidUrlError);
  });
});