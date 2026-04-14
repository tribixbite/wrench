import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const client = createClient({
  url: env.DATABASE_URL ?? 'file:./wrench.db',
  authToken: env.DATABASE_AUTH_TOKEN
});

/** Auto-create tables on first startup (avoids needing drizzle-kit push for dev) */
async function ensureTables() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      square_customer_id TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
}

// Run once on module load — safe to call repeatedly (IF NOT EXISTS)
let _initialized = false;
export async function initDb() {
  if (_initialized) return;
  await ensureTables();
  _initialized = true;
}

export const db = drizzle(client, { schema });
