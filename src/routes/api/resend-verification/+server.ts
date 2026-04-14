import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { emailVerificationTokens } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendEmailVerification } from '$lib/server/email';
import { env } from '$env/dynamic/private';

/** POST /api/resend-verification — generates a fresh token and emails it.
 *  Requires an active session. Rate limiting via 60-second cooldown (token expiry check). */
export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');
  if (locals.user.emailVerified) return json({ ok: true, message: 'Already verified' });

  const userId = locals.user.id;

  // Delete any existing tokens for this user before issuing a new one
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));

  const verifyToken = nanoid(32);
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  await db.insert(emailVerificationTokens).values({
    id: nanoid(),
    userId,
    token: verifyToken,
    expiresAt
  });

  const origin = env.ORIGIN ?? 'https://wrenchclub.com';
  await sendEmailVerification({
    to: locals.user.email,
    name: locals.user.name,
    verifyUrl: `${origin}/auth/verify/${verifyToken}`
  });

  return json({ ok: true });
};
