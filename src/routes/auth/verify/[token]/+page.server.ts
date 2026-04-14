import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, emailVerificationTokens } from '$lib/server/schema';
import { eq, and, gt } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { token } = params;
  const now = Math.floor(Date.now() / 1000);

  // Find valid, unexpired token
  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        gt(emailVerificationTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!row) {
    // Return error state to page — don't throw (lets user see resend option)
    return { success: false, reason: 'invalid' as const };
  }

  // Mark user as verified
  await db
    .update(users)
    .set({ emailVerified: 1 })
    .where(eq(users.id, row.userId));

  // Delete all tokens for this user (clean up any re-send duplicates)
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, row.userId));

  // If the current session belongs to this user, redirect to dashboard
  if (locals.user?.id === row.userId) {
    throw redirect(302, '/app/dashboard?verified=1');
  }

  return { success: true };
};
