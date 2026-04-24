#!/usr/bin/env bun
/**
 * One-time sandbox bookings setup — mirrors prod structure against the 5
 * pre-existing sandbox team members (which already have "Bookable online"
 * enabled, so we don't need to recreate them).
 *
 * Maps the 5 existing sandbox TMs to a 5-bay config (2 hoist + 2 flat + 1
 * detail) instead of prod's 6-bay layout, so staging tests still exercise
 * all three bay types.
 *
 * Does NOT touch service permissions — Square only lets you set per-TM
 * "services this person can perform" via the Dashboard. Run this script,
 * then open https://app.squareupsandbox.com/dashboard/team and restrict
 * each bay to its matching service item (Flat bays → Flat Bay, etc.).
 *
 *   SQUARE_ENVIRONMENT=sandbox \
 *   SANDBOX_SECRET=... \
 *   SQUARE_SANDBOX_LOCATION_ID=L2S663GS8ZPMG \
 *   bun run scripts/square-setup-sandbox-bookings.ts
 */
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

if (process.env.SQUARE_ENVIRONMENT !== 'sandbox') {
  console.error('This script is sandbox-only. Set SQUARE_ENVIRONMENT=sandbox.');
  process.exit(1);
}

const token = process.env.SANDBOX_SECRET ?? process.env.SQUARE_ACCESS_TOKEN;
const locationId =
  process.env.SQUARE_SANDBOX_LOCATION_ID ?? process.env.SQUARE_LOCATION_ID ?? '';

if (!token) { console.error('Missing SANDBOX_SECRET.'); process.exit(1); }
if (!locationId) { console.error('Missing SQUARE_SANDBOX_LOCATION_ID.'); process.exit(1); }

const client = new SquareClient({ token, environment: SquareEnvironment.Sandbox });

console.log(`\n=== Sandbox bookings setup — location ${locationId} ===\n`);

const cents = (dollars: number) => BigInt(Math.round(dollars * 100));
const hourMs = (n: number) => BigInt(n * 60 * 60 * 1000);

type BayType = 'flat' | 'detail' | 'hoist';
const BAY_HOURLY: Record<BayType, number> = { flat: 25, detail: 30, hoist: 35 };
const BAY_LABELS: Record<BayType, string> = { flat: 'Flat Bay', detail: 'Detail Bay', hoist: 'Hoist Bay' };
const BAY_DESC: Record<BayType, string> = {
  flat:   "Ground-level workspace with personal tool cart, air supply, and workstation. Perfect for maintenance, inspections, and jobs that don't require a lift.",
  detail: 'Dedicated wash and detail station with hot water, pressure washer, and detail supplies. Bring your vehicle to showroom condition.',
  hoist:  'Two-post lift or drive-on hoist, set up and operated by our staff. The right tool for any underbody work.'
};

interface BaySpec {
  type: BayType;
  index: number;
  refId: string;
  givenName: string;
  familyName: string;
  email: string;
  /** Pre-existing sandbox team member id — these already have booking profiles enabled. */
  tmId: string;
}

/**
 * The 5 sandbox TMs, pre-created by Coleman with "Bookable online" toggled on
 * in the Square Dashboard. Ordering here locks the mapping from TM → bay role.
 */
const baySpecs: BaySpec[] = [
  { type: 'hoist',  index: 1, refId: 'bay-h1', givenName: 'Hoist Bay',  familyName: '1', email: 'bay-h1@thewrench.club', tmId: 'TMkMik9RL18tkTF7' },
  { type: 'hoist',  index: 2, refId: 'bay-h2', givenName: 'Hoist Bay',  familyName: '2', email: 'bay-h2@thewrench.club', tmId: 'TMLm78Z2tt7iGsxE' },
  { type: 'flat',   index: 1, refId: 'bay-f1', givenName: 'Flat Bay',   familyName: '1', email: 'bay-f1@thewrench.club', tmId: 'TM-ELEPsnFgo279C' },
  { type: 'flat',   index: 2, refId: 'bay-f2', givenName: 'Flat Bay',   familyName: '2', email: 'bay-f2@thewrench.club', tmId: 'TMUSbWTh7cqWRCUM' },
  { type: 'detail', index: 1, refId: 'bay-d1', givenName: 'Detail Bay', familyName: '1', email: 'bay-d1@thewrench.club', tmId: 'TMYcymhGNoUvtitQ' }
];

