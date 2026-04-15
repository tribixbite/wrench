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

    // Deduplicate by name — Square sandbox often contains duplicate entries
    const seen = new Set<string>();
    const unique = items.filter(i => {
      const key = i.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Bay/membership items — categorised first so gift cards with "bay" in name
    // don't bleed into the merch section
    const bays = unique.filter(i => {
      const n = i.name.toLowerCase();
      return n.includes('bay') || n.includes('membership');
    });

    const bayIds = new Set(bays.map(i => i.id));

    // Merch = clothing/accessories that are NOT already in the bays list
    const merch = unique.filter(i => {
      if (bayIds.has(i.id)) return false;
      const n = i.name.toLowerCase();
      return n.includes('shirt') || n.includes('hat') || n.includes('tee') || n.includes('gift');
    });

    return { merch, bays, allItems: unique };
  } catch (err) {
    console.error('Square catalog error:', err);
    return { merch: [], bays: [], allItems: [] };
  }
};
