import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users, passwordResetTokens } from '$lib/server/schema';
import { eq, and, gt } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';

export const load: PageServerLoad = async ({ params }) => {
  const now = Math.floor(Date.now() / 1000);

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, params.token),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!row) return { valid: false };
  return { valid: true };
};

export const actions: Actions = {
  default: async ({ params, request }) => {
    const data = await request.formData();
    const password = data.get('password')?.toString() ?? '';
    const confirm = data.get('confirm')?.toString() ?? '';

    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters.' });
    }
    if (password !== confirm) {
      return fail(400, { error: 'Passwords do not match.' });
    }

    const now = Math.floor(Date.now() / 1000);
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, params.token),
          gt(passwordResetTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!row) return fail(400, { error: 'Reset link has expired. Request a new one.' });

    const passwordHash = await new Argon2id().hash(password);

    await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));

    // Invalidate all active sessions so stolen cookies can't be reused
    await lucia.invalidateUserSessions(row.userId);

    throw redirect(302, '/auth/login?reset=1');
  }
};
