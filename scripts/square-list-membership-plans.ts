#!/usr/bin/env bun
/**
 * Lists all Square subscription plans and their variation IDs.
 * Usage:
 *   SQUARE_ENVIRONMENT=production bun run scripts/square-list-membership-plans.ts
 */
import { SquareClient, SquareEnvironment } from 'square';

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const token = isProduction
  ? (process.env.PROD_ACCESS_TOKEN ?? '')
  : (process.env.SANDBOX_SECRET ?? '');

if (!token) {
  console.error('Missing token. Set PROD_ACCESS_TOKEN or SANDBOX_SECRET.');
  process.exit(1);
}

const client = new SquareClient({
  token,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox
});

const result = await client.catalog.search({
  objectTypes: ['SUBSCRIPTION_PLAN']
});

const plans = result.objects ?? [];
if (plans.length === 0) {
  console.log('No subscription plans found.');
  process.exit(0);
}

for (const plan of plans) {
  console.log(`\nPlan: ${plan.subscriptionPlanData?.name}`);
  console.log(`  Plan ID: ${plan.id}`);
  const variations = plan.subscriptionPlanData?.subscriptionPlanVariations ?? [];
  for (const v of variations) {
    const phase = v.subscriptionPlanVariationData?.phases?.[0];
    const price = phase?.pricing?.priceMoney;
    const amount = price?.amount ? `$${Number(price.amount) / 100}/${phase?.cadence?.toLowerCase()}` : '(no price)';
    console.log(`  Variation: ${v.subscriptionPlanVariationData?.name} — ${amount}`);
    console.log(`  Variation ID: ${v.id}  ← use this as SQUARE_MEMBERSHIP_PLAN_VARIATION_ID`);
  }
}
