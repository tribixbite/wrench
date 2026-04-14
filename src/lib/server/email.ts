/**
 * Transactional email via Resend.
 * Set RESEND_API_KEY in .env to enable. If absent, emails are silently skipped
 * so the app remains functional without the key during development.
 */
import { env } from '$env/dynamic/private';

interface WaitlistConfirmationData {
  to: string;
  name?: string | null;
}

interface RegistrationWelcomeData {
  to: string;
  name: string;
}

interface EmailVerificationData {
  to: string;
  name: string;
  /** Full URL including token — e.g. https://wrenchclub.com/auth/verify/abc123 */
  verifyUrl: string;
}

const FROM = 'Wrench Club <hello@wrenchclub.com>';

async function send(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    // Non-fatal: log in dev, silently skip in prod until key is configured
    console.log('[email] RESEND_API_KEY not set — skipping email to', payload.to);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[email] Resend error:', res.status, text);
    // Non-fatal — don't throw, email failure must not break the user flow
  }
}

/** Confirmation email sent when someone joins the waitlist. */
export async function sendWaitlistConfirmation({ to, name }: WaitlistConfirmationData) {
  const greeting = name ? `Hey ${name.split(' ')[0]},` : 'Hey,';

  await send({
    from: FROM,
    to,
    subject: "You're on the Wrench Club waitlist",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="margin-bottom:32px;">
      <span style="font-size:1.5rem;font-weight:900;color:#ED0C85;letter-spacing:-0.02em;">WRENCH CLUB</span>
    </div>
    <h1 style="color:#f8f8f8;font-size:1.75rem;font-weight:900;margin:0 0 16px;line-height:1.2;">
      You're on the list.
    </h1>
    <p style="color:#a3a3a3;font-size:1rem;line-height:1.7;margin:0 0 24px;">
      ${greeting}<br><br>
      You're on the Wrench Club waitlist. When we open our doors in 2026, you'll be
      among the first to know — and the first to book a bay.
    </p>
    <div style="background:#141414;border:1px solid #262626;border-radius:12px;padding:24px;margin:0 0 32px;">
      <p style="color:#f8f8f8;font-weight:600;margin:0 0 12px;">What's coming:</p>
      <ul style="color:#a3a3a3;font-size:0.9375rem;line-height:1.8;margin:0;padding-left:20px;">
        <li>Flat bays, hoist bays, and a detail bay</li>
        <li>Full professional tool library</li>
        <li>Member-only community events</li>
        <li>Online bay booking — pay by the hour</li>
      </ul>
    </div>
    <p style="color:#a3a3a3;font-size:0.875rem;line-height:1.6;margin:0 0 32px;">
      In the meantime, check out
      <a href="https://wrenchclub.com" style="color:#ED0C85;text-decoration:none;">wrenchclub.com</a>
      for more details about the club, the founders, and the facility.
    </p>
    <hr style="border:none;border-top:1px solid #262626;margin:0 0 24px;">
    <p style="color:#525252;font-size:0.75rem;margin:0;">
      522 Stocking Ave NW, Grand Rapids, MI 49504<br>
      <a href="mailto:info@wrenchclub.com" style="color:#525252;">info@wrenchclub.com</a>
    </p>
  </div>
</body>
</html>
    `.trim()
  });
}

/** Email address verification link sent after registration. */
export async function sendEmailVerification({ to, name, verifyUrl }: EmailVerificationData) {
  const first = name.split(' ')[0];

  await send({
    from: FROM,
    to,
    subject: 'Verify your Wrench Club email',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="margin-bottom:32px;">
      <span style="font-size:1.5rem;font-weight:900;color:#ED0C85;letter-spacing:-0.02em;">WRENCH CLUB</span>
    </div>
    <h1 style="color:#f8f8f8;font-size:1.75rem;font-weight:900;margin:0 0 16px;line-height:1.2;">
      Verify your email, ${first}.
    </h1>
    <p style="color:#a3a3a3;font-size:1rem;line-height:1.7;margin:0 0 32px;">
      Click below to confirm your email address. This link expires in 24 hours.
    </p>
    <div style="margin:0 0 32px;">
      <a href="${verifyUrl}"
         style="display:inline-block;background:#ED0C85;color:#fff;text-decoration:none;
                font-weight:700;font-size:0.9375rem;padding:14px 32px;border-radius:8px;">
        Verify Email Address →
      </a>
    </div>
    <p style="color:#525252;font-size:0.875rem;line-height:1.6;margin:0 0 24px;">
      Or copy this link into your browser:<br>
      <span style="color:#a3a3a3;word-break:break-all;">${verifyUrl}</span>
    </p>
    <hr style="border:none;border-top:1px solid #262626;margin:0 0 24px;">
    <p style="color:#525252;font-size:0.75rem;margin:0;">
      If you didn't create a Wrench Club account, you can ignore this email.<br>
      522 Stocking Ave NW, Grand Rapids, MI 49504 ·
      <a href="mailto:info@wrenchclub.com" style="color:#525252;">info@wrenchclub.com</a>
    </p>
  </div>
</body>
</html>
    `.trim()
  });
}

/** Welcome email sent on account registration. */
export async function sendRegistrationWelcome({ to, name }: RegistrationWelcomeData) {
  const first = name.split(' ')[0];

  await send({
    from: FROM,
    to,
    subject: 'Welcome to Wrench Club',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="margin-bottom:32px;">
      <span style="font-size:1.5rem;font-weight:900;color:#ED0C85;letter-spacing:-0.02em;">WRENCH CLUB</span>
    </div>
    <h1 style="color:#f8f8f8;font-size:1.75rem;font-weight:900;margin:0 0 16px;line-height:1.2;">
      Welcome, ${first}.
    </h1>
    <p style="color:#a3a3a3;font-size:1rem;line-height:1.7;margin:0 0 24px;">
      Your Wrench Club account is ready. Bay booking opens at launch in 2026 —
      we'll email you the moment scheduling goes live.
    </p>
    <div style="margin:0 0 32px;">
      <a href="https://wrenchclub.com/app/dashboard"
         style="display:inline-block;background:#ED0C85;color:#fff;text-decoration:none;
                font-weight:700;font-size:0.9375rem;padding:12px 28px;border-radius:8px;">
        Go to Your Dashboard →
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #262626;margin:0 0 24px;">
    <p style="color:#525252;font-size:0.75rem;margin:0;">
      522 Stocking Ave NW, Grand Rapids, MI 49504<br>
      <a href="mailto:info@wrenchclub.com" style="color:#525252;">info@wrenchclub.com</a>
    </p>
  </div>
</body>
</html>
    `.trim()
  });
}
