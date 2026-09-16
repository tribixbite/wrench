import type { Handle } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import { db, initDb } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { authLimiter, verifyResendLimiter, membershipLimiter, waitlistLimiter } from '$lib/server/rate-limit';
import { dev } from '$app/environment';
import { isAllowedEmail, isAdminEmail } from '$lib/server/auth-allowlist';
import { env } from '$env/dynamic/private';

// Initialize DB tables on first server request
let dbReady = false;
const dbInit = initDb().then(() => { dbReady = true; }).catch(console.error);

/**
 * Endpoints subject to rate limiting.
 * Keyed by pathname → which limiter to apply.
 */
const RATE_LIMITED: Record<string, 'auth' | 'resend' | 'membership' | 'waitlist'> = {
  '/auth/login': 'auth',
  '/auth/register': 'auth',
  '/auth/forgot-password': 'auth',
  '/api/resend-verification': 'resend',
  '/api/membership/subscribe': 'membership',
  '/api/membership/register': 'membership',
  '/api/waitlist': 'waitlist'
};

export const handle: Handle = async ({ event, resolve }) => {
  // Ensure DB is ready before handling requests
  if (!dbReady) await dbInit;

  // Rate-limit sensitive POST endpoints by IP
  // Bypass with X-Test-Key header matching TEST_SECRET env var (for e2e testing only)
  const limiterKey = RATE_LIMITED[event.url.pathname];
  if (limiterKey && event.request.method === 'POST') {
    const testSecret = env.TEST_SECRET;
    const testKey = event.request.headers.get('x-test-key');
    // Only allow bypass in dev/CI — never in production builds.
    const bypassRateLimit = dev && !!(testSecret && testSecret.length >= 16 && testKey === testSecret);

    if (!bypassRateLimit) {
      // Use the platform-verified client address — not X-Forwarded-For, which
      // can be spoofed by the client to rotate IPs and bypass the rate limiter.
      const ip = event.getClientAddress();
      const limited =
        limiterKey === 'resend'
          ? verifyResendLimiter.isLimited(ip)
          : limiterKey === 'membership'
            ? membershipLimiter.isLimited(ip)
            : limiterKey === 'waitlist'
              ? waitlistLimiter.isLimited(ip)
              : authLimiter.isLimited(ip);
      if (limited) {
        return new Response(JSON.stringify({ error: 'Too many requests — try again later' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
        });
      }
    }
  }

  // Validate session cookie and attach user to locals
  const sessionId = event.cookies.get(lucia.sessionCookieName);
  if (!sessionId) {
    event.locals.user = null;
    event.locals.session = null;
  } else {
    const { session, user } = await lucia.validateSession(sessionId);

    if (session?.fresh) {
      // Refresh session cookie on active sessions
      const cookie = lucia.createSessionCookie(session.id);
      event.cookies.set(cookie.name, cookie.value, {
        path: '/',
        ...cookie.attributes
      });
    }

    if (!session) {
      const blankCookie = lucia.createBlankSessionCookie();
      event.cookies.set(blankCookie.name, blankCookie.value, {
        path: '/',
        ...blankCookie.attributes
      });
    }

    // Pre-launch gate — invalidate sessions whose email isn't on the allowlist.
    // Existing test sessions get logged out on next request once AUTH_ALLOWLIST is set.
    if (user && !isAllowedEmail(user.email)) {
      await lucia.invalidateSession(session!.id);
      const blankCookie = lucia.createBlankSessionCookie();
      event.cookies.set(blankCookie.name, blankCookie.value, {
        path: '/',
        ...blankCookie.attributes
      });
      event.locals.session = null;
      event.locals.user = null;
    } else {
      // Auto-promote: any email in AUTH_ADMIN_EMAILS that's currently below
      // 'admin' gets bumped here, idempotently. Avoids manual DB surgery to
      // grant admin to founders/operators — set the env var, they get admin
      // on their next request. The branch only fires when the role is stale,
      // so it's a no-op once promoted.
      let effectiveRole = user?.role ?? 'member';
      if (user && isAdminEmail(user.email) && effectiveRole !== 'admin') {
        await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
        effectiveRole = 'admin';
      }

      event.locals.session = session;
      event.locals.user = user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: effectiveRole as 'member' | 'admin' | 'staff',
            squareCustomerId: user.squareCustomerId,
            emailVerified: user.emailVerified
          }
        : null;
    }
  }

  const response = await resolve(event);

  // Immutable assets (hashed by Vite) get long cache — 1 year
  if (event.url.pathname.startsWith('/_app/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Security headers — applied to every response
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // HSTS: browsers ignore this on plain HTTP (dev), so it's safe to set unconditionally
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // Content Security Policy
  // 'unsafe-inline' for scripts/styles is required by SvelteKit SSR hydration.
  // Square CDN domains are required by the Web Payments SDK (script load + card iframe).
  // Note: the Swagger UI at /api/docs loads from unpkg.com and will break under this CSP.
  // That endpoint is dev-only; self-host swagger-ui-dist to fix it if needed.
  const squareCdn = 'https://web.squarecdn.com https://sandbox.web.squarecdn.com';
  const squareFrame = 'https://pci-connect.squareup.com https://pci-connect.squareupsandbox.com';
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${squareCdn}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self'",
      `frame-src ${squareFrame}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );

  return response;
};
