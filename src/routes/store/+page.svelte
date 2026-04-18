<script lang="ts">
  import { ShoppingBag, Tag, Gift, Shirt, ArrowRight, Wrench } from 'lucide-svelte';
  import WaitlistForm from '$lib/components/marketing/WaitlistForm.svelte';
  import SEO from '$lib/components/layout/SEO.svelte';
  import type { CatalogItem } from './+page.server';

  interface Props {
    data: {
      merch: CatalogItem[];
      bays: CatalogItem[];
      allItems: CatalogItem[];
    };
  }

  const { data }: Props = $props();

  /** Format price from cents to a readable string.
   *  Shows whole dollars for round amounts ($25) and cents for fractional ($9.95). */
  function formatPrice(cents: number, currency = 'USD'): string {
    if (cents === 0) return 'Contact us';
    const hasCents = cents % 100 !== 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0
    }).format(cents / 100);
  }

  /** Pick representative icon for a bay/membership item by name */
  function categoryIcon(name: string) {
    const n = name.toLowerCase();
    if (n.includes('hoist')) return Wrench;
    if (n.includes('detail')) return Tag;
    if (n.includes('gift') || n.includes('credit')) return Gift;
    return ShoppingBag;
  }

  // Placeholder merch with rendered product images
  const placeholderMerch = [
    { key: 'tshirt',  name: 'Club Tee',       desc: 'Heavyweight cotton tee. Logo front chest, "522" on sleeve.' },
    { key: 'snapback', name: 'Flat-Brim Snapback', desc: 'Structured 6-panel with embroidered logo. Adjustable back, pink accent stripe on the brim.' },
    { key: 'patch',   name: 'Iron-On Patch',  desc: '3.5" woven patch with high-density embroidery. Sew or iron on.' },
    { key: 'sticker', name: 'Die-Cut Sticker', desc: 'Weatherproof vinyl die-cut, 4" wide. Goes anywhere.' },
    { key: 'decal',   name: 'Vinyl Decal',    desc: 'Cut vinyl, 6" wide. Car-safe adhesive, outdoor rated.' },
  ];

  const hasMerch = data.merch.length > 0;
  const hasBays = data.bays.length > 0;
</script>

<svelte:head>
  <SEO title="Shop" description="Wrench Club merch and bay credits. Tees, hats, patches, stickers, and gift cards — sold through our Square store." url="https://thewrench.club/store" />
  <meta name="description" content="Wrench Club merch — tees, hats, and bay credits. Powered by Square POS." />
</svelte:head>

<!-- Page Header -->
<div class="page-header">
  <div class="container mx-auto px-6">
    <p class="overline">Wrench Club Store</p>
    <h1 class="page-title font-display">Gear for<br />Gearheads</h1>
    <p class="page-sub">
      Tees, hats, and bay credits — all sold through our Square store.
      Buy online or pick up at the shop.
    </p>
  </div>
</div>

