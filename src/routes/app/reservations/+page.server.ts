import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { BAYS, BAY_HOURLY_RATE, BAY_TYPE_LABEL, LOCATION_ID } from '$lib/server/square';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login?next=/app/reservations');

  // App ID + environment are needed by the Web Payments SDK on the client.
  // The App ID is a public identifier (it's literally meant to be in HTML);
  // the access token stays server-side.
  const isProduction = env.SQUARE_ENVIRONMENT !== 'sandbox';
  const squareAppId = isProduction
    ? (env.PROD_APP_ID ?? '')
    : (env.SANDBOX_APP_ID ?? '');

  return {
    bays: BAYS.map(b => ({ id: b.id, type: b.type, label: b.label })),
    hourlyRate: BAY_HOURLY_RATE,
    typeLabel: BAY_TYPE_LABEL,
    square: {
      appId: squareAppId,
      locationId: LOCATION_ID,
      environment: isProduction ? 'production' : 'sandbox'
    }
  };
};
