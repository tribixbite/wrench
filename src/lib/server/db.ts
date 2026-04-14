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
}

// Run once on module load — safe to call repeatedly (IF NOT EXISTS)
let _initialized = false;
export async function initDb() {
  if (_initialized) return;
  await ensureTables();
  _initialized = true;
}

export const db = drizzle(client, { schema });
