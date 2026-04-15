import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { waitlist, users } from '$lib/server/schema';
import { desc } from 'drizzle-orm';

// Auth + role guard applied by +layout.server.ts
export const load: PageServerLoad = async ({ locals }) => {

  const [waitlistEntries, allUsers] = await Promise.all([
    db.select().from(waitlist).orderBy(desc(waitlist.createdAt)),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.createdAt))
  ]);

  return { waitlistEntries, allUsers };
};
