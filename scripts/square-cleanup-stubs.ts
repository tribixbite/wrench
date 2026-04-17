#!/usr/bin/env bun
/**
 * Remove Square-default stub items that aren't part of the real catalog.
 * Specifically: "White T" (test item, $20, no description) and
 * "Consultation (example service)" (Square's built-in demo service).
 *
 * Safe to re-run — only deletes items matching the stub criteria.
 *
 * Usage:
 *   SQUARE_ENVIRONMENT=production bun run scripts/square-cleanup-stubs.ts
 */
import { SquareClient, SquareEnvironment } from 'square';

const isProduction = process.env.SQUARE_ENVIRONMENT !== 'sandbox';
const token = isProduction ? process.env.PROD_ACCESS_TOKEN : process.env.SANDBOX_SECRET;

if (!token) {
  console.error('Missing token.');
  process.exit(1);
}

const client = new SquareClient({
  token,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox
});

console.log(`\n=== Stub cleanup — ${isProduction ? 'PRODUCTION' : 'SANDBOX'} ===\n`);

const result = await client.catalog.search({ objectTypes: ['ITEM'] });
const items = result.objects ?? [];

const isStub = (name: string, description: string) => {
  const n = name.toLowerCase();
  const d = description.toLowerCase();
  return (
    n === 'white t' ||
    n === 'white t ' ||
    n.includes('example service') ||
    d.startsWith('square created this example')
  );
};

const toDelete = items
  .filter(o => {
    const name = o.itemData?.name ?? '';
    const desc = o.itemData?.descriptionPlaintext ?? '';
    return isStub(name, desc);
  })
  .map(o => o.id!)
  .filter(Boolean);

if (!toDelete.length) {
  console.log('No stub items to remove.');
  process.exit(0);
}

console.log(`Removing ${toDelete.length} stub item(s):`);
for (const id of toDelete) {
  const item = items.find(o => o.id === id);
  console.log(`  - ${id} :: ${item?.itemData?.name}`);
}

try {
  const res = await client.catalog.batchDelete({ objectIds: toDelete });
  console.log(`\nDeleted: ${(res.deletedObjectIds ?? []).length} objects`);
} catch (e: any) {
  console.error('Delete failed:', e?.message ?? e);
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2));
  process.exit(1);
}

console.log('\nDone.\n');
