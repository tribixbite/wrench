import type { PageServerLoad } from './$types';
import { square } from '$lib/server/square';
import { HIDE_DETAIL_BAY } from '$lib/features';

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
    const unique = items
      .filter(i => {
        const key = i.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      // Drop Detail Bay items from the public store entirely when zoning is pending.
      // The catalog SKU stays live in Square so dashboard bookings still work.
      .filter(i => !HIDE_DETAIL_BAY || !i.name.toLowerCase().includes('detail'));

    // Bay/membership items — categorised first so gift cards with "bay" in name
    // don't bleed into the merch section. Matches: bay, membership, storage,
    // hoist, flat bay, detail bay — the service-side of the catalog.
    const isBayOrService = (name: string) => {
      const n = name.toLowerCase();
      return (
        n.includes('bay') ||
        n.includes('membership') ||
        n.includes('storage') ||
        n.includes('hoist') ||
        n.includes('detail')
      );
    };

    const bays = unique.filter(i => isBayOrService(i.name));
    const bayIds = new Set(bays.map(i => i.id));

    // Everything else = merch. This lets Coleman add any new SKU in Square
    // (snapback, beanie, keychain, coffee mug, etc.) without code changes.
    const merch = unique.filter(i => !bayIds.has(i.id));

    return { merch, bays, allItems: unique };
  } catch (err) {
    console.error('Square catalog error:', err);
    return { merch: [], bays: [], allItems: [] };
  }
};
