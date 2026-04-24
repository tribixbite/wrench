/**
 * Pre-launch sign-up gate. Lets the team restrict who can register or log in
 * via the AUTH_ALLOWLIST env var (comma-separated emails, case-insensitive).
 *
 * Empty/unset → open mode (current dev/staging behavior).
 * Set → only listed emails are accepted; everyone else gets a friendly
 *        "join the waitlist" message.
 */
import { env } from '$env/dynamic/private';

/** Returns true if the email may register or authenticate. */
export function isAllowedEmail(email: string): boolean {
  const list = (env.AUTH_ALLOWLIST ?? '').trim();
  if (!list) return true;
  const allowed = list.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

/** Returns true if any allowlist is in effect. */
export function isAllowlistActive(): boolean {
  return (env.AUTH_ALLOWLIST ?? '').trim().length > 0;
}

/** Public-facing message shown when registration is denied. */
export const ALLOWLIST_DENY_MSG =
  "Member sign-ups aren't open yet. Join the waitlist below and we'll email you when accounts go live.";
