import type { Handle } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import { initDb } from '$lib/server/db';
import { authLimiter, verifyResendLimiter } from '$lib/server/rate-limit';

// Initialize DB tables on first server request
let dbReady = false;
const dbInit = initDb().then(() => { dbReady = true; }).catch(console.error);

/**
 * Auth endpoints that are subject to rate limiting.
 * Keyed by pathname → which limiter to apply.
 */
const RATE_LIMITED: Record<string, 'auth' | 'resend'> = {
  '/auth/login': 'auth',
  '/auth/register': 'auth',
  '/auth/forgot-password': 'auth',
  '/api/resend-verification': 'resend'
};

export const handle: Handle = async ({ event, resolve }) => {
  // Ensure DB is ready before handling requests
  if (!dbReady) await dbInit;

  // Rate-limit sensitive POST endpoints by IP
  // Bypass with X-Test-Key header matching TEST_SECRET env var (for e2e testing only)
  const limiterKey = RATE_LIMITED[event.url.pathname];
  if (limiterKey && event.request.method === 'POST') {
    const testSecret = process.env.TEST_SECRET;
    const testKey = event.request.headers.get('x-test-key');
    // Only allow bypass if TEST_SECRET is set (non-empty) and matches the header.
    // TEST_SECRET should NOT be set in production — only in CI/dev environments.
    const bypassRateLimit = !!(testSecret && testSecret.length >= 16 && testKey === testSecret);

    if (!bypassRateLimit) {
      const ip =
        event.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        event.getClientAddress();
      const limited =
        limiterKey === 'resend'
          ? verifyResendLimiter.isLimited(ip)
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

    event.locals.session = session;
    event.locals.user = user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'member' | 'admin' | 'staff',
          squareCustomerId: user.squareCustomerId,
          emailVerified: user.emailVerified
        }
      : null;
  }

  const response = await resolve(event);

  // Immutable assets (hashed by Vite) get long cache — 1 year
  if (event.url.pathname.startsWith('/_app/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
};
