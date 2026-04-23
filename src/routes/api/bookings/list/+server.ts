import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { listBookingsForCustomer } from '$lib/server/bookings';

/**
 * GET /api/bookings/list
 * Returns upcoming bookings for the current user's Square customer ID.
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');
  if (!locals.user.squareCustomerId) return json({ bookings: [] });

  try {
    const bookings = await listBookingsForCustomer(locals.user.squareCustomerId);
    return json({ bookings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Square API error';
    console.error('[bookings/list]', msg);
    // Non-fatal — return empty rather than crashing the page
    return json({ bookings: [], error: msg });
  }
};
