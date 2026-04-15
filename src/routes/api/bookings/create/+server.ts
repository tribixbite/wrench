import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square, LOCATION_ID, BAY_TEAM_MEMBERS, BAY_VARIATIONS } from '$lib/server/square';
import { nanoid } from 'nanoid';

/**
 * POST /api/bookings/create
 * Body: { bayNumber: 1-5, variationKey: "min90"|"hr3", startAt: ISO string, note?: string }
 * Returns: { bookingId: string }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');

  const body = await request.json();
  const bayNumber = Number(body.bayNumber);
  const variationKey = body.variationKey as keyof typeof BAY_VARIATIONS;
  const startAt = body.startAt as string;
  const note = body.note as string | undefined;

  if (!BAY_TEAM_MEMBERS[bayNumber]) throw error(400, 'Invalid bay number');
  if (!BAY_VARIATIONS[variationKey]) throw error(400, 'Invalid variation');
  if (!startAt) throw error(400, 'Missing startAt');

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
    const msg = err instanceof Error ? err.message : 'Square API error';
    console.error('[bookings/create]', msg);
    throw error(502, msg);
  }
};
