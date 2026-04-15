/**
 * Lucia v3 auth setup for the Wrench Club member portal.
 *
 * Auth model:
 * - Sessions stored in Turso (LibSQL) via Drizzle ORM — NOT in Square
 * - Square is the payments/bookings layer; Lucia handles identity
 * - `squareCustomerId` on the user record links to Square Customers API
 * - Cookies use `sameSite: lax` and `secure: true` in production
 */
import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { sessions, users } from './schema';
import { dev } from '$app/environment';

/** Drizzle adapter wires Lucia to the sessions + users tables in LibSQL. */
const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

/**
 * Lucia instance — the single source of truth for session management.
 * Import this in hooks.server.ts and any route that needs auth.
 *
 * @example
 * import { lucia } from '$lib/server/auth';
 * const { user, session } = await lucia.validateSession(sessionId);
 */
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev,
      sameSite: 'lax'
    }
  },
  getUserAttributes(attributes) {
    return {
      email: attributes.email,
      name: attributes.name,
      role: attributes.role,
      squareCustomerId: attributes.squareCustomerId,
      emailVerified: attributes.emailVerified === 1
    };
  }
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string;
      role: 'member' | 'admin' | 'staff';
      squareCustomerId: string | null;
      /** Stored as 0/1 in SQLite */
      emailVerified: number;
    };
  }
}
