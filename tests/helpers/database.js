import pg from "pg";

export const TEST_DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://shortener:shortener@localhost:5433/shortener";

export function createTestPool() {
  return new pg.Pool({ connectionString: TEST_DATABASE_URL });
}