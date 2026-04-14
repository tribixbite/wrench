import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { sessions, users } from './schema';
import { dev } from '$app/environment';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

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
