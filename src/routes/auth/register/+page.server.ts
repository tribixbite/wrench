import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { nanoid } from 'nanoid';

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

    // Check for existing user
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return fail(409, { error: 'An account with that email already exists.', fields: { name, email } });
    }

    const passwordHash = await new Argon2id().hash(password);
    const userId = nanoid();

    await db.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
      role: 'member'
      // squareCustomerId: set after Square Customer creation in Phase 2
    });

    // TODO: Phase 2 — create Square Customer and store squareCustomerId
    // const sqCustomer = await createSquareCustomer({ email, givenName: name.split(' ')[0] });
    // await db.update(users).set({ squareCustomerId: sqCustomer?.id }).where(eq(users.id, userId));

    const session = await lucia.createSession(userId, {});
    const cookie = lucia.createSessionCookie(session.id);
    cookies.set(cookie.name, cookie.value, { path: '/', ...cookie.attributes });

    throw redirect(302, '/app/dashboard');
  }
};
