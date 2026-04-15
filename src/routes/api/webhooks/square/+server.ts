import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Square webhook endpoint.
 * Validates Square-Signature header before processing.
 * Handles: payment.completed, subscription.created, booking.created
 */
export const POST: RequestHandler = async ({ request, url }) => {
  const signature = request.headers.get('Square-Signature');
  const body = await request.text();

  // Reject all requests when webhook secret is not configured
  if (!env.SQUARE_WEBHOOK_SECRET) {
    console.warn('[webhooks/square] SQUARE_WEBHOOK_SECRET not set — rejecting all requests');
    return json({ error: 'Webhook not configured' }, { status: 503 });
  }

  // Validate Square HMAC-SHA256 signature
  if (!isValidSquareSignature(body, signature, env.SQUARE_WEBHOOK_SECRET, url.toString())) {
    console.warn('[webhooks/square] Invalid signature');
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
 * Square signs: HMAC-SHA256(secret, notificationUrl + body), base64-encoded.
 * Uses timingSafeEqual to prevent timing attacks.
 * See: https://developer.squareup.com/docs/webhooks/validate-notifications
 */
function isValidSquareSignature(
  body: string,
  signature: string | null,
  secret: string,
  notificationUrl: string
): boolean {
  if (!signature) return false;
  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(notificationUrl + body);
    const expected = hmac.digest('base64');
    // timingSafeEqual requires Uint8Array; use TextEncoder for consistent typing
    const enc = new TextEncoder();
    const expectedBuf = enc.encode(expected);
    const signatureBuf = enc.encode(signature);
    if (expectedBuf.length !== signatureBuf.length) return false;
    return timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}
