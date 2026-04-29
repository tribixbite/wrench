import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

/**
 * Same-origin proxy for Umami's `/api/send` beacon endpoint.
 *
 * Forwards the JSON body verbatim, plus user-agent and the originating client
 * IP via `X-Forwarded-For`. Without the IP, Umami would see only Railway's
 * gateway address for every visitor and aggregate everyone into one session.
 *
 * Beacons are time-sensitive and tiny — never cache the response.
 */

const DEFAULT_UPSTREAM = 'https://visit.wrenchclub.com';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const upstream = (env.UMAMI_UPSTREAM ?? DEFAULT_UPSTREAM).replace(/\/$/, '');
  const body = await request.text();

  const headers = new Headers();
  headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
  const ua = request.headers.get('user-agent');
  if (ua) headers.set('user-agent', ua);

  // Preserve the chain so Umami sees the original visitor, not Railway's edge.
  // If a chain already exists, append the direct caller; otherwise start one.
  const ip = getClientAddress();
  const existingXff = request.headers.get('x-forwarded-for');
  if (existingXff) headers.set('x-forwarded-for', `${existingXff}, ${ip}`);
  else if (ip) headers.set('x-forwarded-for', ip);

  try {
    const res = await fetch(`${upstream}/api/send`, {
      method: 'POST',
      headers,
      body
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store'
      }
    });
  } catch (err) {
    console.error('[analytics-proxy] /api/send forward failed:', err);
    // Swallow upstream failures — losing a beacon is fine; failing the
    // visitor's page navigation is not.
    return new Response('', { status: 204 });
  }
};
