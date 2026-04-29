<script lang="ts">
  /**
   * Umami analytics tracker — privacy-friendly, no-cookie pageview tracking.
   *
   * Renders a deferred <script> tag pointing at our self-hosted Umami when both
   * required env vars are set. Stays silent in dev/preview where the vars are
   * unset. The tracker also self-filters by hostname: if PUBLIC_UMAMI_DOMAINS
   * is set, Umami only fires beacons when window.location.hostname matches
   * one of the listed domains. This prevents staging/preview/local hostnames
   * from polluting prod analytics if env vars ever get copied across.
   *
   * Umami auto-tracks SPA navigation via pushState/popstate, so SvelteKit's
   * client-side route changes are captured without extra code.
   *
   * Set on Railway (production):
   *   PUBLIC_UMAMI_SRC         = https://<umami-host>/script.js
   *   PUBLIC_UMAMI_WEBSITE_ID  = <uuid from Umami "Settings → Websites">
   *   PUBLIC_UMAMI_DOMAINS     = wrenchclub.com         (optional, comma-separated)
   */

  import { env } from '$env/dynamic/public';

  const src = env.PUBLIC_UMAMI_SRC;
  const websiteId = env.PUBLIC_UMAMI_WEBSITE_ID;
  const domains = env.PUBLIC_UMAMI_DOMAINS;
  const enabled = !!(src && websiteId);

  // Defense-in-depth: scrub any quote/angle chars before interpolating into
  // the script tag below. Values are operator-controlled via Railway env,
  // not user input — but this keeps the @html boundary tidy regardless.
  const safeSrc = (src ?? '').replace(/["<>]/g, '');
  const safeId = (websiteId ?? '').replace(/["<>]/g, '');
  const safeDomains = (domains ?? '').replace(/["<>]/g, '');
  const domainsAttr = safeDomains ? ` data-domains="${safeDomains}"` : '';
</script>

<svelte:head>
  {#if enabled}
    {@html `<script defer src="${safeSrc}" data-website-id="${safeId}"${domainsAttr}></script>`}
  {/if}
</svelte:head>
