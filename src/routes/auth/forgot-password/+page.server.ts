import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, passwordResetTokens } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendPasswordReset } from '$lib/server/email';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ locals }) => {
  // Already logged in — nothing to do here, but don't redirect (allow password reset anyway)
  return {};
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase() ?? '';

    if (!email) return fail(400, { error: 'Email is required.', sent: false });

    // Always return success to prevent email enumeration
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user) {
      // Delete any existing reset tokens for this user
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

      const token = nanoid(32);
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

      await db.insert(passwordResetTokens).values({
        id: nanoid(),
        userId: user.id,
        token,
        expiresAt
      });

      const origin = privateEnv.ORIGIN ?? publicEnv.PUBLIC_SITE_URL ?? 'http://localhost:5173';
      sendPasswordReset({
        to: email,
        resetUrl: `${origin}/auth/reset/${token}`
      }).catch((err) => console.error('[forgot-password] email error:', err));
    }

    // Always show success — don't reveal whether email exists
    return { sent: true };
  }
};
