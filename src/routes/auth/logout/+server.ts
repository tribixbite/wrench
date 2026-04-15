import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';

/**
 * POST /auth/logout — invalidates the current session.
 * Must be POST (not GET) so SvelteKit's CSRF origin-check applies,
 * preventing CSRF-based forced logout via <img> or link tags.
 */
export const POST: RequestHandler = async ({ locals, cookies }) => {
  if (locals.session) {
    await lucia.invalidateSession(locals.session.id);
    const blankCookie = lucia.createBlankSessionCookie();
    cookies.set(blankCookie.name, blankCookie.value, { path: '/', ...blankCookie.attributes });
  }
  throw redirect(302, '/');
};
