import { generateCode } from "../domain/codeGenerator.js";
import {
  AliasTakenError,
  CodeAlreadyExistsError,
  CodeGenerationError,
} from "../domain/errors.js";
import { validateAlias, validateExpiry, validateLongUrl } from "../domain/validation.js";

const MAX_ATTEMPTS = 5;

export function makeCreateLink({
  linkRepository,
  codeGenerator = generateCode,
  now = () => new Date(),
}) {
  return async function createLink({ longUrl, alias, expiresAt }) {
    const cleanUrl = validateLongUrl(longUrl);
    const cleanExpiry = expiresAt == null ? null : validateExpiry(expiresAt, now());

    if (alias != null) {
      const cleanAlias = validateAlias(alias);

      try {
        return await linkRepository.insert({
          code: cleanAlias,
          longUrl: cleanUrl,
          expiresAt: cleanExpiry,
        });
      } catch (err) {
        if (err instanceof CodeAlreadyExistsError) {
          throw new AliasTakenError(cleanAlias);
        }
        throw err;
      }
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await linkRepository.insert({
          code: codeGenerator(),
          longUrl: cleanUrl,
          expiresAt: cleanExpiry,
        });
      } catch (err) {
        if (!(err instanceof CodeAlreadyExistsError)) {
          throw err;
        }
      }
    }

    throw new CodeGenerationError();
  };
}