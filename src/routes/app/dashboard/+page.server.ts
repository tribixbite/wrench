import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // TODO: Phase 2 — fetch from Square Bookings API using locals.user.squareCustomerId
  return {
    user: locals.user,
    upcomingReservations: [],
    membershipStatus: 'waitlist' // waitlist | active | inactive
  };
};
