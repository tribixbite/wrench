import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square, LOCATION_ID, BAY_TEAM_MEMBERS, BAY_VARIATIONS } from '$lib/server/square';
import { nanoid } from 'nanoid';
import { BookingCreateBody } from '$lib/schemas/api';

/**
 * POST /api/bookings/create
 * Body: { bayNumber: 1-5, variationKey: "min90"|"hr3", startAt: ISO string, note?: string }
 * Returns: { bookingId: string }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid request body');
  }

  const parsed = BookingCreateBody.safeParse(body);
  if (!parsed.success) throw error(400, parsed.error.issues[0].message);

  const { bayNumber, variationKey, startAt, note } = parsed.data;

  const teamMemberId = BAY_TEAM_MEMBERS[bayNumber];
  const serviceVariationId = BAY_VARIATIONS[variationKey];

  // squareCustomerId is required for creating a booking
  if (!locals.user.squareCustomerId) {
    throw error(400, 'No Square customer ID on file — contact support');
  }

  try {
    const result = await square.bookings.create({
      idempotencyKey: nanoid(),
      booking: {
        locationId: LOCATION_ID,
        customerId: locals.user.squareCustomerId,
        customerNote: note ?? `Bay ${bayNumber} — ${variationKey === 'min90' ? '90 min' : '3 hr'}`,
        startAt,
        appointmentSegments: [
          {
            serviceVariationId,
            teamMemberId,
            serviceVariationVersion: BigInt(0) // Square resolves to latest
          }
        ]
      }
    });

    const bookingId = result.booking?.id;
    if (!bookingId) throw new Error('Square returned no booking ID');

    return json({ bookingId });
  } catch (err: unknown) {
    console.error('[bookings/create]', err instanceof Error ? err.message : err);
    throw error(502, 'Booking service temporarily unavailable');
  }
};
