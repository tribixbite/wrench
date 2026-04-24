/**
 * Feature flags — readable from server and client.
 * All flags default to "off" so behaviour is unchanged when vars are unset.
 */
import { env } from '$env/dynamic/public';

/**
 * Hide every user-visible mention of the Detail Bay until the zoning hearing
 * clears car-wash use. Keeps the Square catalog + team member intact — just
 * suppresses it in the UI, SEO copy, and transactional emails.
 *
 * Set `PUBLIC_HIDE_DETAIL_BAY=true` on the Railway env to enable.
 */
export const HIDE_DETAIL_BAY =
  (env.PUBLIC_HIDE_DETAIL_BAY ?? '').toLowerCase() === 'true';
