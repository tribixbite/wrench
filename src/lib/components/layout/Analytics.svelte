<script lang="ts">
  /**
   * Umami analytics tracker — privacy-friendly, no-cookie pageview tracking.
   *
   * Renders a deferred <script> tag pointing at our self-hosted Umami when both
   * required env vars are set. Stays silent in dev/preview where the vars are
   * unset.
   *
   * Defense-in-depth via two attributes:
   *   - `data-domains` (PUBLIC_UMAMI_DOMAINS): client-side hostname allowlist.
   *     Even if env vars get accidentally copied to staging/preview, beacons
   *     never leave the browser unless the page hostname matches.
   *   - `data-do-not-track`: honors the browser DNT signal. Costs ~2-5%
   *     coverage but matches our "privacy-first, no cookie banner" stance.
   *
   * The script src + host-url default to a same-origin proxy at `/_a/...` so
   * adblockers can't filter on Umami's domain or URL pattern. The proxy lives
   * in `src/routes/_a/` and forwards to the env-configured Umami upstream.
   *
   * Umami auto-tracks SPA navigation via pushState/popstate, so SvelteKit's
   * client-side route changes are captured without extra code.
   *
   * Set on Railway (production):
   *   PUBLIC_UMAMI_SRC         = /_a/script.js                    (same-origin proxy)
   *   PUBLIC_UMAMI_HOST_URL    = /_a                              (beacons go here)
   *   PUBLIC_UMAMI_WEBSITE_ID  = <uuid from Umami "Settings → Websites">
   *   PUBLIC_UMAMI_DOMAINS     = wrenchclub.com                   (optional, CSV)
   *
   * `buildId` (short git SHA) comes in as a prop from the root layout's
   * server load — Railway injects RAILWAY_GIT_COMMIT_SHA at deploy time,
   * which is server-only. Plumbing it as page data is the SvelteKit
   * idiomatic way to surface a private env var on a client-rendered tag.
   */

  import { env } from '$env/dynamic/public';

  interface Props {
    /** Short git SHA tagged on every event for per-deploy segmentation. */
    buildId?: string;
  }
  const { buildId = '' }: Props = $props();

  const src        = env.PUBLIC_UMAMI_SRC;
  const websiteId  = env.PUBLIC_UMAMI_WEBSITE_ID;
  const hostUrl    = env.PUBLIC_UMAMI_HOST_URL;
  const domains    = env.PUBLIC_UMAMI_DOMAINS;
  const enabled    = !!(src && websiteId);

  // Defense-in-depth: scrub quote/angle chars before interpolating into the
  // raw <script> tag below. Operator-controlled via Railway env, not user
  // input — but this keeps the @html boundary tidy regardless.
  const clean = (v: string | undefined) => (v ?? '').replace(/["<>]/g, '');

  const safeSrc      = clean(src);
  const safeId       = clean(websiteId);
  const safeHost     = clean(hostUrl);
  const safeDomains  = clean(domains);
  // Tag length capped to keep the data clean — short SHAs, version strings, etc.
  const safeTag      = clean(buildId).slice(0, 32);

  const hostAttr     = safeHost    ? ` data-host-url="${safeHost}"` : '';
  const domainsAttr  = safeDomains ? ` data-domains="${safeDomains}"` : '';
  const tagAttr      = safeTag     ? ` data-tag="${safeTag}"` : '';
</script>

<svelte:head>
  {#if enabled}
    {@html `<script defer src="${safeSrc}" data-website-id="${safeId}" data-do-not-track="true"${hostAttr}${domainsAttr}${tagAttr}></script>`}
  {/if}
</svelte:head>
