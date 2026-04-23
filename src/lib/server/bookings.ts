/**
 * Shared booking-fetch logic used by dashboard server load and
 * /api/bookings/list. Keeping one shape in one place.
 */
import { square, LOCATION_ID } from './square';

export interface MemberBooking {
  id: string;
  version: number;
  status: string | undefined;
  startAt: string | undefined;
  locationId: string | undefined;
  customerId: string | undefined;
  customerNote: string | undefined;
  sellerNote: string | undefined;
  createdAt: string | undefined;
  updatedAt: string | undefined;
  appointmentSegments: Array<{
    teamMemberId: string | undefined;
    durationMinutes: number;
    serviceVariationId: string | undefined;
  }> | undefined;
}

/** Statuses that mean the booking is no longer live — filter these out for member views. */
const INACTIVE_STATUSES = new Set(['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_SELLER', 'NO_SHOW']);

/**
 * Fetch a customer's bookings from Square, filter out cancellations, and
 * normalise the shape (BigInt → number, Booking → plain object).
 */
export async function listBookingsForCustomer(customerId: string): Promise<MemberBooking[]> {
  const page = await square.bookings.list({ customerId, locationId: LOCATION_ID });
  const all = [];
  for await (const booking of page) all.push(booking);

  return all
    .filter((b) => !INACTIVE_STATUSES.has(b.status ?? ''))
    .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? ''))
    .map<MemberBooking>((b) => ({
      id: b.id ?? '',
      version: Number(b.version ?? 0),
      status: b.status ?? undefined,
      startAt: b.startAt ?? undefined,
      locationId: b.locationId ?? undefined,
      customerId: b.customerId ?? undefined,
      customerNote: b.customerNote ?? undefined,
      sellerNote: b.sellerNote ?? undefined,
      createdAt: b.createdAt ?? undefined,
      updatedAt: b.updatedAt ?? undefined,
      appointmentSegments: b.appointmentSegments?.map((s) => ({
        teamMemberId: s.teamMemberId ?? undefined,
        durationMinutes: Number(s.durationMinutes ?? 0),
        serviceVariationId: s.serviceVariationId ?? undefined
      }))
    }));
}

/** Partition a booking list into upcoming (startAt in future) and past. */
export function partitionByTime(bookings: MemberBooking[], now = new Date()): {
  upcoming: MemberBooking[];
  past: MemberBooking[];
} {
  const nowIso = now.toISOString();
  const upcoming: MemberBooking[] = [];
  const past: MemberBooking[] = [];
  for (const b of bookings) {
    if ((b.startAt ?? '') >= nowIso) upcoming.push(b);
    else past.push(b);
  }
  return { upcoming, past };
}

/** Sum the duration (in minutes) across a list of bookings. */
export function totalMinutes(bookings: MemberBooking[]): number {
  let sum = 0;
  for (const b of bookings) {
    for (const s of b.appointmentSegments ?? []) sum += s.durationMinutes;
  }
  return sum;
}
