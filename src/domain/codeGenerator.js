import { randomInt } from "node:crypto";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const DEFAULT_CODE_LENGTH = 7;

export function generateCode(length = DEFAULT_CODE_LENGTH) {
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError("Code length must be a positive integer.");
  }

  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }

  return code;
}