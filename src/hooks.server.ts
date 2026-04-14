import type { Handle } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import { initDb } from '$lib/server/db';

// Initialize DB tables on first server request
let dbReady = false;
const dbInit = initDb().then(() => { dbReady = true; }).catch(console.error);

export const handle: Handle = async ({ event, resolve }) => {
  // Ensure DB is ready before handling requests
  if (!dbReady) await dbInit;

  // Validate session cookie and attach user to locals
  const sessionId = event.cookies.get(lucia.sessionCookieName);
  if (!sessionId) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

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
        squareCustomerId: user.squareCustomerId
      }
    : null;

  return resolve(event);
};
