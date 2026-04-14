import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { waitlist } from '$lib/server/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request }) => {
  let body: { email?: unknown; name?: unknown };

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : null;

  if (!email || !EMAIL_RE.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

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

  return json(
    { message: "You're on the list! We'll reach out when Wrench Club opens in 2026." },
    { status: 201 }
  );
};
