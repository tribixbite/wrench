import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { waitlist } from '$lib/server/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { sendWaitlistConfirmation } from '$lib/server/email';
import { WaitlistPostBody } from '$lib/schemas/api';

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = WaitlistPostBody.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Normalise email to lowercase — Zod validates format, we normalise here
  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name?.trim() ?? null;

  // Check for existing entry
  const existing = await db.select().from(waitlist).where(eq(waitlist.email, email)).limit(1);
  if (existing.length > 0) {
    return json({ message: "You're already on the list! We'll be in touch." }, { status: 200 });
  }

  await db.insert(waitlist).values({
    id: nanoid(),
    email,
    name: name || null
  });

  // Non-blocking — email failure must not break the signup response
  sendWaitlistConfirmation({ to: email, name }).catch((err) =>
    console.error('[waitlist] email error:', err)
  );

  return json(
    { message: "You're on the list! We'll reach out when Wrench Club opens in 2026." },
    { status: 201 }
  );
};
