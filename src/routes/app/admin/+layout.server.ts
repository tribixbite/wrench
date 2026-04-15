import type { LayoutServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

/**
 * Centralised admin guard — applies to all routes under /app/admin/.
 * Individual pages do not need to repeat the role check.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/auth/login');
  if (locals.user.role !== 'admin') throw error(403, 'Forbidden');
};