<!-- Bay & Membership Pricing -->
{#if hasBays}
  <section class="section" style="background: var(--bg-secondary)">
    <div class="container mx-auto px-6">
      <div class="section-header">
        <div class="divider"></div>
        <h2 class="section-title font-display">Bay Rentals &amp; Membership</h2>
        <p class="section-sub">
          All bay time is sold in blocks through Square. Prices are per session unless otherwise noted.
        </p>
      </div>
      <div class="bays-grid">
        {#each data.bays as item}
          {@const Icon = categoryIcon(item.name)}
          {@const isHourly = item.variations.length > 3 && item.variations.every(v => /\d+\s+Hours?/i.test(v.name))}
          {@const cheapest = item.variations.reduce((min, v) => v.priceCents > 0 && v.priceCents < min ? v.priceCents : min, Number.POSITIVE_INFINITY)}
          <div class="bay-card card">
            <div class="bay-icon">
              <Icon size={22} />
            </div>
            <div class="bay-body">
              <h3 class="bay-name">{item.name}</h3>
              {#if item.description}
                <p class="bay-desc">{item.description}</p>
              {/if}
              <div class="variations">
                {#if isHourly && cheapest !== Number.POSITIVE_INFINITY}
                  <div class="variation-row">
                    <span class="variation-name">Hourly · book 1–8 hours</span>
                    <span class="variation-price">From {formatPrice(cheapest, item.variations[0].currency)}/hr</span>
                  </div>
                  <a href="/app/reservations" class="bay-cta">Reserve a Bay <ArrowRight size={14} /></a>
                {:else}
                  {#each item.variations as v}
                    <div class="variation-row">
                      <span class="variation-name">{v.name}</span>
                      <span class="variation-price">{formatPrice(v.priceCents, v.currency)}</span>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>
{/if}

<!-- Merch -->
<section class="section" style="background: {hasBays ? 'var(--bg-primary)' : 'var(--bg-secondary)'}">
  <div class="container mx-auto px-6">
    <div class="section-header">
      <div class="divider"></div>
      <h2 class="section-title font-display">
        {hasMerch ? 'Club Merch' : 'Merch Coming in 2026'}
      </h2>
      {#if !hasMerch}
        <p class="section-sub">
          Our online store launches when Wrench Club opens. Join the waitlist for early access
          to founding member merch drops.
        </p>
      {/if}
    </div>

    {#if hasMerch}
      <div class="items-grid">
        {#each data.merch as item}
          <div class="item-card card">
            <div class="item-icon">
              <Shirt size={22} />
            </div>
            <div class="item-body">
              <h3 class="item-name">{item.name}</h3>
              {#if item.description}
                <p class="item-desc">{item.description}</p>
              {/if}
              <div class="variations">
                {#each item.variations as v}
                  <div class="variation-row">
                    <span class="variation-name">{v.name}</span>
                    <span class="variation-price">{formatPrice(v.priceCents, v.currency)}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="items-grid">
        {#each placeholderMerch as item}
          <div class="item-card card placeholder">
            <div class="merch-render">
              <img
                src="/assets/merch/{item.key}.webp"
                alt="{item.name} product render"
                class="merch-img"
                loading="lazy"
                width="800"
                height="800"
              />
            </div>
            <div class="item-body">
              <h3 class="item-name">{item.name}</h3>
              <p class="item-desc">{item.desc}</p>
            </div>
            <div class="coming-badge"><span>Coming 2026</span></div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Gift Card callout -->
    <div class="gift-callout">
      <div class="gift-icon">
        <Gift size={28} style="color: var(--accent);" />
      </div>
      <div>
        <h3 class="gift-title font-display">Bay Credits Make the Best Gift</h3>
        <p class="gift-desc">
          Know a car enthusiast who doesn't have a lift? Bay credits work for any bay type,
          never expire, and are redeemable through our booking system.
          Gift cards sold in any denomination — contact us to arrange.
        </p>
        <a
          href="mailto:info@thewrench.club?subject=Bay Credit Gift Card"
          class="btn btn-outline mt-4 inline-flex"
        >
          Inquire About Gift Cards <ArrowRight size={16} />
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Waitlist -->
<section id="waitlist" class="section" style="background: var(--bg-primary)">
  <div class="container mx-auto px-6">
    <div class="cta-inner">
      <div>
        <div class="divider"></div>
        <h2 class="section-title font-display">Get Notified<br />at Launch</h2>
        <p style="color: var(--text-secondary); margin-top: 0.75rem; font-size: 1.0625rem; line-height: 1.7;">
          Join the waitlist to be first to know when the store goes live — and when
          Wrench Club opens its doors in 2026.
        </p>
      </div>
      <div class="form-wrap">
        <WaitlistForm />
      </div>
    </div>
  </div>
</section>

<style>
  .page-header {
    padding-top: 8rem;
    padding-bottom: 4rem;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border);
  }

  .overline {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1rem;
  }

  .page-title {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 900;
    line-height: 1.05;
    color: var(--text-primary);
    margin-bottom: 1.25rem;
  }

  .page-sub {
    font-size: 1.0625rem;
    color: var(--text-secondary);
    max-width: 560px;
    line-height: 1.7;
  }

  .section {
    padding: 5rem 0;
  }

  .section-header {
    margin-bottom: 2.5rem;
  }

  .section-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    line-height: 1.1;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
  }

  .section-sub {
    font-size: 1.0625rem;
    color: var(--text-secondary);
    line-height: 1.7;
    max-width: 580px;
  }

  /* Bay cards */
  .bays-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
  }

  .bay-card {
    padding: 1.5rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .bay-icon {
    width: 44px;
    height: 44px;
    border-radius: 0.625rem;
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    flex-shrink: 0;
  }

  .bay-body {
    flex: 1;
  }

  .bay-name {
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.375rem;
  }

  .bay-desc {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 0 0.875rem;
  }

  /* Merch cards */
  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .item-card {
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .item-card.placeholder {
    padding: 0;
    overflow: hidden;
  }

  .item-card.placeholder .item-body {
    padding: 1.25rem 1.75rem 0;
  }

  .item-card.placeholder .coming-badge {
    padding: 0 1.75rem 1.5rem;
  }

  .merch-render {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--bg-elevated);
  }

  .merch-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  .item-card.placeholder:hover .merch-img {
    transform: scale(1.03);
  }

  .item-icon {
    width: 52px;
    height: 52px;
    border-radius: 0.75rem;
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
  }

  .item-body {
    flex: 1;
  }

  .item-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.375rem;
  }

  .item-desc {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.65;
    margin: 0;
  }

  /* Shared variation table */
  .variations {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-top: 0.75rem;
  }

  .variation-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    padding: 0.375rem 0;
    border-bottom: 1px solid var(--border);
  }

  .variation-row:last-child {
    border-bottom: none;
  }

  .variation-name {
    color: var(--text-secondary);
  }

  .variation-price {
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .bay-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.625rem;
    padding: 0.375rem 0;
    color: var(--accent-text);
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.15s, transform 0.15s;
  }
  .bay-cta:hover {
    color: var(--text-primary);
    transform: translateX(2px);
  }

  .coming-badge {
    margin-top: auto;
    display: inline-flex;
  }

  .coming-badge span {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* Gift card callout */
  .gift-callout {
    display: flex;
    gap: 1.75rem;
    align-items: flex-start;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
  }

  .gift-icon {
    width: 56px;
    height: 56px;
    border-radius: 0.75rem;
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .gift-title {
    font-size: 1.375rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
  }

  .gift-desc {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.7;
    margin: 0;
  }

  /* Waitlist CTA */
  .cta-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: center;
  }

  .form-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
  }

  @media (max-width: 768px) {
    .cta-inner {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }

    .gift-callout {
      flex-direction: column;
    }
  }
</style>
