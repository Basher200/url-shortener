import { LinkGoneError, LinkNotFoundError } from "../domain/errors.js";
import { getLinkStatus } from "../domain/link.js";

export function makeResolveLink({ linkRepository, now = () => new Date() }) {
  return async function resolveLink(code) {
    const link = await linkRepository.findByCode(code);

    if (!link) {
      throw new LinkNotFoundError(code);
    }

    const status = getLinkStatus(link, now());

    if (status !== "active") {
      throw new LinkGoneError(code, status);
    }

    return link;
  };
}