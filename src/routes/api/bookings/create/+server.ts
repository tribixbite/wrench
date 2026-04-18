import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square, LOCATION_ID, BAYS, BAY_VARIATIONS, BAY_TYPE_LABEL } from '$lib/server/square';
import { nanoid } from 'nanoid';
import { BookingCreateBody } from '$lib/schemas/api';

/**
 * POST /api/bookings/create
 * Body: { bayNumber, bayType, hours: 1-8, startAt: ISO, note? }
 * Returns: { bookingId: string }
 *
 * Square's create-booking endpoint does NOT enforce conflict detection — two
 * concurrent calls for the same team-member + start-time both succeed and
 * create overlapping appointments. We pre-check searchAvailability here so
 * the common case (member clicking a slot another member just took) returns
 * a clean 409 instead of silently double-booking. There's still a tiny race
 * window between the search and the create; we accept that — Square's
 * customer-facing tools (Dashboard, Square Online) have the same gap.
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
  if (!bay) throw error(400, `${BAY_TYPE_LABEL[bayType] ?? 'Bay'} ${bayNumber} doesn't exist — pick from the list`);

  const serviceVariationId = BAY_VARIATIONS[bayType][hours];
  if (!serviceVariationId) throw error(400, `Can't book ${hours}h on a ${BAY_TYPE_LABEL[bayType]} — pick 1-8 hours`);

  if (!locals.user.squareCustomerId) {
    throw error(400, 'No Square customer ID on file — contact support so we can link your account');
  }

  // Reject obviously bad timestamps (Square will too, but the message is unhelpful)
  const startMs = Date.parse(startAt);
  if (Number.isNaN(startMs)) throw error(400, 'Booking time is not a valid date');
  if (startMs < Date.now() - 60_000) throw error(400, 'Booking time is in the past');

  // Pre-check: is the slot still on offer?
  const dateOnly = startAt.slice(0, 10);
  let stillAvailable = false;
  try {
    const avail = await square.bookings.searchAvailability({
      query: {
        filter: {
          startAtRange: { startAt: `${dateOnly}T00:00:00Z`, endAt: `${dateOnly}T23:59:59Z` },
          locationId: LOCATION_ID,
          segmentFilters: [{
            serviceVariationId,
            teamMemberIdFilter: { any: [bay.teamMemberId] }
          }]
        }
      }
    });
    stillAvailable = (avail.availabilities ?? []).some(a => a.startAt === startAt);
  } catch (err) {
    console.error('[bookings/create] availability pre-check failed:', err instanceof Error ? err.message : err);
    throw error(502, 'Couldn\'t verify slot availability — please try again');
  }
  if (!stillAvailable) {
    throw error(409, `${bay.label} is no longer free at that time. Please pick another slot.`);
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[bookings/create]', msg);
    // Surface Square's hint when it's a conflict we missed in the pre-check
    if (/conflict|overlap|unavailable/i.test(msg)) {
      throw error(409, `${bay.label} just got booked by someone else — pick another slot.`);
    }
    throw error(502, 'Booking service temporarily unavailable — please try again in a moment');
  }
};
