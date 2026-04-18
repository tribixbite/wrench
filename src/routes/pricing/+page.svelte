<script lang="ts">
  import { Zap, Calendar, Clock, ArrowRight, CheckCircle2, Info } from 'lucide-svelte';
  import WaitlistForm from '$lib/components/marketing/WaitlistForm.svelte';
  import SEO from '$lib/components/layout/SEO.svelte';

  const bayTypes = [
    {
      id: 'flat',
      icon: '🔧',
      name: 'Flat Bay',
      description: 'Ground-level workspace with your own tool cart. Perfect for maintenance, inspections, and jobs that don\'t require a lift.',
      features: [
        'Personal tool cart and workstation',
        'Air tool hookup',
        'Drain pan and spill containment',
        'Bright overhead lighting',
        'Wi-Fi + Bluetooth speaker'
      ],
      rate: '$25',
      rateUnit: '/ hour',
      rateSecondary: 'Book 1–8 hours · 3 bays available',
      rateNote: 'Hourly · Linear pricing'
    },
    {
      id: 'detail',
      icon: '✨',
      name: 'Detail Bay',
      description: 'Dedicated wash and detail station with hot water, chemicals, and equipment to bring your vehicle to showroom condition.',
      features: [
        'Hot and cold water supply',
        'Pressure washer access',
        'Detail supplies and chemicals',
        'Foam cannon and wash equipment',
        'Drying area and microfiber supply'
      ],
      rate: '$30',
      rateUnit: '/ hour',
      rateSecondary: 'Book 1–8 hours · 1 bay available',
      rateNote: 'Hourly · Linear pricing'
    },
    {
      id: 'hoist',
      icon: '⬆️',
      name: 'Hoist Bay',
      description: 'Two-post lift or drive-on hoist, set up and operated by our staff. The right tool for any underbody work.',
      features: [
        'Employee-operated 2-post or drive-on lift',
        'Staff assist for safe vehicle positioning',
        'Full tool access and air supply',
        'Brake cleaner, shop rags included',
        'Priority booking for members'
      ],
      rate: '$35',
      rateUnit: '/ hour',
      rateSecondary: 'Book 1–8 hours · 2 bays available',
      rateNote: 'Hourly · Linear pricing',
      featured: true
    }
  ];

  const membershipPerks = [
    'Access to clubhouse and lounge',
    'Online scheduling system',
    'Tool library access (all specialty tools)',
    'Priority bay booking',
    'Negotiated parts discounts',
    'Member-only events and car shows',
    'Racing simulator access',
    'Community forum and resources'
  ];
</script>

<svelte:head>
  <SEO title="Pricing" description="Transparent bay rental and membership pricing for Wrench Club — Grand Rapids' members-only DIY auto shop. Hoist, flat, and detail bay rates." url="https://thewrench.club/pricing" />
  <meta name="description" content="Transparent bay and membership pricing at Wrench Club — Grand Rapids, MI. Flat bays, hoist bays, and detail bays available by the hour, day, or month." />
</svelte:head>

<!-- Page Header -->
<div class="page-header">
  <div class="container mx-auto px-6">
    <p class="overline">Transparent Pricing</p>
    <h1 class="page-title font-display">A Gym Membership<br />for Car Enthusiasts.</h1>
    <p class="page-sub">
      Membership gets you in the door at $9.95/month. Bay time is booked and billed separately —
      you only pay for the hours you use.
    </p>
    <div class="pricing-notice">
      <Info size={16} style="color: var(--accent); flex-shrink: 0; margin-top: 2px;" />
      <span>
        Rates shown are launch pricing. Join the waitlist for opening updates and member onboarding.
      </span>
    </div>
  </div>
</div>

