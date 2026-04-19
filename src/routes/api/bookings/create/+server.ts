import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square, LOCATION_ID, BAYS, BAY_VARIATIONS, BAY_HOURLY_RATE, BAY_TYPE_LABEL } from '$lib/server/square';
import { nanoid } from 'nanoid';
import { BookingCreateBody } from '$lib/schemas/api';

/**
 * POST /api/bookings/create — book a bay AND charge for it atomically.
 *
 * Body: {
 *   bayNumber, bayType, hours: 1-8, startAt: ISO,
 *   sourceId,          // card_on_file id OR a card nonce from Web Payments SDK
 *   saveCard?,         // when true and sourceId is a nonce, save it for next time
 *   note?
 * }
 * Returns: { bookingId, orderId, paymentId, amountCents, savedCardId? }
 *
 * Flow (all-or-nothing):
 *   1. Validate inputs + bay/service config
 *   2. Pre-check availability (Square's create-booking has no conflict detection)
 *   3. Create Order with the service variation as a line item
 *   4. (optional) save the card if requested
 *   5. Capture Payment for the order amount
 *   6. Create Booking with the same start_at + variation
 *   7. Tag the booking note with order/payment IDs so the cancel flow can refund
 *
 * If 5 fails: order auto-expires, no booking, useful error returned.
 * If 6 fails after 5 succeeds: refund the payment, return error to user.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');
  if (!locals.user.squareCustomerId) {
    throw error(400, 'No Square customer ID on file — contact support so we can link your account');
  }

  let body: unknown;
  try { body = await request.json(); } catch { throw error(400, 'Invalid request body'); }
  const parsed = BookingCreateBody.safeParse(body);
  if (!parsed.success) throw error(400, parsed.error.issues[0].message);
  const { bayNumber, bayType, hours, startAt, sourceId, saveCard, note } = parsed.data;

  const bay = BAYS.find(b => b.id === bayNumber && b.type === bayType);
  if (!bay) throw error(400, `${BAY_TYPE_LABEL[bayType] ?? 'Bay'} ${bayNumber} doesn't exist — pick from the list`);

  const serviceVariationId = BAY_VARIATIONS[bayType][hours];
  if (!serviceVariationId) throw error(400, `Can't book ${hours}h on a ${BAY_TYPE_LABEL[bayType]} — pick 1-8 hours`);

  const startMs = Date.parse(startAt);
  if (Number.isNaN(startMs)) throw error(400, 'Booking time is not a valid date');
  if (startMs < Date.now() - 60_000) throw error(400, 'Booking time is in the past');

  const expectedCents = BAY_HOURLY_RATE[bayType] * hours * 100;
  const customerId = locals.user.squareCustomerId;

  // 2. Availability pre-check
  const dateOnly = startAt.slice(0, 10);
  try {
    const avail = await square.bookings.searchAvailability({
      query: { filter: {
        startAtRange: { startAt: `${dateOnly}T00:00:00Z`, endAt: `${dateOnly}T23:59:59Z` },
        locationId: LOCATION_ID,
        segmentFilters: [{ serviceVariationId, teamMemberIdFilter: { any: [bay.teamMemberId] } }]
      }}
    });
    if (!(avail.availabilities ?? []).some(a => a.startAt === startAt)) {
      throw error(409, `${bay.label} is no longer free at that time. Please pick another slot.`);
    }
  } catch (err) {
    if ((err as any)?.status === 409) throw err;
    console.error('[bookings/create] availability pre-check failed:', err instanceof Error ? err.message : err);
    throw error(502, 'Couldn\'t verify slot availability — please try again');
  }

  // 3. Create the order
  let orderId: string;
  try {
    const order = await square.orders.create({
      idempotencyKey: nanoid(),
      order: {
        locationId: LOCATION_ID,
        customerId,
        lineItems: [{
          quantity: '1',
          catalogObjectId: serviceVariationId,
          note: `${BAY_TYPE_LABEL[bayType]} ${bay.id} — ${hours}h @ ${startAt}`
        }],
        state: 'OPEN'
      }
    });
    if (!order.order?.id) throw new Error('Square returned no order ID');
    orderId = order.order.id;
  } catch (err) {
    console.error('[bookings/create] order create failed:', err instanceof Error ? err.message : err);
    throw error(502, 'Couldn\'t set up payment — please try again');
  }

  // 4. (optional) save the card on the customer
  let savedCardId: string | undefined;
  let chargeSourceId = sourceId;
  if (saveCard && sourceId.startsWith('cnon:')) {
    try {
      const saved = await square.cards.create({
        idempotencyKey: nanoid(),
        sourceId,
        card: { customerId }
      });
      if (saved.card?.id) {
        savedCardId = saved.card.id;
        chargeSourceId = saved.card.id; // charge the saved card so we don't burn the nonce
      }
    } catch (err) {
      console.error('[bookings/create] save card failed (continuing with nonce):', err instanceof Error ? err.message : err);
    }
  }

  // 5. Capture payment
  let paymentId: string;
  try {
    const pay = await square.payments.create({
      idempotencyKey: nanoid(),
      sourceId: chargeSourceId,
      amountMoney: { amount: BigInt(expectedCents), currency: 'USD' },
      orderId,
      customerId,
      locationId: LOCATION_ID,
      autocomplete: true
    });
    const status = pay.payment?.status;
    if (status !== 'COMPLETED' && status !== 'APPROVED') {
      throw new Error(`Payment status was ${status ?? 'unknown'}`);
    }
    if (!pay.payment?.id) throw new Error('Square returned no payment ID');
    paymentId = pay.payment.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[bookings/create] payment failed:', msg);
    if (/declined|insufficient|expired|cvv/i.test(msg)) {
      throw error(402, 'Card was declined — try another card or check the details');
    }
    throw error(502, 'Payment didn\'t go through — please try again');
  }

  // 6. Create the booking
  let bookingId: string;
  try {
    const booking = await square.bookings.create({
      idempotencyKey: nanoid(),
      booking: {
        locationId: LOCATION_ID,
        customerId,
        // Tag with order+payment IDs so cancel/refund can find them
        customerNote: `[order:${orderId}|payment:${paymentId}] ${note ?? `${BAY_TYPE_LABEL[bayType]} ${bay.id} — ${hours}h`}`,
        startAt,
        appointmentSegments: [{
          serviceVariationId,
          teamMemberId: bay.teamMemberId,
          serviceVariationVersion: BigInt(0)
        }]
      }
    });
    if (!booking.booking?.id) throw new Error('Square returned no booking ID');
    bookingId = booking.booking.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[bookings/create] booking create failed AFTER payment, refunding:', msg);
    // Refund the payment we just took
    try {
      await square.refunds.refundPayment({
        idempotencyKey: nanoid(),
        paymentId,
        amountMoney: { amount: BigInt(expectedCents), currency: 'USD' },
        reason: 'Booking creation failed after payment — auto-refund'
      });
    } catch (refundErr) {
      console.error('[bookings/create] AUTO-REFUND ALSO FAILED — manual intervention needed:', refundErr);
      throw error(500, 'Booking failed and refund also failed. Please contact support immediately — payment ID: ' + paymentId);
    }
    if (/conflict|overlap|unavailable/i.test(msg)) {
      throw error(409, `${bay.label} just got booked by someone else — your card was refunded. Pick another slot.`);
    }
    throw error(502, 'Booking didn\'t go through — your card has been refunded. Please try again.');
  }

  return json({ bookingId, orderId, paymentId, amountCents: expectedCents, savedCardId });
};
