/**
 * Database connection for the Wrench Club app.
 *
 * Architecture notes:
 * - The DB is intentionally thin — it stores auth sessions and waitlist only.
 * - All business data (members as customers, bookings, subscriptions, orders,
 *   catalog items) lives in Square and is queried via the Square APIs.
 * - In production (Railway) the database file lives on a persistent volume at
 *   /app/data/wrench.db (DATABASE_URL=file:/app/data/wrench.db).
 * - In dev, defaults to file:./wrench.db in the project root.
 * - Parent directory is created automatically on startup to handle Railway's
 *   volume mount path.
 */
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema';

const dbUrl = env.DATABASE_URL ?? 'file:./wrench.db';

// Ensure parent directory exists for file-based SQLite (e.g. /app/data/wrench.db on Railway)
if (dbUrl.startsWith('file:')) {
  const filePath = dbUrl.replace(/^file:/, '');
  if (filePath && !filePath.startsWith(':')) {
    try {
      mkdirSync(dirname(filePath), { recursive: true });
    } catch {
      // Non-fatal: directory may already exist or be read-only
    }
  }
}

const client = createClient({
  url: dbUrl,
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
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  // Backfill: add email_verified to existing databases that pre-date this column
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`);
  } catch {
    // Column already exists — safe to ignore
  }
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
  await client.execute(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL
    )
  `);
}

// Run once on module load — safe to call repeatedly (IF NOT EXISTS)
let _initialized = false;

/**
 * Ensures all required tables exist, creating them if absent.
 * Call this before the first database operation in hooks.server.ts or
 * any server-side entry point. Idempotent — uses IF NOT EXISTS everywhere.
 *
 * Tables managed: users, sessions, waitlist,
 * email_verification_tokens, password_reset_tokens.
 */
export async function initDb() {
  if (_initialized) return;
  await ensureTables();
  _initialized = true;
}

/**
 * Drizzle ORM database client — server-only.
 * Never import this in client-side code or Svelte components without `.server.ts` guards.
 *
 * @example
 * import { db } from '$lib/server/db';
 * const rows = await db.select().from(waitlist).all();
 */
export const db = drizzle(client, { schema });
