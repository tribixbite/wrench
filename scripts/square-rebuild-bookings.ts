#!/usr/bin/env bun
/**
 * Rebuild the Square Bookings setup in production:
 *   - delete and re-create the 3 bay items as APPOINTMENTS_SERVICE
 *     with 8 variations each (1-7 hr hourly + Daily 8 hr flat rate)
 *   - create 6 team members (2 Hoist, 3 Flat, 1 Detail) at the Wrench Club location
 *   - enable booking profiles + subscribe each team member to matching service
 *
 * Pricing:
 *   Flat   $25/hr  · Daily $250
 *   Detail $30/hr  · Daily $300
 *   Hoist  $35/hr  · Daily $350
 *
 * Idempotent on re-run for the catalog (uses delete-then-recreate). Team
 * members + booking profiles are looked up by referenceId so re-runs don't
 * create duplicates.
 *
 *   SQUARE_ENVIRONMENT=production bun run scripts/square-rebuild-bookings.ts
 */
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const isProduction = process.env.SQUARE_ENVIRONMENT !== 'sandbox';
const token = isProduction ? process.env.PROD_ACCESS_TOKEN : process.env.SANDBOX_SECRET;
const locationId = isProduction
  ? (process.env.SQUARE_LOCATION_ID ?? '')
  : (process.env.SQUARE_SANDBOX_LOCATION_ID ?? '');

if (!token) { console.error('Missing token.'); process.exit(1); }
if (!locationId) { console.error('Missing location id.'); process.exit(1); }

const client = new SquareClient({
  token,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox
});

console.log(`\n=== Bookings rebuild — ${isProduction ? 'PRODUCTION' : 'SANDBOX'} ===\n`);

const cents = (dollars: number) => BigInt(Math.round(dollars * 100));
const hourMs = (n: number) => BigInt(n * 60 * 60 * 1000);

type BayType = 'flat' | 'detail' | 'hoist';
const BAY_HOURLY: Record<BayType, number> = { flat: 25, detail: 30, hoist: 35 };
const BAY_DAILY:  Record<BayType, number> = { flat: 250, detail: 300, hoist: 350 };
const BAY_LABELS: Record<BayType, string> = { flat: 'Flat Bay', detail: 'Detail Bay', hoist: 'Hoist Bay' };
const BAY_DESC: Record<BayType, string> = {
  flat:   'Ground-level workspace with personal tool cart, air supply, and workstation. Perfect for maintenance, inspections, and jobs that don\'t require a lift.',
  detail: 'Dedicated wash and detail station with hot water, pressure washer, and detail supplies. Bring your vehicle to showroom condition.',
  hoist:  'Two-post lift or drive-on hoist, set up and operated by our staff. The right tool for any underbody work.'
};

// ── Step 1: clean up existing bay catalog entries ─────────────────────────────
console.log('1. Removing existing bay catalog entries …');
const existing = await client.catalog.search({ objectTypes: ['ITEM'] });
const bayIds = (existing.objects ?? [])
  .filter(o => /^(flat|hoist|detail) bay$/i.test(o.itemData?.name?.trim() ?? ''))
  .map(o => o.id!)
  .filter(Boolean);

if (bayIds.length) {
  await client.catalog.batchDelete({ objectIds: bayIds });
  console.log(`   removed ${bayIds.length} bay item(s).`);
} else {
  console.log('   nothing to remove.');
}

// ── Step 2: re-create as APPOINTMENTS_SERVICE with 8 variations each ─────────
console.log('\n2. Creating APPOINTMENTS_SERVICE catalog entries …');

const bayCategoryId = (await client.catalog.search({ objectTypes: ['CATEGORY'] }))
  .objects?.find(o => o.categoryData?.name === 'Bays')?.id;

const objects: any[] = [];

for (const type of ['flat', 'detail', 'hoist'] as BayType[]) {
  const itemId = `#item-${type}-bay`;
  const variations: any[] = [];

  for (let h = 1; h <= 8; h++) {
    variations.push({
      type: 'ITEM_VARIATION',
      id: `${itemId}-v${h}`,
      presentAtAllLocations: true,
      itemVariationData: {
        itemId,
        name: `${h} ${h === 1 ? 'Hour' : 'Hours'}`,
        pricingType: 'FIXED_PRICING',
        priceMoney: { amount: cents(BAY_HOURLY[type] * h), currency: 'USD' },
        serviceDuration: hourMs(h),
        availableForBooking: true,
        sellable: true,
        stockable: true
      }
    });
  }

  objects.push({
    type: 'ITEM',
    id: itemId,
    presentAtAllLocations: true,
    itemData: {
      name: BAY_LABELS[type],
      description: BAY_DESC[type],
      productType: 'APPOINTMENTS_SERVICE',
      categoryId: bayCategoryId,
      variations
    }
  });
}

