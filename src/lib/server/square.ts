import { SquareClient, SquareEnvironment } from 'square';
import { env } from '$env/dynamic/private';

/**
 * Square API client — server-only. Never import this in client-side code.
 * Uses sandbox in dev, production in prod.
 */
export const square = new SquareClient({
  token: env.SQUARE_ACCESS_TOKEN ?? env.SANDBOX_SECRET,
  environment: env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox
});

/** Location ID for bay scheduling and catalog queries */
export const LOCATION_ID = env.SQUARE_LOCATION_ID ?? '';

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
