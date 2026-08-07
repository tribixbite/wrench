import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, vehicles } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Argon2id } from 'oslo/password';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  const userVehicles = user
    ? await db.select().from(vehicles).where(eq(vehicles.userId, user.id))
    : [];
  return { user, vehicles: userVehicles };
};

export const actions: Actions = {
  addVehicle: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });
    const data = await request.formData();
    const year  = data.get('year')?.toString().trim() ?? '';
    const make  = data.get('make')?.toString().trim() ?? '';
    const model = data.get('model')?.toString().trim() ?? '';

    if (!year || !make || !model) {
      return fail(400, { error: 'Year, make, and model are required.' });
    }
    if (!/^\d{4}$/.test(year) || +year < 1900 || +year > new Date().getFullYear() + 1) {
      return fail(400, { error: 'Enter a valid 4-digit year.' });
    }

    await db.insert(vehicles).values({ id: nanoid(), userId: locals.user.id, year, make, model });
    return { success: true };
  },

  updateName: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { nameError: 'Not authenticated' });
    const data = await request.formData();
    const firstName = data.get('firstName')?.toString().trim() ?? '';
    const lastName  = data.get('lastName')?.toString().trim() ?? '';
    if (!firstName || !lastName) return fail(400, { nameError: 'First and last name are required.' });

    const name = `${firstName} ${lastName}`;
    await db.update(users).set({ name }).where(eq(users.id, locals.user.id));

    if (locals.user.squareCustomerId) {
      const { updateSquareCustomer } = await import('$lib/server/square');
      updateSquareCustomer(locals.user.squareCustomerId, { givenName: firstName, familyName: lastName }).catch(() => {});
    }

    return { nameSuccess: true };
  },

  updateEmail: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { emailError: 'Not authenticated' });
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase() ?? '';
    if (!email) return fail(400, { emailError: 'Email is required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, { emailError: 'Enter a valid email address.' });

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing && existing.id !== locals.user.id) return fail(400, { emailError: 'That email is already in use.' });

    await db.update(users).set({ email }).where(eq(users.id, locals.user.id));

    if (locals.user.squareCustomerId) {
      const { updateSquareCustomer } = await import('$lib/server/square');
      updateSquareCustomer(locals.user.squareCustomerId, { email }).catch(() => {});
    }

    return { emailSuccess: true };
  },

  updatePassword: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { passwordError: 'Not authenticated' });
    const data = await request.formData();
    const current    = data.get('currentPassword')?.toString() ?? '';
    const newPass    = data.get('newPassword')?.toString() ?? '';
    const confirmPass = data.get('confirmPassword')?.toString() ?? '';

    if (!current || !newPass || !confirmPass) return fail(400, { passwordError: 'All password fields are required.' });
    if (newPass.length < 8) return fail(400, { passwordError: 'New password must be at least 8 characters.' });
    if (newPass !== confirmPass) return fail(400, { passwordError: 'New passwords do not match.' });

    const [user] = await db.select().from(users).where(eq(users.id, locals.user.id)).limit(1);
    const valid = await new Argon2id().verify(user.passwordHash, current).catch(() => false);
    if (!valid) return fail(400, { passwordError: 'Current password is incorrect.' });

    const passwordHash = await new Argon2id().hash(newPass);
    await db.update(users).set({ passwordHash }).where(eq(users.id, locals.user.id));

    return { passwordSuccess: true };
  },

  deleteVehicle: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });
    const data = await request.formData();
    const id = data.get('id')?.toString() ?? '';
    if (!id) return fail(400, { error: 'Missing vehicle ID' });

    await db.delete(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, locals.user.id)));
    return { success: true };
  }
};
