import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { square } from '$lib/server/square';

/**
 * GET /api/payments/cards
 * Returns the saved card brands/last4 for the current user's Square customer.
 * Used by the booking-payment flow to render a "Pay with saved card" picker
 * before falling back to entering a new card via the Web Payments SDK.
 *
 * Response: { cards: [{ id, brand, last4, expMonth, expYear, cardholderName }] }
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Not authenticated');
  if (!locals.user.squareCustomerId) return json({ cards: [] });

  try {
    // Square Cards API list returns ENABLED cards by default.
    const result = await square.cards.list({
      customerId: locals.user.squareCustomerId,
      includeDisabled: false
    });

    const cards = [];
    for await (const c of result) {
      if (!c.enabled) continue;
      cards.push({
        id: c.id ?? '',
        brand: c.cardBrand ?? 'OTHER',
        last4: c.last4 ?? '',
        expMonth: Number(c.expMonth ?? 0),
        expYear: Number(c.expYear ?? 0),
        cardholderName: c.cardholderName ?? ''
      });
    }
    return json({ cards });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Square cards list failed';
    console.error('[payments/cards]', msg);
    return json({ cards: [], error: msg });
  }
};