// ── Step 1: remove stale Bay catalog entries ─────────────────────────────────
console.log('1. Removing stale Bay catalog items …');
const existing = await client.catalog.search({ objectTypes: ['ITEM'] });
const staleBayIds = (existing.objects ?? [])
  .filter((o) => /^(flat|hoist|detail) bay$/i.test(o.itemData?.name?.trim() ?? ''))
  .map((o) => o.id!)
  .filter(Boolean);

if (staleBayIds.length) {
  await client.catalog.batchDelete({ objectIds: staleBayIds });
  console.log(`   removed ${staleBayIds.length} item(s).`);
} else {
  console.log('   nothing to remove.');
}

// ── Step 2: create APPOINTMENTS_SERVICE entries with 8 variations each ──────
console.log('\n2. Creating APPOINTMENTS_SERVICE catalog entries …');

const bayCategoryId = (await client.catalog.search({ objectTypes: ['CATEGORY'] })).objects?.find(
  (o) => o.categoryData?.name === 'Bays'
)?.id;

const objects: unknown[] = [];

for (const type of ['flat', 'detail', 'hoist'] as BayType[]) {
  const itemId = `#item-${type}-bay`;
  const variations: unknown[] = [];

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
  batches: [{ objects: objects as never }]
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
  flat: idMap.get('#item-flat-bay')!,
  detail: idMap.get('#item-detail-bay')!,
  hoist: idMap.get('#item-hoist-bay')!
};

// ── Step 3: rename the 5 pre-existing sandbox team members ───────────────────
console.log('\n3. Updating names + reference IDs on existing sandbox team members …');

for (const spec of baySpecs) {
  try {
    await client.teamMembers.update({
      teamMemberId: spec.tmId,
      body: {
        teamMember: {
          referenceId: spec.refId,
          givenName: spec.givenName,
          familyName: spec.familyName,
          emailAddress: spec.email,
          status: 'ACTIVE',
          assignedLocations: {
            assignmentType: 'EXPLICIT_LOCATIONS',
            locationIds: [locationId]
          }
        }
      }
    });
    console.log(`   ✓ ${spec.tmId} → ${spec.givenName} ${spec.familyName}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`   ! ${spec.tmId} update failed: ${msg}`);
  }
}

// ── Step 4: (re-)confirm booking profiles are bookable ────────────────────────
console.log('\n4. Confirming booking profiles …');

for (const spec of baySpecs) {
  try {
    const profile = await client.bookings.teamMemberProfiles.get({ teamMemberId: spec.tmId });
    const bookable = profile.teamMemberBookingProfile?.isBookable;
    console.log(`   ${bookable ? '✓' : '✗'} ${spec.givenName} ${spec.familyName} isBookable=${bookable}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`   ! ${spec.tmId} profile lookup failed: ${msg}`);
  }
}

// ── Step 5: write the manifest for src/lib/server/square.ts ──────────────────
const teamMemberIds: Record<string, string> = {};
for (const spec of baySpecs) teamMemberIds[spec.refId] = spec.tmId;

const summary = {
  generatedAt: new Date().toISOString(),
  environment: 'sandbox',
  locationId,
  itemIds,
  variationIds,
  teamMemberIds,
  baySpecs
};
await writeFile('scripts/square-bookings.sandbox.json', JSON.stringify(summary, null, 2));

console.log('\n5. Wrote scripts/square-bookings.sandbox.json.');
console.log('\nNext — MANUAL step in the sandbox Dashboard:');
console.log('   https://app.squareupsandbox.com/dashboard/team');
console.log('   For each bay team member, open Services and restrict to matching type:');
console.log('     • Hoist Bay 1/2 → "Hoist Bay" only');
console.log('     • Flat Bay 1/2  → "Flat Bay" only');
console.log('     • Detail Bay 1  → "Detail Bay" only');
console.log('\nDone.\n');
