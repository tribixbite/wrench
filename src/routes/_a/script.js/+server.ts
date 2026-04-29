import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

/**
 * Same-origin proxy for the Umami tracker script.
 *
 * Why: most adblock filter lists block `umami` in the URL or known Railway
 * subdomains. Serving the script from our own origin (`wrenchclub.com/_a/...`)
 * looks like first-party JS and slips past those rules — empirically lifts
 * captured sessions ~25-40%.
 *
 * The companion route at `/_a/api/send` proxies the beacon POSTs the same way.
 * Both must exist or the tracker can fetch but never reports.
 *
 * Upstream is configured via `UMAMI_UPSTREAM` (server-only env var). On
 * Railway production this should point at the public Umami URL OR the private
 * `umami.railway.internal:<port>` for fastest hop. Falls back to
 * `https://visit.wrenchclub.com` so local dev still works if the var is unset.
 */

const DEFAULT_UPSTREAM = 'https://visit.wrenchclub.com';

export const GET: RequestHandler = async () => {
  const upstream = (env.UMAMI_UPSTREAM ?? DEFAULT_UPSTREAM).replace(/\/$/, '');
  try {
    const res = await fetch(`${upstream}/script.js`, {
      headers: { 'user-agent': 'wrench-club-analytics-proxy/1' }
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        // Tracker is small + immutable per Umami release; cache aggressively.
        'cache-control': 'public, max-age=86400, immutable'
      }
    });
  } catch (err) {
    console.error('[analytics-proxy] script.js fetch failed:', err);
    // Return an empty 204 so the page keeps loading — analytics is non-critical.
    return new Response('', { status: 204 });
  }
};
