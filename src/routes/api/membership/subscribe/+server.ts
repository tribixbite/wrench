/**
 * POST /api/membership/subscribe
 *
 * Purchases a membership for an already-registered user:
 *   1. Validate session and squareCustomerId
 *   2. Save card on file (from Web Payments SDK nonce)
 *   3. Create $10/month Square subscription
 *
 * On card/subscription failure, any created card is disabled before returning.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { square, LOCATION_ID } from '$lib/server/square';
import { env } from '$env/dynamic/private';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'You must be logged in to purchase a membership.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, { status: 400 });
  }

  const cardNonce = String(body.cardNonce ?? '').trim();
  if (!cardNonce) {
    return json({ error: 'Card information is required.' }, { status: 400 });
  }

  const planVariationId = env.SQUARE_MEMBERSHIP_PLAN_VARIATION_ID;
  if (!planVariationId) {
    console.error('[subscribe] SQUARE_MEMBERSHIP_PLAN_VARIATION_ID not set');
    return json({ error: 'Membership enrollment is temporarily unavailable. Contact info@thewrench.club.' }, { status: 503 });
  }

  // Ensure the user has a Square customer ID (should always be set from registration,
  // but create one on the fly if somehow missing)
  let squareCustomerId = user.squareCustomerId;
  if (!squareCustomerId) {
    try {
      const { db } = await import('$lib/server/db');
      const { users } = await import('$lib/server/schema');
      const { eq } = await import('drizzle-orm');
      const nameParts = user.name.split(' ');
      const { customer } = await square.customers.create({
        emailAddress: user.email,
        givenName: nameParts[0],
        familyName: nameParts.slice(1).join(' ') || undefined,
        referenceId: 'wrench-web'
      });
      if (!customer?.id) throw new Error('No customer ID');
      squareCustomerId = customer.id;
      await db.update(users).set({ squareCustomerId }).where(eq(users.id, user.id));
    } catch (e) {
      console.error('[subscribe] Square customer create failed:', e);
      return json({ error: 'Could not create your customer profile. Please try again.' }, { status: 502 });
    }
  }

  // Step 1: Save card on file
  let cardId: string;
  try {
    const { card } = await square.cards.create({
      idempotencyKey: nanoid(),
      sourceId: cardNonce,
      card: { customerId: squareCustomerId }
    });
    if (!card?.id) throw new Error('No card ID');
    cardId = card.id;
  } catch (e) {
    console.error('[subscribe] Card save failed:', e);
    return json({ error: 'Could not save your card. Please check the details and try again.' }, { status: 400 });
  }

  // Step 2: Create subscription
  try {
    const { subscription } = await square.subscriptions.create({
      idempotencyKey: nanoid(),
      locationId: LOCATION_ID,
      planVariationId,
      customerId: squareCustomerId,
      cardId,
      source: { name: 'Wrench Club Website' }
    });
    if (!subscription?.id) throw new Error('No subscription ID');
  } catch (e: any) {
    console.error('[subscribe] Subscription create failed:', e);
    square.cards.disable({ cardId }).catch(() => {});
    const detail = e?.errors?.[0]?.detail ?? e?.message ?? 'Subscription failed.';
    return json({ error: `Payment failed: ${detail}` }, { status: 402 });
  }

  return json({ ok: true });
};
