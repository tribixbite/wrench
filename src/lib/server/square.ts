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

/** Square Bookings — production bay team-member IDs.
 *  6 bays: 2 hoist + 3 flat + 1 detail. Each bay is a Square "team member"
 *  that acts as a bookable resource. IDs from scripts/square-bookings.json. */
export type BayType = 'hoist' | 'flat' | 'detail';

export interface BayInfo {
  id: number;
  type: BayType;
  label: string;
  teamMemberId: string;
}

export const BAYS: BayInfo[] = [
  { id: 1, type: 'hoist',  label: 'Hoist Bay 1',  teamMemberId: 'TMiRX0Ke9zvPD41I' },
  { id: 2, type: 'hoist',  label: 'Hoist Bay 2',  teamMemberId: 'TMhyzQEsQZVnr-2r' },
  { id: 3, type: 'flat',   label: 'Flat Bay 1',   teamMemberId: 'TMZIBkR6K6ehUYn1' },
  { id: 4, type: 'flat',   label: 'Flat Bay 2',   teamMemberId: 'TMy4YFOq7XXbx3dS' },
  { id: 5, type: 'flat',   label: 'Flat Bay 3',   teamMemberId: 'TMSsGetF72Ze9Qwf' },
  { id: 6, type: 'detail', label: 'Detail Bay 1', teamMemberId: 'TMuuAI_z-nwKx_cZ' }
];

/** Convenience map: bay id → team member id */
export const BAY_TEAM_MEMBERS: Record<number, string> = Object.fromEntries(
  BAYS.map(b => [b.id, b.teamMemberId])
);

/** Bay-type → service variation IDs by hour count (1-8). Linear pricing:
 *    Flat   $25/hr · Detail $30/hr · Hoist $35/hr  */
export const BAY_VARIATIONS: Record<BayType, Record<number, string>> = {
  flat: {
    1: 'CWVRBWGVMING4VM24TA2MRLL', 2: 'XMP5HGO6OSNGVGIJKIL7LBF7',
    3: 'B6BMNAPUQZ3J2K5NXVGDDAJA', 4: 'SJHBYAC2TS5LJE6VQVZSFVVL',
    5: 'HSOKWKWPAPZ6LAN4RABXWAZU', 6: 'KV62QRWHTJFE7HIFEO64KK3C',
    7: 'RS5AU4UJYAYJAVUHEXLVLHDJ', 8: 'QKVFQZORNFIRLQYFRDBRW75S'
  },
  detail: {
    1: 'IQV6PZL7LT5HNW6AYFVPG3AX', 2: '5QZAC6WDX3XZYSB4NSEDBBIE',
    3: '6X2BVKAKCV4TV5PXN7435OMS', 4: 'TW52I3FYZVEHBIBDP4KVBDOY',
    5: 'IXP5EMVDL7XIXUIQKDLMCJI2', 6: 'R5ALTP4KQD5PQKABSI5RJUOD',
    7: 'P2ZCUIA7QI6ZK5CLCASF55CW', 8: '7GGH3NLVHB7OVONCVU63AUIF'
  },
  hoist: {
    1: 'NWGQFO7LT5W2MTN53KNKBBZC', 2: '4HOSAOEFXEFPK5A2YVXDTLLJ',
    3: '25GNYIMHH6ITTJMD7MSEXNBY', 4: 'DUL5KIP6VZK5VAFVECEA5MEH',
    5: '636RBFJ4HQSS3RUO4E7YYTIK', 6: 'Z3WDSL7K7QXWIXN3ZNZPYAR2',
    7: '5MIDRMVPXWIYKLRFNFSYPWWN', 8: 'HPUTH7FPE2D2UREETSHO66OB'
  }
};

/** Hourly base rate ($/hr) by bay type — pricing is linear. */
export const BAY_HOURLY_RATE: Record<BayType, number> = {
  flat: 25, detail: 30, hoist: 35
};

export const BAY_TYPE_LABEL: Record<BayType, string> = {
  flat: 'Flat Bay', detail: 'Detail Bay', hoist: 'Hoist Bay'
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
