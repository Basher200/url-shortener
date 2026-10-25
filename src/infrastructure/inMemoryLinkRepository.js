import { CodeAlreadyExistsError } from "../domain/errors.js";

export class InMemoryLinkRepository {
  #links = new Map();
  #nextId = 1n;

  async insert({ code, longUrl, expiresAt = null }) {
    if (this.#links.has(code)) {
      throw new CodeAlreadyExistsError(code);
    }

    const link = {
      id: this.#nextId++,
      code,
      longUrl,
      isActive: true,
      expiresAt,
      createdAt: new Date(),
    };

    this.#links.set(code, link);
    return { ...link };
  }

  async findByCode(code) {
    const link = this.#links.get(code);
    return link ? { ...link } : null;
  }
}