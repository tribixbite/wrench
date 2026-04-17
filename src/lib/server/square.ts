import { SquareClient, SquareEnvironment } from 'square';
import { env } from '$env/dynamic/private';

/**
 * Square API client — server-only. Never import this in client-side code.
 * Production by default (real catalog drives /store); set
 * SQUARE_ENVIRONMENT=sandbox to fall back to test data.
 */
const isProduction = env.SQUARE_ENVIRONMENT !== 'sandbox';

export const square = new SquareClient({
  token: isProduction
    ? (env.PROD_ACCESS_TOKEN ?? env.SQUARE_ACCESS_TOKEN ?? '')
    : (env.SANDBOX_SECRET ?? env.SQUARE_ACCESS_TOKEN ?? ''),
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox
});

/** Location ID — production by default, sandbox when explicitly opted in */
export const LOCATION_ID = isProduction
  ? (env.SQUARE_LOCATION_ID ?? '')
  : (env.SQUARE_SANDBOX_LOCATION_ID ?? env.SQUARE_LOCATION_ID ?? '');

/** Square Bookings — bay team member IDs (each bay = one bookable resource).
 *  TODO: Move to env vars / DB when switching to production Square account. */
export const BAY_TEAM_MEMBERS: Record<number, string> = {
  1: 'TMkMik9RL18tkTF7',
  2: 'TMLm78Z2tt7iGsxE',
  3: 'TM-ELEPsnFgo279C',
  4: 'TMUSbWTh7cqWRCUM',
  5: 'TMYcymhGNoUvtitQ'
};

/** Bay Reservation service variation IDs */
export const BAY_VARIATIONS = {
  /** 90-minute block, $40 */
  min90: 'PAEUY2TR33A33BF2F3DQALZ3',
  /** 3-hour block, $60 */
  hr3:   'TZ5SR5IEWWIWOTXFOSJSB7R2'
} as const;

export type VariationKey = keyof typeof BAY_VARIATIONS;

/** Prices in cents for display */
export const BAY_PRICES: Record<VariationKey, number> = {
  min90: 4000,
  hr3:   6000
};

export const BAY_LABELS: Record<VariationKey, string> = {
  min90: '90 min — $40',
  hr3:   '3 hours — $60'
};

/**
 * Add a customer to Square — called at member registration.
 * Stores the returned ID in our local users table.
 */
export async function createSquareCustomer(opts: {
  email: string;
  givenName: string;
  familyName?: string;
}) {
  const result = await square.customers.create({
    emailAddress: opts.email,
    givenName: opts.givenName,
    familyName: opts.familyName,
    referenceId: 'wrench-web'
  });
  return result.customer;
}

/**
 * Subscribe a waitlist email to Square Marketing (optional — falls back to local DB).
 * TODO: Wire up when Square Marketing API endpoint is confirmed.
 */
export async function addToSquareMarketing(_email: string): Promise<void> {
  // TODO: Implement via Square Marketing API when sandbox is ready
  // For now, waitlist emails are stored only in the local DB
}
