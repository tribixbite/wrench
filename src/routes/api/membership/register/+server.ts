/**
 * POST /api/membership/register
 *
 * Full registration + subscription flow in one atomic-ish request:
 *   1. Validate inputs
 *   2. Create Square customer
 *   3. Save card on file (from Web Payments SDK nonce)
 *   4. Create $10/month Square subscription (charges immediately)
 *   5. Create local DB user
 *   6. Issue Lucia session cookie
 *   7. Send email verification link
 *
 * On any Square error after customer creation, the already-created resources
 * are rolled back (card disabled, customer deleted) before returning an error.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, emailVerificationTokens } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { nanoid } from 'nanoid';
import { lucia } from '$lib/server/auth';
import { square, LOCATION_ID } from '$lib/server/square';
import { env } from '$env/dynamic/private';
import { isAllowedEmail, isAdminEmail, ALLOWLIST_DENY_MSG } from '$lib/server/auth-allowlist';
import { sendEmailVerification, sendRegistrationWelcome } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, { status: 400 });
  }

  const firstName  = String(body.firstName  ?? '').trim();
  const lastName   = String(body.lastName   ?? '').trim();
  const email      = String(body.email      ?? '').trim().toLowerCase();
  const password   = String(body.password   ?? '');
  const cardNonce  = String(body.cardNonce  ?? '').trim();

  if (!firstName || !lastName || !email || !password || !cardNonce) {
    return json({ error: 'All fields are required.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8) {
    return json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (!isAllowedEmail(email)) {
    return json({ error: ALLOWLIST_DENY_MSG }, { status: 403 });
  }

  // CI test bypass — skip Square payment when TEST_SECRET header matches env var.
  // TEST_SECRET is never set in Railway production, so real users always pay.
  const testSecret = env.TEST_SECRET;
  const isTestBypass = !!testSecret && request.headers.get('x-test-key') === testSecret;

  const planVariationId = env.SQUARE_MEMBERSHIP_PLAN_VARIATION_ID;
  if (!planVariationId && !isTestBypass) {
    console.error('[register] SQUARE_MEMBERSHIP_PLAN_VARIATION_ID not set');
    return json({ error: 'Membership enrollment is temporarily unavailable. Contact info@thewrench.club.' }, { status: 503 });
  }

  // Silent duplicate handling — send "you already have an account" email and
  // return the same success JSON so we don't reveal whether the email exists.
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    sendRegistrationWelcome({ to: email, name: existing.name }).catch(() => {});
    return json({ ok: true });
  }

  const name = `${firstName} ${lastName}`;

  // ── Steps 1-3: Square customer + card + subscription ─────────────────────
  let squareCustomerId: string | null = null;

  if (isTestBypass) {
    console.log('[register] TEST BYPASS — skipping Square payment for', email);
  } else {
    // Step 1: Square customer
    try {
      const { customer } = await square.customers.create({
        emailAddress: email,
        givenName: firstName,
        familyName: lastName,
        referenceId: 'wrench-web'
      });
      if (!customer?.id) throw new Error('No customer ID in response');
      squareCustomerId = customer.id;
    } catch (e) {
      console.error('[register] Square customer create failed:', e);
      return json({ error: 'Could not create your customer profile. Please try again.' }, { status: 502 });
    }

    // Step 2: Card on file
    let cardId: string;
    try {
      const { card } = await square.cards.create({
        idempotencyKey: nanoid(),
        sourceId: cardNonce,
        card: { customerId: squareCustomerId }
      });
      if (!card?.id) throw new Error('No card ID in response');
      cardId = card.id;
    } catch (e) {
      console.error('[register] Card save failed:', e);
      square.customers.delete({ customerId: squareCustomerId! }).catch(() => {});
      return json({ error: 'Could not save your card. Please check the details and try again.' }, { status: 400 });
    }

    // Step 3: Subscription
    // RELATIVE-priced plans (catalog-connected) require a non-empty phases array.
    // Fetch the plan variation's phase UIDs so Square can resolve the order template.
    let subscriptionPhases: Array<{ ordinal: bigint; planPhaseUid?: string }> | undefined;
    try {
      const { objects } = await square.catalog.batchGet({
        objectIds: [planVariationId!],
        includeRelatedObjects: false
      });
      const catalogPhases = (objects?.[0] as any)?.subscriptionPlanVariationData?.phases as Array<{ uid?: string | null; ordinal?: bigint | number | null }> | undefined;
      if (catalogPhases?.length) {
        subscriptionPhases = catalogPhases.map((p, i) => ({
          ordinal: BigInt(p.ordinal ?? i),
          ...(p.uid ? { planPhaseUid: p.uid } : {})
        }));
      }
      console.log('[register] plan phases:', JSON.stringify(subscriptionPhases, (_k, v) =>
        typeof v === 'bigint' ? v.toString() : v
      ));
    } catch (phaseErr) {
      console.warn('[register] Could not fetch plan phases — proceeding without:', phaseErr);
    }

    try {
      const { subscription } = await square.subscriptions.create({
        idempotencyKey: nanoid(),
        locationId: LOCATION_ID,
        planVariationId: planVariationId!,
        customerId: squareCustomerId,
        cardId,
        source: { name: 'Wrench Club Website' },
        phases: subscriptionPhases?.length ? subscriptionPhases : undefined
      });
      if (!subscription?.id) throw new Error('No subscription ID in response');
    } catch (e: any) {
      console.error('[register] Subscription create failed:', e);
      square.cards.disable({ cardId }).catch(() => {});
      square.customers.delete({ customerId: squareCustomerId! }).catch(() => {});
      const detail = e?.errors?.[0]?.detail ?? e?.message ?? 'Subscription failed.';
      return json({ error: `Payment failed: ${detail}` }, { status: 402 });
    }
  }

  // ── Step 4: Local user ────────────────────────────────────────────────────
  const passwordHash = await new Argon2id().hash(password);
  const userId = nanoid();
  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    role: isAdminEmail(email) ? 'admin' : 'member',
    squareCustomerId
  });

  // ── Step 5: Session cookie ────────────────────────────────────────────────
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies.set(sessionCookie.name, sessionCookie.value, { path: '/', ...sessionCookie.attributes });

  // ── Step 6: Email verification ────────────────────────────────────────────
  const verifyToken = nanoid(32);
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  await db.insert(emailVerificationTokens).values({ id: nanoid(), userId, token: verifyToken, expiresAt });

  const origin = env.ORIGIN ?? 'http://localhost:5173';
  sendEmailVerification({
    to: email,
    name,
    verifyUrl: `${origin}/auth/verify/${verifyToken}`
  }).catch((err) => console.error('[register] verification email error:', err));

  return json({ ok: true });
};
