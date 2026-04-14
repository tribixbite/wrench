<script lang="ts">
  import { ShoppingBag, Tag, Gift, Shirt, ArrowRight } from 'lucide-svelte';
  import WaitlistForm from '$lib/components/marketing/WaitlistForm.svelte';

  const items = [
    {
      icon: Shirt,
      name: 'Wrench Club Tees',
      desc: 'Premium heavyweight cotton tees with the Wrench Club logo. Rep the club.',
      status: 'coming-soon'
    },
    {
      icon: ShoppingBag,
      name: 'Hats & Headwear',
      desc: 'Structured snapbacks and dad hats. Club logo embroidered, not printed.',
      status: 'coming-soon'
    },
    {
      icon: Gift,
      name: 'Gift Cards & Bay Credits',
      desc: 'Give the gift of shop time. Bay credits never expire and work for any bay type.',
      status: 'coming-soon'
    }
  ];
</script>

<svelte:head>
  <title>Shop — Wrench Club</title>
  <meta name="description" content="Wrench Club merch — tees, hats, and gift cards. Powered by Square POS. Coming 2026." />
</svelte:head>

<!-- Page Header -->
<div class="page-header">
  <div class="container mx-auto px-6">
    <p class="overline">Wrench Club Store</p>
    <h1 class="page-title font-display">Gear for<br />Gearheads</h1>
    <p class="page-sub">
      Tees, hats, and bay credits. All Wrench Club merch is sold through our Square store —
      buy online or pick up at the shop.
    </p>
  </div>
</div>

<!-- Coming Soon Grid -->
<section class="section" style="background: var(--bg-secondary)">
  <div class="container mx-auto px-6">
    <div class="section-header">
      <div class="divider"></div>
      <h2 class="section-title font-display">Store Opening with the Club</h2>
      <p class="section-sub">
        Our online store launches when Wrench Club opens in 2026. Join the waitlist to be
        notified and get early access to founding member merch.
      </p>
    </div>

    <div class="items-grid">
      {#each items as item}
        <div class="item-card card">
          <div class="item-icon">
            <item.icon size={24} />
          </div>
          <div class="item-body">
            <h3 class="item-name">{item.name}</h3>
            <p class="item-desc">{item.desc}</p>
          </div>
          <div class="coming-badge">
            <span>Coming 2026</span>
          </div>
        </div>
      {/each}
    </div>

    <!-- Gift Card callout -->
    <div class="gift-callout">
      <div class="gift-icon">
        <Gift size={28} style="color: var(--accent);" />
      </div>
      <div>
        <h3 class="gift-title font-display">Bay Credits Make the Best Gift</h3>
        <p class="gift-desc">
          Know a car enthusiast who doesn't have a lift? Bay credits work for any bay type,
          never expire, and are redeemable via our online booking system. Gift cards sold in
          any denomination — contact us to arrange before the store launches.
        </p>
        <a href="mailto:info@wrenchclub.com?subject=Bay Credit Gift Card" class="btn btn-outline mt-4 inline-flex">
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

  .section-header {
    margin-bottom: 3rem;
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
    position: relative;
    overflow: visible;
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

  .cta-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: center;
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

  .form-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
  }
</style>
