import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square, LOCATION_ID, BAYS, BAY_VARIATIONS, BAY_TYPE_LABEL } from '$lib/server/square';
import { nanoid } from 'nanoid';
import { BookingCreateBody } from '$lib/schemas/api';

/**
 * POST /api/bookings/create
 * Body: { bayNumber, bayType, hours: 1-8, startAt: ISO, note? }
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

  const { bayNumber, bayType, hours, startAt, note } = parsed.data;

  const bay = BAYS.find(b => b.id === bayNumber && b.type === bayType);
  if (!bay) throw error(400, `Bay ${bayNumber} (${bayType}) not configured`);

  const serviceVariationId = BAY_VARIATIONS[bayType][hours];
  if (!serviceVariationId) throw error(400, `No variation for ${bayType} ${hours}h`);

  if (!locals.user.squareCustomerId) {
    throw error(400, 'No Square customer ID on file — contact support');
  }

  try {
    const result = await square.bookings.create({
      idempotencyKey: nanoid(),
      booking: {
        locationId: LOCATION_ID,
        customerId: locals.user.squareCustomerId,
        customerNote: note ?? `${BAY_TYPE_LABEL[bayType]} ${bay.id} — ${hours}h`,
        startAt,
        appointmentSegments: [
          {
            serviceVariationId,
            teamMemberId: bay.teamMemberId,
            serviceVariationVersion: BigInt(0)
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
