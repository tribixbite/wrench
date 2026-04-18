import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square, LOCATION_ID, BAYS, BAY_VARIATIONS } from '$lib/server/square';
import { AvailabilityPostBody } from '$lib/schemas/api';

/**
 * POST /api/bookings/availability
 * Body: { bayType, hours: 1-8, bayNumber?: 1-6, date: "YYYY-MM-DD" }
 *
 * When bayNumber is omitted, searches every team member of the chosen type.
 * Returns: { slots: [{ startAt, teamMemberId, bayNumber, durationMinutes, serviceVariationId }] }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid request body');
  }

  const parsed = AvailabilityPostBody.safeParse(body);
  if (!parsed.success) throw error(400, parsed.error.issues[0].message);

  const { bayType, hours, bayNumber, date } = parsed.data;

  const serviceVariationId = BAY_VARIATIONS[bayType][hours];
  if (!serviceVariationId) throw error(400, `No variation configured for ${bayType} ${hours}h`);

  // Filter team members to bays of the chosen type (or a single specified bay)
  const candidates = bayNumber
    ? BAYS.filter(b => b.id === bayNumber && b.type === bayType)
    : BAYS.filter(b => b.type === bayType);

  if (!candidates.length) throw error(400, 'No bays match that selection');

  const teamMemberIds = candidates.map(b => b.teamMemberId);

  // Search from 00:00 to 23:59 on the requested date (UTC)
  const startAt = `${date}T00:00:00Z`;
  const endAt = `${date}T23:59:59Z`;

  try {
    const result = await square.bookings.searchAvailability({
      query: {
        filter: {
          startAtRange: { startAt, endAt },
          locationId: LOCATION_ID,
          segmentFilters: [
            {
              serviceVariationId,
              teamMemberIdFilter: { any: teamMemberIds }
            }
          ]
        }
      }
    });

    // Reverse-lookup team member ID → bay number
    const memberToBay = new Map(BAYS.map(b => [b.teamMemberId, b.id]));

    const slots = (result.availabilities ?? []).map(a => {
      const seg = a.appointmentSegments?.[0];
      const tmId = seg?.teamMemberId ?? '';
      return {
        startAt: a.startAt,
        teamMemberId: tmId,
        bayNumber: memberToBay.get(tmId) ?? 0,
        durationMinutes: Number(seg?.durationMinutes ?? 0),
        serviceVariationId: seg?.serviceVariationId ?? ''
      };
    });

    return json({ slots });
  } catch (err: unknown) {
    console.error('[bookings/availability]', err instanceof Error ? err.message : err);
    throw error(502, 'Availability service temporarily unavailable');
  }
};
