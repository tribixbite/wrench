import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';

/**
 * Layout-wide server data:
 *   - `user`    — session user (or null), used by Header, app guards, etc.
 *   - `buildId` — short git SHA from Railway's auto-injected env var, used as
 *                 `data-tag` on the analytics tracker so events can be
 *                 segmented by deploy. Empty in dev/local. Server-only env
 *                 var so we can't read it from Analytics.svelte directly;
 *                 plumbing it through layout data is the SvelteKit-idiomatic
 *                 way to expose a private env var to a client-rendered tag.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  const sha = env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? '';
  return { user: locals.user, buildId: sha };
};
