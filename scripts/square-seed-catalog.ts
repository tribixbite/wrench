#!/usr/bin/env bun
/**
 * Seed the production Square catalog with the items shown on the live site.
 *
 * Categories: Bays, Storage, Membership, Merch, Gift Cards
 *
 * Pricing comes from the public Squarespace site + handoff.txt:
 *   Membership: $9.95/mo + $9.95 activation
 *   Flat Bay:   $25/hr · $250/day
 *   Hoist Bay:  $35/hr · $350/day
 *   Detail Bay: contact (variable)
 *   Storage:    contact (variable)
 *
 * Idempotent: re-running upserts the same items by stable client IDs (#prefix),
 * so duplicates are not created and price edits are applied.
 *
 * Usage:
 *   SQUARE_ENVIRONMENT=production bun run scripts/square-seed-catalog.ts
 *   SQUARE_ENVIRONMENT=production bun run scripts/square-seed-catalog.ts --dry
 */
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'node:crypto';

const isProduction = process.env.SQUARE_ENVIRONMENT !== 'sandbox';
const dryRun = process.argv.includes('--dry');

const token = isProduction
  ? (process.env.PROD_ACCESS_TOKEN ?? '')
  : (process.env.SANDBOX_SECRET ?? '');

if (!token) {
  console.error('Missing token. Need PROD_ACCESS_TOKEN (prod) or SANDBOX_SECRET (sandbox).');
  process.exit(1);
}

const client = new SquareClient({
  token,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox
});

console.log(`\n=== Square catalog seeder — ${isProduction ? 'PRODUCTION' : 'SANDBOX'}${dryRun ? ' (DRY RUN)' : ''} ===\n`);

const cents = (dollars: number) => BigInt(Math.round(dollars * 100));

// Helper to build an item with one or more variations
type VarSpec = { name: string; priceDollars?: number; pricingType?: 'FIXED_PRICING' | 'VARIABLE_PRICING'; trackInventory?: boolean };
type ItemSpec = { id: string; name: string; description: string; category?: string; variations: VarSpec[] };

const categories = [
  { id: '#cat-bays',       name: 'Bays' },
  { id: '#cat-storage',    name: 'Storage' },
  { id: '#cat-membership', name: 'Membership' },
  { id: '#cat-merch',      name: 'Merch' },
  { id: '#cat-giftcards',  name: 'Gift Cards & Bay Credits' }
];

