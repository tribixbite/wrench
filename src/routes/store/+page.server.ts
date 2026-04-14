import type { PageServerLoad } from './$types';
import { square } from '$lib/server/square';

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  variations: Array<{
    id: string;
    name: string;
    priceCents: number;
    currency: string;
  }>;
}

export const load: PageServerLoad = async () => {
  try {
    // catalog.list() omits items in sandbox; catalog.search() is reliable
    const result = await square.catalog.search({ objectTypes: ['ITEM'] });
    const items: CatalogItem[] = (result.objects ?? [])
      .filter(o => o.type === 'ITEM')
      .map(o => ({
        id: o.id ?? '',
        name: o.itemData?.name ?? '',
        description: o.itemData?.description ?? '',
        variations: (o.itemData?.variations ?? []).map((v: any) => ({
          id: v.id ?? '',
          name: v.itemVariationData?.name ?? '',
          priceCents: Number(v.itemVariationData?.priceMoney?.amount ?? 0),
          currency: String(v.itemVariationData?.priceMoney?.currency ?? 'USD')
        }))
      }));

    // Separate merch from bay/membership items
    const merch = items.filter(i =>
      i.name.toLowerCase().includes('shirt') ||
      i.name.toLowerCase().includes('hat') ||
      i.name.toLowerCase().includes('tee') ||
      i.name.toLowerCase().includes('gift')
    );

    const bays = items.filter(i =>
      i.name.toLowerCase().includes('bay') ||
      i.name.toLowerCase().includes('membership')
    );

    return { merch, bays, allItems: items };
  } catch (err) {
    console.error('Square catalog error:', err);
    return { merch: [], bays: [], allItems: [] };
  }
};
