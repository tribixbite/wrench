import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { BAYS, BAY_HOURLY_RATE, BAY_TYPE_LABEL } from '$lib/server/square';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login?next=/app/reservations');

  // Project the bay metadata for the client (omit team-member IDs)
  const bays = BAYS.map(b => ({ id: b.id, type: b.type, label: b.label }));
  return {
    bays,
    hourlyRate: BAY_HOURLY_RATE,
    typeLabel: BAY_TYPE_LABEL
  };
};
