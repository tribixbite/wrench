import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square, LOCATION_ID, BAY_TEAM_MEMBERS, BAY_VARIATIONS } from '$lib/server/square';

/**
 * POST /api/bookings/availability
 * Body: { bayNumber: 1-5, variationKey: "min90"|"hr3", date: "YYYY-MM-DD" }
 * Returns: { slots: [{ startAt: string, endAt: string }] }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');

  const body = await request.json();
  const bayNumber = Number(body.bayNumber);
  const variationKey = body.variationKey as keyof typeof BAY_VARIATIONS;
  const date = body.date as string; // YYYY-MM-DD

  if (!BAY_TEAM_MEMBERS[bayNumber]) throw error(400, 'Invalid bay number');
  if (!BAY_VARIATIONS[variationKey]) throw error(400, 'Invalid variation');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw error(400, 'Invalid date');

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
    const msg = err instanceof Error ? err.message : 'Square API error';
    console.error('[bookings/availability]', msg);
    throw error(502, msg);
  }
};
