import type { PageServerLoad } from './$types';
import { listBookingsForCustomer, partitionByTime, totalMinutes } from '$lib/server/bookings';
import { getMembershipStatus, LOCATION_ID } from '$lib/server/square';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  // Check real membership status via Square Subscriptions
  let membershipStatus: 'active' | 'inactive' = 'inactive';
  if (user?.squareCustomerId) {
    membershipStatus = await getMembershipStatus(user.squareCustomerId);
  }

  // Only fetch bookings for active members
  let upcoming: Awaited<ReturnType<typeof listBookingsForCustomer>> = [];
  let pastHoursUsed = 0;
  if (membershipStatus === 'active' && user?.squareCustomerId) {
    try {
      const bookings = await listBookingsForCustomer(user.squareCustomerId);
      const { upcoming: up, past } = partitionByTime(bookings);
      upcoming = up;
      pastHoursUsed = Math.round(totalMinutes(past) / 60);
    } catch (err) {
      console.error('[dashboard load] bookings fetch failed:', err);
    }
  }

  // Return Square Web Payments SDK credentials when membership is inactive
  // so the Buy Membership card form can be shown inline.
  const isProduction = env.SQUARE_ENVIRONMENT !== 'sandbox';
  const squareAppId = isProduction ? (env.PROD_APP_ID ?? '') : (env.SANDBOX_APP_ID ?? '');

  return {
    user,
    upcoming,
    pastHoursUsed,
    membershipStatus,
    square: {
      appId: squareAppId,
      locationId: LOCATION_ID,
      environment: isProduction ? 'production' as const : 'sandbox' as const
    }
  };
};
