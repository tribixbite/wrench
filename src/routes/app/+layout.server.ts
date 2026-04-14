import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/** Auth guard — all /app/* routes require a valid session */
export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/auth/login');
  return { user: locals.user };
};
