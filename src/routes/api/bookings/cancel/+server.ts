import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { square } from '$lib/server/square';
import { BookingCancelBody } from '$lib/schemas/api';

/**
 * POST /api/bookings/cancel
 * Body: { bookingId }
 * Returns: { bookingId, refundedCents? }
 *
 * Policy: free cancel up to 24 hours before the booking start_at; inside the
 * 24h window we refuse with HTTP 422 so the member knows it's a policy block,
 * not a technical error. If the booking has an attached order with a captured
 * payment, we issue an automatic full refund on cancel.
 *
 * Security: we re-fetch the booking from Square and verify customer_id
 * matches the current user's squareCustomerId — preventing one member from
 * cancelling another member's appointment by guessing the booking ID.
 */
const CANCEL_CUTOFF_MS = 24 * 60 * 60 * 1000;

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');
  if (!locals.user.squareCustomerId) {
    throw error(400, 'No Square customer ID on file — contact support');
  }

  let body: unknown;
  try { body = await request.json(); } catch { throw error(400, 'Invalid request body'); }

  const parsed = BookingCancelBody.safeParse(body);
  if (!parsed.success) throw error(400, parsed.error.issues[0].message);
  const { bookingId } = parsed.data;

  // Re-fetch the booking — never trust the client to tell us about its own state
  let booking: Awaited<ReturnType<typeof square.bookings.get>>['booking'];
  try {
    const got = await square.bookings.get({ bookingId });
    booking = got.booking;
  } catch (err) {
    console.error('[bookings/cancel] get failed:', err instanceof Error ? err.message : err);
    throw error(404, 'Booking not found');
  }
  if (!booking) throw error(404, 'Booking not found');

  // Ownership check
  if (booking.customerId !== locals.user.squareCustomerId) {
    throw error(403, 'You can only cancel your own bookings');
  }

  // Already-cancelled state
  if (
    booking.status === 'CANCELLED_BY_CUSTOMER' ||
    booking.status === 'CANCELLED_BY_SELLER' ||
    booking.status === 'NO_SHOW'
  ) {
    throw error(409, 'Booking is already cancelled');
  }

  // 24-hour policy
  const startMs = Date.parse(booking.startAt ?? '');
  if (Number.isNaN(startMs)) throw error(500, 'Booking has no valid start time');
  const msUntilStart = startMs - Date.now();
  if (msUntilStart < CANCEL_CUTOFF_MS) {
    const hoursOut = Math.max(0, Math.floor(msUntilStart / (60 * 60 * 1000)));
    throw error(
      422,
      `Cancellations require at least 24 hours notice. Your booking starts in ${hoursOut} hour${hoursOut === 1 ? '' : 's'}.`
    );
  }

  // Cancel
  let cancelled;
  try {
    cancelled = await square.bookings.cancel({
      bookingId,
      idempotencyKey: nanoid(),
      bookingVersion: Number(booking.version ?? 0)
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[bookings/cancel] square cancel failed:', msg);
    throw error(502, 'Couldn\'t cancel through Square — please try again in a moment');
  }

  // If the booking note carries our `[order:X|payment:Y]` tag, refund the captured payment
  let refundedCents = 0;
  const tag = (booking.customerNote ?? '').match(/\[order:([^|]+)\|payment:([^\]]+)\]/);
  if (tag) {
    const [, orderId, paymentId] = tag;
    try {
      const order = await square.orders.get({ orderId });
      const total = Number(order.order?.totalMoney?.amount ?? 0);
      const currency = order.order?.totalMoney?.currency ?? 'USD';
      if (total > 0) {
        const refund = await square.refunds.refundPayment({
          idempotencyKey: nanoid(),
          paymentId,
          amountMoney: { amount: BigInt(total), currency },
          reason: 'Member cancelled booking'
        });
        if (refund.refund?.status === 'PENDING' || refund.refund?.status === 'COMPLETED' || refund.refund?.status === 'APPROVED') {
          refundedCents = total;
        } else {
          console.warn('[bookings/cancel] refund status:', refund.refund?.status);
        }
      }
    } catch (e) {
      console.error('[bookings/cancel] refund failed:', e instanceof Error ? e.message : e);
      // Non-fatal — booking is cancelled, refund needs manual follow-up
    }
  }

  // Use cancelled booking version to acknowledge it (silences unused warning)
  void cancelled;

  return json({ bookingId, refundedCents: refundedCents || undefined });
};
