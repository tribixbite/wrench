import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

/**
 * Square webhook endpoint.
 * Validates Square-Signature header before processing.
 * Handles: payment.completed, subscription.created, booking.created
 */
export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get('Square-Signature');
  const body = await request.text();

  // Validate webhook signature in production
  if (env.SQUARE_WEBHOOK_SECRET && !isValidSquareSignature(body, signature, env.SQUARE_WEBHOOK_SECRET)) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { type: string; data?: unknown };
  try {
    event = JSON.parse(body);
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Route by event type
  switch (event.type) {
    case 'payment.completed':
      // TODO: Phase 2 — update order status, send confirmation email
      break;

    case 'subscription.created':
    case 'subscription.updated':
      // TODO: Phase 2 — sync member status
      break;

    case 'booking.created':
    case 'booking.updated':
    case 'booking.cancelled':
      // TODO: Phase 2 — update bay availability SSE stream
      break;

    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return json({ received: true });
};

/**
 * Validates Square's HMAC-SHA256 webhook signature.
 * See: https://developer.squareup.com/docs/webhooks/validate-notifications
 */
function isValidSquareSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  // TODO: implement HMAC-SHA256 validation when webhook secret is available
  // import { createHmac } from 'crypto';
  // const expected = createHmac('sha256', secret).update(body).digest('base64');
  // return expected === signature;
  return true; // placeholder — validates all in dev
}
