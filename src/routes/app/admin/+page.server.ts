import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { waitlist, users } from '$lib/server/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/auth/login');
  if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

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
