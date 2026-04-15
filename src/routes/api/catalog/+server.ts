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
    // Use catalog.list() — confirmed working with sandbox token
    const result = await square.catalog.list({ types: 'ITEM' });

    const items: Array<{
      id: string;
      name: string;
      description: string;
      variations: Array<{
        id: string;
        name: string;
        priceCents: number;
        currency: string;
        pricingType: string;
      }>;
    }> = [];

    // catalog.list() returns an async iterator
    for await (const obj of result) {
      if (obj.type !== 'ITEM') continue;
      items.push({
        id: obj.id,
        name: obj.itemData?.name ?? '',
        description: obj.itemData?.description ?? '',
        variations: (obj.itemData?.variations ?? []).map((v: any) => ({
          id: v.id,
          name: v.itemVariationData?.name ?? '',
          priceCents: Number(v.itemVariationData?.priceMoney?.amount ?? 0),
          currency: v.itemVariationData?.priceMoney?.currency ?? 'USD',
          pricingType: v.itemVariationData?.pricingType ?? 'FIXED_PRICING'
        }))
      });
    }

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
