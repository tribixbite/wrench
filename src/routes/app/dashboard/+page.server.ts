import type { PageServerLoad } from './$types';
import { listBookingsForCustomer, partitionByTime, totalMinutes } from '$lib/server/bookings';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  const empty = { upcoming: [], pastHoursUsed: 0 };

  if (!user?.squareCustomerId) {
    return { user, ...empty, membershipStatus: 'waitlist' as const };
  }

  try {
    const bookings = await listBookingsForCustomer(user.squareCustomerId);
    const { upcoming, past } = partitionByTime(bookings);
    return {
      user,
      upcoming,
      pastHoursUsed: Math.round(totalMinutes(past) / 60),
      // Membership status comes from Square Subscriptions — not wired yet,
      // so inferring from squareCustomerId presence. Replace when we pull
      // subscription state.
      membershipStatus: 'active' as const
    };
  } catch (err: unknown) {
    console.error('[dashboard load] bookings fetch failed:', err);
    return { user, ...empty, membershipStatus: 'waitlist' as const };
  }
};