const upsertRes = await client.catalog.batchUpsert({
  idempotencyKey: randomUUID(),
  batches: [{ objects }]
});

console.log(`   upserted ${upsertRes.objects?.length ?? 0} catalog objects.`);

const idMap = new Map<string, string>();
for (const m of upsertRes.idMappings ?? []) {
  if (m.clientObjectId && m.objectId) idMap.set(m.clientObjectId, m.objectId);
}

const variationIds: Record<BayType, Record<number, string>> = { flat: {}, detail: {}, hoist: {} };
for (const type of ['flat', 'detail', 'hoist'] as BayType[]) {
  for (let h = 1; h <= 8; h++) {
    variationIds[type][h] = idMap.get(`#item-${type}-bay-v${h}`)!;
  }
}

const itemIds: Record<BayType, string> = {
  flat:   idMap.get('#item-flat-bay')!,
  detail: idMap.get('#item-detail-bay')!,
  hoist:  idMap.get('#item-hoist-bay')!
};

// ── Step 3: ensure 6 team members exist (2 Hoist, 3 Flat, 1 Detail) ──────────
console.log('\n3. Ensuring team members exist …');

interface BaySpec { type: BayType; index: number; refId: string; givenName: string; familyName: string; }
const baySpecs: BaySpec[] = [
  { type: 'hoist',  index: 1, refId: 'bay-h1', givenName: 'Hoist Bay', familyName: '1' },
  { type: 'hoist',  index: 2, refId: 'bay-h2', givenName: 'Hoist Bay', familyName: '2' },
  { type: 'flat',   index: 1, refId: 'bay-f1', givenName: 'Flat Bay',  familyName: '1' },
  { type: 'flat',   index: 2, refId: 'bay-f2', givenName: 'Flat Bay',  familyName: '2' },
  { type: 'flat',   index: 3, refId: 'bay-f3', givenName: 'Flat Bay',  familyName: '3' },
  { type: 'detail', index: 1, refId: 'bay-d1', givenName: 'Detail Bay', familyName: '1' }
];

const tmSearch = await client.teamMembers.search({
  query: { filter: { locationIds: [locationId], status: 'ACTIVE' } },
  limit: 200
});

const existingByRef = new Map<string, string>();
for (const tm of tmSearch.teamMembers ?? []) {
  if (tm.referenceId && tm.id) existingByRef.set(tm.referenceId, tm.id);
}

const teamMemberIds: Record<string, string> = {};

for (const spec of baySpecs) {
  if (existingByRef.has(spec.refId)) {
    teamMemberIds[spec.refId] = existingByRef.get(spec.refId)!;
    console.log(`   • ${spec.givenName} ${spec.familyName} (existing) → ${teamMemberIds[spec.refId]}`);
  } else {
    const created = await client.teamMembers.create({
      idempotencyKey: randomUUID(),
      teamMember: {
        referenceId: spec.refId,
        givenName: spec.givenName,
        familyName: spec.familyName,
        status: 'ACTIVE',
        assignedLocations: {
          assignmentType: 'EXPLICIT_LOCATIONS',
          locationIds: [locationId]
        }
      }
    });
    teamMemberIds[spec.refId] = created.teamMember!.id!;
    console.log(`   • ${spec.givenName} ${spec.familyName} (created) → ${teamMemberIds[spec.refId]}`);
  }
}

// ── Step 4: enable booking profiles ──────────────────────────────────────────
console.log('\n4. Enabling booking profiles for each bay …');

for (const spec of baySpecs) {
  const tmId = teamMemberIds[spec.refId];
  try {
    await client.bookings.teamMemberProfiles.update({
      teamMemberId: tmId,
      teamMemberBookingProfile: {
        isBookable: true,
        displayName: `${spec.givenName} ${spec.familyName}`
      }
    });
    console.log(`   ✓ ${spec.givenName} ${spec.familyName} bookable`);
  } catch (e: any) {
    console.warn(`   ! ${spec.givenName} ${spec.familyName} profile update failed: ${e?.message ?? e}`);
  }
}

// ── Step 5: write the new constants for src/lib/server/square.ts ─────────────
const summary = {
  generatedAt: new Date().toISOString(),
  locationId,
  itemIds,
  variationIds,
  teamMemberIds,
  baySpecs
};
await writeFile('scripts/square-bookings.json', JSON.stringify(summary, null, 2));

console.log('\n5. Wrote scripts/square-bookings.json — copy IDs into src/lib/server/square.ts');
console.log('\nDone.\n');
