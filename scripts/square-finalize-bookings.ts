#!/usr/bin/env bun
/**
 * Finalise the Square Bookings setup:
 *   - look up the 6 bay team members by referenceId (created earlier)
 *   - PUT /v2/bookings/team-member-booking-profiles/{id} to mark each bookable
 *     (the SDK only exposes list/get for booking profiles, so we hit REST)
 *   - probe the catalog for the bay variation IDs
 *   - write scripts/square-bookings.json with everything wired together
 */
import { SquareClient, SquareEnvironment } from 'square';
import { writeFile } from 'node:fs/promises';

const isProduction = process.env.SQUARE_ENVIRONMENT !== 'sandbox';
const token = isProduction ? process.env.PROD_ACCESS_TOKEN : process.env.SANDBOX_SECRET;
const locationId = isProduction
  ? (process.env.SQUARE_LOCATION_ID ?? '')
  : (process.env.SQUARE_SANDBOX_LOCATION_ID ?? '');

if (!token || !locationId) { console.error('Missing token / location.'); process.exit(1); }

const client = new SquareClient({
  token,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox
});

const apiBase = isProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

console.log(`\n=== Finalise bookings — ${isProduction ? 'PRODUCTION' : 'SANDBOX'} ===\n`);

// 1. Find team members by referenceId
const tmRes = await client.teamMembers.search({
  query: { filter: { locationIds: [locationId], status: 'ACTIVE' } },
  limit: 200
});

const refToId: Record<string, string> = {};
for (const tm of tmRes.teamMembers ?? []) {
  if (tm.referenceId?.startsWith('bay-') && tm.id) refToId[tm.referenceId] = tm.id;
}

console.log(`Team members found: ${Object.keys(refToId).length}`);
for (const [ref, id] of Object.entries(refToId)) console.log(`   • ${ref} → ${id}`);

// 2. Mark each as bookable via REST
console.log('\nMarking team members as bookable …');
for (const [ref, id] of Object.entries(refToId)) {
  const givenName = ref === 'bay-h1' ? 'Hoist Bay' : ref === 'bay-h2' ? 'Hoist Bay' :
                    ref === 'bay-f1' ? 'Flat Bay'  : ref === 'bay-f2' ? 'Flat Bay'  :
                    ref === 'bay-f3' ? 'Flat Bay'  : 'Detail Bay';
  const familyName = ref.endsWith('1') ? '1' : ref.endsWith('2') ? '2' : ref.endsWith('3') ? '3' : '1';

  const url = `${apiBase}/v2/bookings/team-member-booking-profiles/${id}`;
  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Square-Version': '2025-01-23'
    },
    body: JSON.stringify({
      team_member_booking_profile: {
        is_bookable: true,
        display_name: `${givenName} ${familyName}`
      }
    })
  });

  const body = await resp.text();
  if (resp.ok) {
    console.log(`   ✓ ${ref} bookable`);
  } else {
    console.warn(`   ! ${ref} (HTTP ${resp.status}): ${body.slice(0, 200)}`);
  }
}

// 3. Probe catalog for bay variation IDs
console.log('\nLooking up bay catalog IDs …');
const cat = await client.catalog.search({ objectTypes: ['ITEM'] });
const bays = (cat.objects ?? []).filter(o =>
  /^(flat|hoist|detail) bay$/i.test(o.itemData?.name?.trim() ?? '')
);

const itemIds: Record<'flat' | 'detail' | 'hoist', string> = { flat: '', detail: '', hoist: '' };
const variationIds: Record<'flat' | 'detail' | 'hoist', Record<number, string>> = {
  flat: {}, detail: {}, hoist: {}
};

for (const o of bays) {
  const name = o.itemData?.name?.toLowerCase() ?? '';
  const t: 'flat' | 'detail' | 'hoist' =
    name.includes('hoist') ? 'hoist' : name.includes('detail') ? 'detail' : 'flat';
  itemIds[t] = o.id!;
  for (const v of o.itemData?.variations ?? []) {
    const vname = v.itemVariationData?.name ?? '';
    const m = vname.match(/^(\d+)\s+Hour/);
    if (m) variationIds[t][Number(m[1])] = v.id!;
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  locationId,
  itemIds,
  variationIds,
  teamMemberIds: refToId
};
await writeFile('scripts/square-bookings.json', JSON.stringify(summary, null, 2));

console.log('\nSaved scripts/square-bookings.json');
console.log('\n--- Constants for src/lib/server/square.ts ---');
console.log(`BAY_TEAM_MEMBERS:`);
console.log(`  1: '${refToId['bay-h1']}'  // Hoist Bay 1`);
console.log(`  2: '${refToId['bay-h2']}'  // Hoist Bay 2`);
console.log(`  3: '${refToId['bay-f1']}'  // Flat Bay 1`);
console.log(`  4: '${refToId['bay-f2']}'  // Flat Bay 2`);
console.log(`  5: '${refToId['bay-f3']}'  // Flat Bay 3`);
console.log(`  6: '${refToId['bay-d1']}'  // Detail Bay 1`);
console.log('\nDone.\n');
