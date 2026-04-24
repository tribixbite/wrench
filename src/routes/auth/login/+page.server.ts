import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { isAllowedEmail, ALLOWLIST_DENY_MSG } from '$lib/server/auth-allowlist';

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect already-logged-in users
  if (locals.user) throw redirect(302, '/app/dashboard');
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase() ?? '';
    const password = data.get('password')?.toString() ?? '';

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required.' });
    }

    // Pre-launch gate — refuse logins not on the allowlist (covers existing
    // accounts seeded for testing too — they get locked out until launch).
    if (!isAllowedEmail(email)) {
      return fail(403, { error: ALLOWLIST_DENY_MSG });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      // Constant-time response to prevent user enumeration
      await new Argon2id().verify('$argon2id$v=19$m=19456,t=2,p=1$placeholder$placeholder', password).catch(() => false);
      return fail(401, { error: 'Incorrect email or password.' });
    }

    const valid = await new Argon2id().verify(user.passwordHash, password).catch(() => false);
    if (!valid) {
      return fail(401, { error: 'Incorrect email or password.' });
    }

    const session = await lucia.createSession(user.id, {});
    const cookie = lucia.createSessionCookie(session.id);
    cookies.set(cookie.name, cookie.value, { path: '/', ...cookie.attributes });

    throw redirect(302, '/app/dashboard');
  }
};
