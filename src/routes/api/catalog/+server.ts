import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { square } from '$lib/server/square';

/**
 * GET /api/catalog — returns Wrench Club catalog items from Square.
 * Used by the store page and pricing page for live pricing.
 * Cached via Cache-Control for 5 minutes to avoid hammering the API.
 */
export const GET: RequestHandler = async () => {
  try {
    // catalog.list() omits items in sandbox; catalog.search() is reliable
    const result = await square.catalog.search({ objectTypes: ['ITEM'] });
    const items = (result.objects ?? [])
      .filter(o => o.type === 'ITEM')
      .map(o => ({
        id: o.id,
        name: o.itemData?.name ?? '',
        description: o.itemData?.description ?? '',
        variations: (o.itemData?.variations ?? []).map((v: any) => ({
          id: v.id,
          name: v.itemVariationData?.name ?? '',
          priceCents: Number(v.itemVariationData?.priceMoney?.amount ?? 0),
          currency: v.itemVariationData?.priceMoney?.currency ?? 'USD',
          pricingType: v.itemVariationData?.pricingType ?? 'FIXED_PRICING'
        }))
      }));

    return json({ items }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });
  } catch (err) {
    console.error('Square catalog error:', err);
    return json({ items: [], error: 'Catalog unavailable' }, { status: 503 });
  }
};