const items: ItemSpec[] = [
  // ── Bays ──────────────────────────────────────────────────────────────────
  {
    id: '#item-flat-bay',
    name: 'Flat Bay',
    description: 'Ground-level workspace with personal tool cart, air supply, and workstation. Perfect for maintenance, inspections, and jobs that don\'t require a lift.',
    category: '#cat-bays',
    variations: [
      { name: 'Hourly',  priceDollars: 25 },
      { name: 'Daily (8 hrs)', priceDollars: 250 }
    ]
  },
  {
    id: '#item-hoist-bay',
    name: 'Hoist Bay',
    description: 'Two-post lift or drive-on hoist, set up and operated by our staff. The right tool for any underbody work.',
    category: '#cat-bays',
    variations: [
      { name: 'Hourly',  priceDollars: 35 },
      { name: 'Daily (8 hrs)', priceDollars: 350 }
    ]
  },
  {
    id: '#item-detail-bay',
    name: 'Detail Bay',
    description: 'Dedicated wash and detail station with hot water, pressure washer, and detail supplies. Bring your vehicle to showroom condition.',
    category: '#cat-bays',
    variations: [
      { name: 'Hourly', pricingType: 'VARIABLE_PRICING' }
    ]
  },

  // ── Storage ───────────────────────────────────────────────────────────────
  {
    id: '#item-vehicle-storage',
    name: 'Flat Bay Vehicle Storage',
    description: 'Indoor flat-bay storage for project cars, seasonal drivers, or trailer queens. Contact for monthly rates.',
    category: '#cat-storage',
    variations: [
      { name: 'Monthly', pricingType: 'VARIABLE_PRICING' }
    ]
  },
  {
    id: '#item-wheel-storage',
    name: 'Wheel & Tire Storage',
    description: 'Climate-controlled wheel and tire storage for your seasonal swap-overs. Mounted or unmounted. Contact for rates.',
    category: '#cat-storage',
    variations: [
      { name: 'Per Set / Season', pricingType: 'VARIABLE_PRICING' }
    ]
  },

  // ── Membership ────────────────────────────────────────────────────────────
  {
    id: '#item-membership',
    name: 'Wrench Club Membership',
    description: 'Monthly membership — facility access, clubhouse, scheduling system, tool library, member events, and racing-sim access. Bay time billed separately.',
    category: '#cat-membership',
    variations: [
      { name: 'Monthly', priceDollars: 9.95 }
    ]
  },
  {
    id: '#item-activation',
    name: 'Membership Activation Fee',
    description: 'One-time activation fee for new members — covers safety orientation and account setup.',
    category: '#cat-membership',
    variations: [
      { name: 'One-time', priceDollars: 9.95 }
    ]
  },

  // ── Merch ─────────────────────────────────────────────────────────────────
  {
    id: '#item-tee',
    name: 'Wrench Club Tee',
    description: 'Heavyweight cotton tee. Logo front chest, "522" on sleeve.',
    category: '#cat-merch',
    variations: [
      { name: 'Small',  priceDollars: 28, trackInventory: true },
      { name: 'Medium', priceDollars: 28, trackInventory: true },
      { name: 'Large',  priceDollars: 28, trackInventory: true },
      { name: 'XL',     priceDollars: 28, trackInventory: true },
      { name: '2XL',    priceDollars: 30, trackInventory: true }
    ]
  },
  {
    id: '#item-snapback',
    name: 'Flat-Brim Snapback',
    description: 'Structured 6-panel hat with embroidered logo. Adjustable back, pink accent stripe on the brim.',
    category: '#cat-merch',
    variations: [
      { name: 'One Size', priceDollars: 32, trackInventory: true }
    ]
  },

  // ── Gift Cards / Bay Credits ──────────────────────────────────────────────
  {
    id: '#item-bay-credit',
    name: 'Bay Credit Gift Card',
    description: 'Bay-time credit redeemable for any bay type. Never expires. Pick a denomination or contact us for custom amounts.',
    category: '#cat-giftcards',
    variations: [
      { name: '$25',  priceDollars: 25 },
      { name: '$50',  priceDollars: 50 },
      { name: '$100', priceDollars: 100 },
      { name: 'Custom', pricingType: 'VARIABLE_PRICING' }
    ]
  }
];

const objects: any[] = [];

for (const c of categories) {
  objects.push({
    type: 'CATEGORY',
    id: c.id,
    presentAtAllLocations: true,
    categoryData: { name: c.name }
  });
}

for (const it of items) {
  objects.push({
    type: 'ITEM',
    id: it.id,
    presentAtAllLocations: true,
    itemData: {
      name: it.name,
      description: it.description,
      categoryId: it.category,
      variations: it.variations.map((v, idx) => {
        const variationData: any = {
          itemId: it.id,
          name: v.name,
          pricingType: v.pricingType ?? 'FIXED_PRICING',
          trackInventory: v.trackInventory ?? false
        };
        if (v.priceDollars !== undefined) {
          variationData.priceMoney = { amount: cents(v.priceDollars), currency: 'USD' };
        }
        return {
          type: 'ITEM_VARIATION',
          id: `${it.id}-v${idx}`,
          presentAtAllLocations: true,
          itemVariationData: variationData
        };
      })
    }
  });
}

console.log(`Prepared ${categories.length} categories and ${items.length} items (${objects.reduce((n, o) => n + (o.itemData?.variations?.length ?? 0), 0)} variations).\n`);

if (dryRun) {
  console.log(JSON.stringify(objects, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  console.log('\n(dry run — no changes pushed)');
  process.exit(0);
}

try {
  const result = await client.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [{ objects }]
  });

  console.log(`Upserted ${result.objects?.length ?? 0} objects.`);
  console.log(`Updated at: ${result.updatedAt}\n`);

  // Show ID mapping for items so they can be referenced later
  const mapping = result.idMappings ?? [];
  for (const m of mapping) {
    if (m.clientObjectId?.startsWith('#item-') || m.clientObjectId?.startsWith('#cat-')) {
      console.log(`  ${m.clientObjectId}  →  ${m.objectId}`);
    }
  }
} catch (e: any) {
  console.error('\nUpsert failed:', e?.message ?? e);
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2));
  process.exit(1);
}

console.log('\nDone.\n');
