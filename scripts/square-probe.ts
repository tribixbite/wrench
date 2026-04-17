#!/usr/bin/env bun
/**
 * Read-only probe of the active Square catalog.
 * Lists ITEM and CATEGORY objects with variations + price + tracking flags.
 * Run with: bun run scripts/square-probe.ts
 *
 * Honours SQUARE_ENVIRONMENT (defaults to production now).
 */
import { SquareClient, SquareEnvironment } from 'square';
// Bun auto-loads .env

const isProduction = process.env.SQUARE_ENVIRONMENT !== 'sandbox';
const token = isProduction
  ? (process.env.PROD_ACCESS_TOKEN ?? process.env.SQUARE_ACCESS_TOKEN ?? '')
  : (process.env.SANDBOX_SECRET ?? '');
const locationId = isProduction
  ? (process.env.SQUARE_LOCATION_ID ?? '')
  : (process.env.SQUARE_SANDBOX_LOCATION_ID ?? '');

if (!token) {
  console.error('Missing token. Need PROD_ACCESS_TOKEN (prod) or SANDBOX_SECRET (sandbox).');
  process.exit(1);
}

const client = new SquareClient({
  token,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox
});

const env = isProduction ? 'PRODUCTION' : 'SANDBOX';
console.log(`\n=== Square Catalog Probe — ${env} ===`);
console.log(`Location ID: ${locationId || '(unset)'}\n`);

// Locations
try {
  const locs = await client.locations.list();
  console.log(`Locations (${locs.locations?.length ?? 0}):`);
  for (const l of locs.locations ?? []) {
    console.log(`  - ${l.id} :: ${l.name} (${l.status}) ${l.address?.locality ?? ''}`);
  }
} catch (e: any) {
  console.error('  Failed to list locations:', e?.message ?? e);
}

// Categories
console.log('\n--- Categories ---');
try {
  const cats = await client.catalog.search({ objectTypes: ['CATEGORY'] });
  for (const c of cats.objects ?? []) {
    console.log(`  ${c.id} :: ${c.categoryData?.name}`);
  }
  if (!cats.objects?.length) console.log('  (none)');
} catch (e: any) {
  console.error('  Failed to list categories:', e?.message ?? e);
}

// Items
console.log('\n--- Items (catalog) ---');
try {
  const items = await client.catalog.search({ objectTypes: ['ITEM'] });
  for (const o of items.objects ?? []) {
    const it = o.itemData;
    console.log(`  ${o.id} :: ${it?.name ?? '?'}  ${it?.descriptionPlaintext ? '— ' + it.descriptionPlaintext.slice(0, 80) : ''}`);
    for (const v of it?.variations ?? []) {
      const vd: any = v.itemVariationData;
      const price = vd?.priceMoney
        ? `$${(Number(vd.priceMoney.amount ?? 0) / 100).toFixed(2)} ${vd.priceMoney.currency ?? ''}`
        : '(variable)';
      const tracking = vd?.trackInventory ? ' [tracked]' : '';
      console.log(`      • ${v.id} :: ${vd?.name ?? '?'}  ${price}${tracking}`);
    }
  }
  if (!items.objects?.length) console.log('  (none)');
} catch (e: any) {
  console.error('  Failed to list items:', e?.message ?? e);
}

console.log('\nDone.\n');
