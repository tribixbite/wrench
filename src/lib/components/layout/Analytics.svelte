<script lang="ts">
  /**
   * Umami analytics tracker — privacy-friendly, no-cookie pageview tracking.
   *
   * Renders a deferred <script> tag pointing at our self-hosted Umami when both
   * env vars are set. Stays silent in dev/preview where the vars are unset.
   *
   * Umami auto-tracks SPA navigation via pushState/popstate, so SvelteKit's
   * client-side route changes are captured without extra code.
   *
   * Set on Railway (production):
   *   PUBLIC_UMAMI_SRC         = https://<umami-host>/script.js
   *   PUBLIC_UMAMI_WEBSITE_ID  = <uuid from Umami "Settings → Websites">
   */

  import { env } from '$env/dynamic/public';

  const src = env.PUBLIC_UMAMI_SRC;
  const websiteId = env.PUBLIC_UMAMI_WEBSITE_ID;
  const enabled = !!(src && websiteId);

  // Defense-in-depth: scrub any quote chars before interpolating into the
  // script tag below. Both values are operator-controlled via Railway env,
  // not user input — but this keeps the @html boundary tidy regardless.
  const safeSrc = (src ?? '').replace(/["<>]/g, '');
  const safeId = (websiteId ?? '').replace(/["<>]/g, '');
</script>

<svelte:head>
  {#if enabled}
    {@html `<script defer src="${safeSrc}" data-website-id="${safeId}"></script>`}
  {/if}
</svelte:head>
