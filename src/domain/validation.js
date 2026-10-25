import { InvalidAliasError, InvalidExpiryError, InvalidUrlError } from "./errors.js";

const MAX_URL_LENGTH = 2048;
const ALIAS_PATTERN = /^[A-Za-z0-9-]{3,30}$/;
const RESERVED_ALIASES = new Set(["api", "health", "admin", "static", "assets", "docs", "metrics"]);

export function validateLongUrl(input) {
  const url = input.trim();

  if (url.length === 0 || url.length > MAX_URL_LENGTH) {
    throw new InvalidUrlError("URL must be between 1 and 2048 characters.");
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new InvalidUrlError("URL is not valid.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new InvalidUrlError("Only http and https URLs are allowed.");
  }

  return url;
}

export function validateAlias(input) {
  if (!ALIAS_PATTERN.test(input)) {
    throw new InvalidAliasError(
      "Alias must be 3-30 characters: letters, digits, and hyphens only.",
    );
  }

  if (RESERVED_ALIASES.has(input.toLowerCase())) {
    throw new InvalidAliasError(`The alias '${input}' is reserved.`);
  }

  return input;
}

export function validateExpiry(expiresAt, now = new Date()) {
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now) {
    throw new InvalidExpiryError("Expiry date must be a valid date in the future.");
  }

  return expiresAt;
}