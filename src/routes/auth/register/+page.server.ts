import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users, emailVerificationTokens } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { nanoid } from 'nanoid';
import { sendEmailVerification, sendRegistrationWelcome } from '$lib/server/email';
import { isAllowedEmail, ALLOWLIST_DENY_MSG } from '$lib/server/auth-allowlist';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(302, '/app/dashboard');
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString().trim() ?? '';
    const email = data.get('email')?.toString().trim().toLowerCase() ?? '';
    const password = data.get('password')?.toString() ?? '';
    const waiver = data.get('waiver') === 'on';

    if (!name || !email || !password) {
      return fail(400, { error: 'All fields are required.', fields: { name, email } });
    }

    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters.', fields: { name, email } });
    }

    if (!waiver) {
      return fail(400, { error: 'You must accept the facility waiver to continue.', fields: { name, email } });
    }

    // Pre-launch gate — refuse registrations not on the allowlist.
    if (!isAllowedEmail(email)) {
      return fail(403, { error: ALLOWLIST_DENY_MSG, fields: { name, email } });
    }

    // Check for existing user — do NOT return 409 (reveals email existence).
    // Instead redirect silently and send a "you already have an account" email.
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      // Non-blocking — send "you already have an account" email to the registered address
      sendRegistrationWelcome({ to: email, name: existing.name }).catch(() => {});
      // Redirect to login without revealing whether the email already existed
      throw redirect(302, '/auth/login');
    }

    const passwordHash = await new Argon2id().hash(password);
    const userId = nanoid();

    // Create Square Customer first so we can store their ID
    let squareCustomerId: string | null = null;
    try {
      const { createSquareCustomer } = await import('$lib/server/square');
      const nameParts = name.trim().split(' ');
      const sqCustomer = await createSquareCustomer({
        email,
        givenName: nameParts[0],
        familyName: nameParts.slice(1).join(' ') || undefined
      });
      squareCustomerId = sqCustomer?.id ?? null;
    } catch (sqErr) {
      // Non-fatal: log but don't block registration
      console.error('Square customer creation failed:', sqErr);
    }

    await db.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
      role: 'member',
      squareCustomerId
    });

    const session = await lucia.createSession(userId, {});
    const cookie = lucia.createSessionCookie(session.id);
    cookies.set(cookie.name, cookie.value, { path: '/', ...cookie.attributes });

    // Generate email verification token (24 h expiry)
    const verifyToken = nanoid(32);
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    await db.insert(emailVerificationTokens).values({
      id: nanoid(),
      userId,
      token: verifyToken,
      expiresAt
    });

    // Non-blocking verification email
    const origin = privateEnv.ORIGIN ?? publicEnv.PUBLIC_SITE_URL ?? 'http://localhost:5173';
    sendEmailVerification({
      to: email,
      name,
      verifyUrl: `${origin}/auth/verify/${verifyToken}`
    }).catch((err) => console.error('[register] verification email error:', err));

    throw redirect(302, '/app/dashboard');
  }
};
