#!/usr/bin/env bun
/**
 * Imports waitlist signups from a CSV piped on stdin.
 *
 * Local:   bun run scripts/waitlist-import.ts < signups.csv
 * Railway: cat signups.csv | railway ssh -s wrench-club -e production "bun run scripts/waitlist-import.ts"
 *
 * Accepted CSV shapes (header row required):
 *   - "Email,Created On"           (legacy export, dates like "July 23, 2025 at 1:43:22 PM EDT")
 *   - "email,created_at_epoch,..." (output of waitlist-export.ts)
 *   - "email,name,created_at_epoch,..."
 *   - any header containing 'email' as the first column
 *
 * Behavior:
 *   - Dedupes on email (case-insensitive). Existing rows are left untouched —
 *     no overwrite, no email send, no created_at clobbering.
 *   - Preserves the source's `created_at` when it's parseable; otherwise
 *     falls back to `unixepoch()` at import time so the row still exists.
 *   - Uses INSERT OR IGNORE so concurrent imports don't fight.
 *
 * Reports `{ inserted, skipped, parseFailed }` on stderr; the script always
 * exits 0 unless the DB connection itself fails.
 */
import { createClient } from '@libsql/client';
import { nanoid } from 'nanoid';

const dbUrl = process.env.DATABASE_URL ?? 'file:./wrench.db';
const client = createClient({
  url: dbUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

/** Parse a single CSV line, honoring quoted fields containing commas. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++; // skip the escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Parse a date that may be epoch seconds, ISO 8601, or the legacy
 * "Month D, YYYY at H:MM:SS PM TZ" format. Returns epoch seconds, or null
 * when nothing recognisable is present.
 */
function parseFlexibleDate(input: string | undefined | null): number | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  // All-digits → assume epoch seconds
  if (/^\d{9,11}$/.test(s)) return Number(s);

  // Strip the legacy " at " separator so Date can chew it
  const cleaned = s.replace(' at ', ' ');
  const ms = Date.parse(cleaned);
  if (Number.isFinite(ms)) return Math.floor(ms / 1000);

  return null;
}

// ── Read CSV from stdin ──────────────────────────────────────────────────
const text = await new Response(Bun.stdin.stream()).text();
const allLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

if (allLines.length < 2) {
  console.error('[waitlist-import] no data rows found on stdin.');
  process.exit(1);
}

const headers = parseCsvLine(allLines[0]).map((h) => h.trim().toLowerCase());
const emailIdx = headers.findIndex((h) => h === 'email');
if (emailIdx === -1) {
  console.error(`[waitlist-import] header row missing an "email" column. Got: ${headers.join(', ')}`);
  process.exit(1);
}
const nameIdx = headers.findIndex((h) => h === 'name');
const dateIdx = headers.findIndex((h) =>
  ['created_at_epoch', 'created_at', 'created on'].includes(h)
);

let inserted = 0;
let skipped = 0;
let parseFailed = 0;

for (const line of allLines.slice(1)) {
  const cols = parseCsvLine(line);
  const rawEmail = cols[emailIdx]?.trim().toLowerCase();
  if (!rawEmail || !rawEmail.includes('@')) {
    parseFailed++;
    continue;
  }
  const name = nameIdx >= 0 ? (cols[nameIdx]?.trim() || null) : null;
  const epoch = dateIdx >= 0 ? parseFlexibleDate(cols[dateIdx]) : null;

  // INSERT OR IGNORE on the unique email constraint — the row stays
  // untouched if it already exists, no exception thrown.
  const before = (
    await client.execute({
      sql: 'SELECT COUNT(*) AS c FROM waitlist WHERE email = ?',
      args: [rawEmail]
    })
  ).rows[0]?.c as number | undefined;

  if ((before ?? 0) > 0) {
    skipped++;
    continue;
  }

  await client.execute({
    sql:
      epoch !== null
        ? 'INSERT OR IGNORE INTO waitlist (id, email, name, created_at) VALUES (?, ?, ?, ?)'
        : 'INSERT OR IGNORE INTO waitlist (id, email, name) VALUES (?, ?, ?)',
    args:
      epoch !== null
        ? [nanoid(), rawEmail, name, epoch]
        : [nanoid(), rawEmail, name]
  });
  inserted++;
}

console.error(
  `[waitlist-import] inserted=${inserted}, skipped=${skipped} (already on list), parseFailed=${parseFailed}`
);
