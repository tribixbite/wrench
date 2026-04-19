import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square, LOCATION_ID } from '$lib/server/square';

/**
 * GET /api/bookings/list
 * Returns upcoming bookings for the current user's Square customer ID.
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');
  if (!locals.user.squareCustomerId) return json({ bookings: [] });

  try {
    const page = await square.bookings.list({
      customerId: locals.user.squareCustomerId,
      locationId: LOCATION_ID
    });

    // Collect all pages into a flat array
    const allBookings = [];
    for await (const booking of page) {
      allBookings.push(booking);
    }

    const bookings = allBookings
      .filter((b) => b.status !== 'CANCELLED_BY_CUSTOMER' && b.status !== 'CANCELLED_BY_SELLER' && b.status !== 'NO_SHOW')
      .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? ''))
      .map((b) => ({
        id: b.id,
        version: Number(b.version ?? 0),
        status: b.status,
        startAt: b.startAt,
        locationId: b.locationId,
        customerId: b.customerId,
        customerNote: b.customerNote,
        sellerNote: b.sellerNote,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        appointmentSegments: b.appointmentSegments?.map((s) => ({
          teamMemberId: s.teamMemberId,
          durationMinutes: Number(s.durationMinutes ?? 0),
          serviceVariationId: s.serviceVariationId
        }))
      }));

    return json({ bookings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Square API error';
    console.error('[bookings/list]', msg);
    // Non-fatal — return empty rather than crashing the page
    return json({ bookings: [], error: msg });
  }
};
