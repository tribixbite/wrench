<script lang="ts">
  /**
   * Canonical SEO / Open Graph / Twitter Card meta block.
   *
   * Place inside <svelte:head> on every page. Renders:
   *   - <title>
   *   - og:title, og:description, og:url, og:image (+alt, type, dimensions)
   *   - og:type  (default "website")
   *   - twitter:card, twitter:title, twitter:description, twitter:image
   *
   * Defaults to Wrench Club brand values — override per-page as needed.
   */

  const SITE     = 'Wrench Club';
  const BASE_URL = 'https://thewrench.club';
  const DEFAULT_DESC =
    "West Michigan's premier membership-based DIY auto shop. Members rent hoist bays, flat bays, " +
    'and a detail bay with access to a full tool library. Opening 2026 in Grand Rapids, MI.';
  const DEFAULT_IMG      = `${BASE_URL}/og-discord.webp`;
  const DEFAULT_IMG_PNG  = `${BASE_URL}/og-discord.webp`; // Discord supports WebP; PNG only needed for Twitter/X
  const DEFAULT_IMG_W    = 1200;
  const DEFAULT_IMG_H    = 630;
  const DEFAULT_IMG_ALT  = 'Wrench Club — DIY auto shop, Grand Rapids MI';

  interface Props {
    /** Page title — appended with " — Wrench Club" automatically */
    title?: string;
    /** Overrides the default meta description */
    description?: string;
    /** Canonical URL for this page (default: BASE_URL) */
    url?: string;
    /** OG image URL (absolute). Defaults to og-discord.webp */
    image?: string;
    /** Static PNG fallback for Twitter/X (falls back to og-discord.png) */
    imagePng?: string;
    /** Alt text for og:image */
    imageAlt?: string;
    /** Image pixel width */
    imageWidth?: number;
    /** Image pixel height */
    imageHeight?: number;
    /** og:type — typically "website" or "article" */
    type?: string;
    /** When true, prevent search engine indexing (e.g. /app/* pages) */
    noindex?: boolean;
  }

  const {
    title,
    description = DEFAULT_DESC,
    url = BASE_URL,
    image = DEFAULT_IMG,
    imagePng = DEFAULT_IMG_PNG,
    imageAlt = DEFAULT_IMG_ALT,
    imageWidth = DEFAULT_IMG_W,
    imageHeight = DEFAULT_IMG_H,
    type = 'website',
    noindex = false,
  }: Props = $props();

  const fullTitle = title ? `${title} — ${SITE}` : `${SITE} — West Michigan's Premier DIY Auto Shop`;
</script>

<svelte:head>
  <title>{fullTitle}</title>
  {#if noindex}
    <meta name="robots" content="noindex" />
  {/if}

  <!-- Open Graph -->
  <meta property="og:site_name" content={SITE} />
  <meta property="og:type"      content={type} />
  <meta property="og:url"       content={url} />
  <meta property="og:title"     content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:image"        content={image} />
  <meta property="og:image:type"   content="image/webp" />
  <meta property="og:image:width"  content={String(imageWidth)} />
  <meta property="og:image:height" content={String(imageHeight)} />
  <meta property="og:image:alt"    content={imageAlt} />

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content={fullTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image"       content={imagePng} />
</svelte:head>
