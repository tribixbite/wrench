#!/usr/bin/env bun
// @ts-nocheck
/**
 * Lists all Square subscription plans and their variation IDs.
 * Uses raw fetch so pricing.order_template_id is not stripped by the SDK.
 * Usage:
 *   SQUARE_ENVIRONMENT=production bun run scripts/square-list-membership-plans.ts
 */
import { SquareClient, SquareEnvironment } from 'square';

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const token = isProduction
  ? (process.env.PROD_ACCESS_TOKEN ?? process.env.SQUARE_ACCESS_TOKEN ?? '')
  : (process.env.SANDBOX_SECRET ?? process.env.SQUARE_ACCESS_TOKEN ?? '');

if (!token) {
  console.error('Missing token. Set PROD_ACCESS_TOKEN or SANDBOX_SECRET.');
  process.exit(1);
}

const base = isProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
const headers = { Authorization: `Bearer ${token}`, 'Square-Version': '2025-05-21' };

const client = new SquareClient({
  token,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox
});

// Get plan list via SDK (to enumerate IDs)
const result = await client.catalog.search({ objectTypes: ['SUBSCRIPTION_PLAN'] });
const plans = result.objects ?? [];

if (plans.length === 0) {
  console.log('No subscription plans found.');
  process.exit(0);
}

for (const plan of plans) {
  const p = plan as any;
  console.log(`\nPlan: ${p.subscriptionPlanData?.name}`);
  console.log(`  Plan ID: ${p.id}`);
  const variations: any[] = p.subscriptionPlanData?.subscriptionPlanVariations ?? [];
  for (const v of variations) {
    console.log(`\n  Variation: ${v.subscriptionPlanVariationData?.name}`);
    console.log(`  Variation ID: ${v.id}  ← use this as SQUARE_MEMBERSHIP_PLAN_VARIATION_ID`);

    // Raw fetch to see full pricing details (SDK strips order_template_id)
    const res = await fetch(`${base}/v2/catalog/object/${v.id}`, { headers });
    if (res.ok) {
      const data = await res.json() as any;
      const phases: any[] = data?.object?.subscription_plan_variation_data?.phases ?? [];
      for (const phase of phases) {
        const type = phase.pricing?.type ?? 'unknown';
        const orderTemplateId = phase.pricing?.order_template_id ?? phase.order_template_id ?? null;
        const priceMoney = phase.pricing?.price_money ?? phase.recurring_price_money ?? null;
        const price = priceMoney ? `$${priceMoney.amount / 100}` : null;
        console.log(`  Phase [${phase.cadence}] pricing: ${type}${price ? ` ${price}` : ''}${orderTemplateId ? ` | order_template_id: ${orderTemplateId}` : ' | ⚠ no order_template_id'}`);
      }
    } else {
      console.log(`  (could not fetch variation details: ${res.status})`);
    }
  }
}
