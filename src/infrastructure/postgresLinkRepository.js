import { CodeAlreadyExistsError } from "../domain/errors.js";

const UNIQUE_VIOLATION = "23505";

function toLink(row) {
  return {
    id: BigInt(row.id),
    code: row.code,
    longUrl: row.long_url,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export class PostgresLinkRepository {
  #pool;

  constructor(pool) {
    this.#pool = pool;
  }

  async insert({ code, longUrl, expiresAt = null }) {
    try {
      const { rows } = await this.#pool.query(
        `INSERT INTO links (code, long_url, expires_at)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [code, longUrl, expiresAt],
      );
      return toLink(rows[0]);
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        throw new CodeAlreadyExistsError(code);
      }
      throw err;
    }
  }

  async findByCode(code) {
    const { rows } = await this.#pool.query(
      `SELECT * FROM links WHERE code = $1`,
      [code],
    );
    return rows.length > 0 ? toLink(rows[0]) : null;
  }
}