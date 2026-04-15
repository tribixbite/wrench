/**
 * Seed Square sandbox catalog with Wrench Club bay types + membership plan.
 * Run once: bun run sq-probe.ts
 */
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';

const sq = new SquareClient({
  token: process.env.SANDBOX_SECRET!,
  environment: SquareEnvironment.Sandbox
});

const LOC = process.env.SQUARE_SANDBOX_LOCATION_ID ?? 'L2S663GS8ZPMG';

console.log('Seeding Wrench Club catalog in sandbox...\n');

// Bay types — Items with variations (hourly/daily rates)
// Prices are placeholders; will be updated when Coleman confirms rates
const bayItems = [
  {
    name: 'Flat Bay',
    description: 'Ground-level workspace with tool cart, air supply, and workstation.',
    variations: [
      { name: 'Hourly', priceCents: 1500 },  // $15/hr placeholder
      { name: 'Daily (8hrs)', priceCents: 8500 }, // $85/day placeholder
    ]
  },
  {
    name: 'Hoist Bay',
    description: 'Employee-operated 2-post or drive-on lift with full tool access.',
    variations: [
      { name: 'Hourly', priceCents: 2500 },  // $25/hr placeholder
      { name: 'Daily (8hrs)', priceCents: 14000 }, // $140/day placeholder
    ]
  },
  {
    name: 'Detail Bay',
    description: 'Dedicated wash and detail station with hot/cold water, pressure washer, supplies.',
    variations: [
      { name: 'Hourly', priceCents: 1200 },  // $12/hr placeholder
      { name: '3-Hour Block', priceCents: 3000 }, // $30/3hr placeholder
    ]
  },
  {
    name: 'Monthly Membership',
    description: 'Wrench Club membership — facility access, clubhouse, tool library, priority booking, events.',
    variations: [
      { name: 'Standard', priceCents: 9900 }, // $99/mo placeholder
    ]
  },
  {
    name: 'Gift Card — Bay Credit',
    description: 'Bay time credit — usable for any bay type, never expires.',
    variations: [
      { name: '$25', priceCents: 2500 },
      { name: '$50', priceCents: 5000 },
      { name: '$100', priceCents: 10000 },
    ]
  }
];

const objects = bayItems.map(item => ({
  type: 'ITEM' as const,
  id: `#${item.name.replace(/\s+/g, '_').toUpperCase()}`,
  itemData: {
    name: item.name,
    description: item.description,
    locationIds: [LOC],
    isTaxable: false,
    variations: item.variations.map(v => ({
      type: 'ITEM_VARIATION' as const,
      id: `#${item.name.replace(/\s+/g, '_').toUpperCase()}_${v.name.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`,
      itemVariationData: {
        name: v.name,
        pricingType: 'FIXED_PRICING' as const,
        priceMoney: { amount: BigInt(v.priceCents), currency: 'USD' as const }
      }
    }))
  }
}));

try {
  const result = await sq.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [{ objects }]
  });
  console.log('✓ Created catalog objects:');
  (result.objects ?? []).forEach(o => console.log(`  ${o.type}: ${o.id} — ${(o as any).itemData?.name ?? ''}`));
  console.log('\nNote: These are placeholder prices. Update in Square Dashboard when Coleman confirms rates.');
} catch (e: any) {
  console.log('Error:', JSON.stringify(e, null, 2).slice(0, 500));
}
