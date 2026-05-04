#!/usr/bin/env bun
/**
 * Dumps the waitlist table as CSV to stdout.
 *
 * Local:   bun run scripts/waitlist-export.ts
 * Railway: railway ssh -s wrench-club -e production "bun run scripts/waitlist-export.ts" > backup.csv
 *
 * Reads DATABASE_URL from env (defaults to the dev SQLite file). On Railway
 * production this resolves to file:/app/data/wrench.db on the persistent
 * volume. Output format matches /api/waitlist source: email, name,
 * created_at (epoch seconds).
 */
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL ?? 'file:./wrench.db';
const client = createClient({
  url: dbUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

interface WaitlistRow {
  email: string;
  name: string | null;
  created_at: number | null;
}

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const result = await client.execute(
  'SELECT email, name, created_at FROM waitlist ORDER BY created_at ASC'
);

const rows = result.rows as unknown as WaitlistRow[];

// CRLF for Excel-friendly output; matches the format the source CSV came in.
process.stdout.write('email,name,created_at_epoch,created_at_iso\r\n');
for (const r of rows) {
  const iso = r.created_at ? new Date(r.created_at * 1000).toISOString() : '';
  process.stdout.write(
    [csvEscape(r.email), csvEscape(r.name), csvEscape(r.created_at), csvEscape(iso)].join(',') +
      '\r\n'
  );
}

process.stderr.write(`[waitlist-export] ${rows.length} row(s) written.\n`);
