import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square, LOCATION_ID, BAY_TEAM_MEMBERS, BAY_VARIATIONS } from '$lib/server/square';
import { AvailabilityPostBody } from '$lib/schemas/api';

/**
 * POST /api/bookings/availability
 * Body: { bayNumber: 1-5, variationKey: "min90"|"hr3", date: "YYYY-MM-DD" }
 * Returns: { slots: [{ startAt: string, appointmentSegments: unknown[] }] }
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

  const { bayNumber, variationKey, date } = parsed.data;

  const teamMemberId = BAY_TEAM_MEMBERS[bayNumber];
  const serviceVariationId = BAY_VARIATIONS[variationKey];

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
              teamMemberIdFilter: { any: [teamMemberId] }
            }
          ]
        }
      }
    });

    const slots = (result.availabilities ?? []).map((a) => ({
      startAt: a.startAt,
      appointmentSegments: a.appointmentSegments
    }));

    return json({ slots });
  } catch (err: unknown) {
    console.error('[bookings/availability]', err instanceof Error ? err.message : err);
    throw error(502, 'Availability service temporarily unavailable');
  }
};