<!-- Bay Types -->
<section class="section" style="background: var(--bg-secondary)">
  <div class="container mx-auto px-6">
    <div class="section-header">
      <div class="divider"></div>
      <h2 class="section-title font-display">Bay Types & Rates</h2>
      <p class="section-sub">Choose the workspace that fits your job. All bays include tool cart access, air supply, and facility amenities.</p>
    </div>

    <div class="bays-grid">
      {#each bayTypes as bay}
        <div class="bay-card card" class:featured={bay.featured}>
          {#if bay.featured}
            <div class="featured-badge">Most Popular</div>
          {/if}
          <div class="bay-card-inner">
            <div class="bay-icon">{bay.icon}</div>
            <h3 class="bay-name font-display">{bay.name}</h3>
            <p class="bay-desc">{bay.description}</p>

            <div class="bay-rate">
              <span class="rate-label font-mono-spec">{bay.rateNote}</span>
              <span class="rate-value font-display">
                {bay.rate}<span class="rate-unit">{bay.rateUnit ?? ''}</span>
              </span>
              {#if bay.rateSecondary}
                <span class="rate-secondary font-mono-spec">{bay.rateSecondary}</span>
              {/if}
            </div>

            <ul class="bay-features">
              {#each bay.features as feat}
                <li>
                  <CheckCircle2 size={15} style="color: var(--accent); flex-shrink: 0;" />
                  {feat}
                </li>
              {/each}
            </ul>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Membership -->
<section class="section" style="background: var(--bg-primary)">
  <div class="container mx-auto px-6">
    <div class="membership-wrap">
      <div class="membership-copy">
        <div class="divider"></div>
        <h2 class="section-title font-display">Membership</h2>
        <p style="color: var(--text-secondary); font-size: 1.0625rem; line-height: 1.7; margin-bottom: 1.5rem;">
          Your monthly membership covers access to the entire facility, clubhouse, and scheduling
          system. Bay time is booked and billed separately at the per-use rates above — you pay
          only for the hours you use.
        </p>
        <p style="color: var(--text-secondary); font-size: 1.0625rem; line-height: 1.7; margin-bottom: 2rem;">
          Think of it like a gym membership — the base membership gets you in the door. Bay time
          is your "personal training session" billed on top.
        </p>

        <div class="membership-rate">
          <span class="rate-label font-mono-spec">Monthly Membership</span>
          <span class="rate-value-lg font-display">$9.95<span class="rate-unit">/ month</span></span>
          <span class="rate-note">One-time $9.95 activation fee. Cancel anytime.</span>
        </div>
      </div>

      <div class="membership-perks">
        <h3 class="perks-title">Included with Membership</h3>
        <ul class="perks-list">
          {#each membershipPerks as perk}
            <li>
              <CheckCircle2 size={16} style="color: var(--accent);" />
              {perk}
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- Booking Options -->
<section class="section" style="background: var(--bg-secondary)">
  <div class="container mx-auto px-6">
    <div class="section-header">
      <div class="divider"></div>
      <h2 class="section-title font-display">How Booking Works</h2>
    </div>

    <div class="booking-grid">
      <div class="booking-option">
        <Clock size={28} style="color: var(--accent); margin-bottom: 1rem;" />
        <h3>Hourly</h3>
        <p>Book a bay for as little as one hour. Perfect for a quick oil change or inspection.</p>
      </div>
      <div class="booking-option">
        <Calendar size={28} style="color: var(--accent); margin-bottom: 1rem;" />
        <h3>Daily</h3>
        <p>Reserve a bay for the full day. Great for bigger jobs or when you want uninterrupted time.</p>
      </div>
      <div class="booking-option">
        <Zap size={28} style="color: var(--accent); margin-bottom: 1rem;" />
        <h3>Weekly / Monthly</h3>
        <p>Extended-term options for active project builds or regular maintenance schedules.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section id="waitlist" class="section waitlist-cta" style="background: var(--bg-primary)">
  <div class="container mx-auto px-6">
    <div class="waitlist-inner">
      <div>
        <div class="divider"></div>
        <h2 class="section-title font-display">Ready to Join<br />the Club?</h2>
        <p style="color: var(--text-secondary); margin-top: 0.75rem;">
          Add your email to the waitlist. We'll send opening updates, onboarding details, and
          first pick of the bay schedule when Wrench Club opens in 2026.
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
    max-width: 580px;
    line-height: 1.7;
    margin-bottom: 1.5rem;
  }

  .pricing-notice {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    border-radius: 0.625rem;
    padding: 1rem 1.25rem;
    max-width: 600px;
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  /* Bay cards */
  .section-header {
    margin-bottom: 3rem;
    max-width: 640px;
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
  }

  .bays-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .bay-card {
    position: relative;
  }

  .bay-card.featured {
    border-color: var(--accent-border);
    background: var(--bg-elevated);
  }

  .featured-badge {
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.875rem;
    border-radius: 0 0 0.5rem 0.5rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .bay-card-inner {
    padding: 2rem;
  }

  .bay-card.featured .bay-card-inner {
    padding-top: 2.5rem;
  }

  .bay-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .bay-name {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 0.625rem;
  }

  .bay-desc {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.65;
    margin-bottom: 1.5rem;
  }

  .bay-rate {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    border: 1px solid var(--border);
  }

  .rate-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .rate-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }

  .rate-unit {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted);
    margin-left: 0.25rem;
    letter-spacing: 0;
  }

  .rate-secondary {
    font-size: 0.8125rem;
    color: var(--accent-text);
    margin-top: 0.25rem;
  }

  .bay-features {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .bay-features li {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  /* Membership */
  .membership-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: start;
  }

  @media (max-width: 768px) {
    .membership-wrap {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }
  }

  .membership-rate {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .rate-value-lg {
    font-size: 2.5rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
  }

  .rate-note {
    font-size: 0.875rem;
    color: var(--accent);
  }

  .membership-perks {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.875rem;
    padding: 2rem;
  }

  .perks-title {
    font-weight: 700;
    font-size: 1rem;
    color: var(--text-primary);
    margin-bottom: 1.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.8125rem;
  }

  .perks-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .perks-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9375rem;
    color: var(--text-secondary);
  }

  /* Booking */
  .booking-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  @media (max-width: 768px) {
    .booking-grid {
      grid-template-columns: 1fr;
    }
  }

  .booking-option {
    padding: 2rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.875rem;
  }

  .booking-option h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.625rem;
  }

  .booking-option p {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.65;
    margin: 0;
  }

  /* Waitlist CTA */
  .waitlist-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: center;
  }

  @media (max-width: 768px) {
    .waitlist-inner {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }
  }

  .form-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
  }
</style>
