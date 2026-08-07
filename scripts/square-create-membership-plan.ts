#!/usr/bin/env bun
/**
 * One-time setup: creates the $10/month Wrench Club Membership subscription plan
 * in Square Catalog, then prints the plan variation ID to store as an env var.
 *
 * Usage (production):
 *   SQUARE_ENVIRONMENT=production bun run scripts/square-create-membership-plan.ts
 *
 * Usage (sandbox):
 *   bun run scripts/square-create-membership-plan.ts
 *
 * After running, set the printed ID in Railway (and .env.local for dev):
 *   SQUARE_MEMBERSHIP_PLAN_VARIATION_ID=<id>
 *
 * Idempotent: safe to re-run — Square returns a conflict error on duplicate
 * client IDs (#membership-plan / #membership-monthly), so nothing is doubled.
 */
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'node:crypto';

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';

const token = isProduction
  ? (process.env.PROD_ACCESS_TOKEN ?? '')
  : (process.env.SANDBOX_SECRET ?? '');

if (!token) {
  console.error('Missing token. Set PROD_ACCESS_TOKEN (prod) or SANDBOX_SECRET (sandbox).');
  process.exit(1);
}

const client = new SquareClient({
  token,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox
});

console.log(`\n=== Wrench Club membership plan setup — ${isProduction ? 'PRODUCTION' : 'SANDBOX'} ===\n`);

const result = await client.catalog.batchUpsert({
  idempotencyKey: randomUUID(),
  batches: [
    {
      objects: [
        {
          type: 'SUBSCRIPTION_PLAN',
          id: '#membership-plan',
          subscriptionPlanData: {
            name: 'Wrench Club Membership',
            subscriptionPlanVariations: [
              {
                type: 'SUBSCRIPTION_PLAN_VARIATION',
                id: '#membership-monthly',
                subscriptionPlanVariationData: {
                  name: 'Monthly',
                  subscriptionPlanId: '#membership-plan',
                  phases: [
                    {
                      cadence: 'MONTHLY',
                      ordinal: BigInt(0),
                      pricing: {
                        type: 'STATIC',
                        priceMoney: { amount: BigInt(1000), currency: 'USD' }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  ]
});

const objects = result.objects ?? [];

console.log('\nAll returned objects:');
for (const o of objects) {
  console.log(` type=${o.type}  id=${o.id}`);
}

const plan = objects.find(o => o.type === 'SUBSCRIPTION_PLAN');
const variation = objects.find(o => o.type === 'SUBSCRIPTION_PLAN_VARIATION');

if (!plan && !variation) {
  // The plan may already exist — try to find it by listing catalog
  console.log('\nNo objects returned. The plan may already exist in Square.');
  console.log('Check Square Dashboard → Catalog → Subscriptions for "Wrench Club Membership".');
  console.log('Or re-run with a fresh idempotency key if you need to recreate it.');
  process.exit(1);
}

if (plan) {
  console.log('\nPlan ID:           ', plan.id);
}
if (variation) {
  console.log('Plan Variation ID: ', variation.id);
  console.log('\n→ Add this to Railway + .env.local:');
  console.log(`  SQUARE_MEMBERSHIP_PLAN_VARIATION_ID=${variation.id}\n`);
} else if (plan) {
  // Variation is nested inside the plan data
  const nested = (plan as any).subscriptionPlanData?.subscriptionPlanVariations ?? [];
  console.log('Nested variations:', nested.map((v: any) => v.id));
  if (nested[0]?.id) {
    console.log('\n→ Add this to Railway + .env.local:');
    console.log(`  SQUARE_MEMBERSHIP_PLAN_VARIATION_ID=${nested[0].id}\n`);
  }
}
