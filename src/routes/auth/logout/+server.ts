import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals, cookies }) => {
  if (locals.session) {
    await lucia.invalidateSession(locals.session.id);
    const blankCookie = lucia.createBlankSessionCookie();
    cookies.set(blankCookie.name, blankCookie.value, { path: '/', ...blankCookie.attributes });
  }
  throw redirect(302, '/');
};
