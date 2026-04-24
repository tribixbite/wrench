<script lang="ts">
  import { Wrench, Car, Shield, Users, Zap, CheckCircle2, ArrowRight, MapPin } from 'lucide-svelte';
  import WaitlistForm from '$lib/components/marketing/WaitlistForm.svelte';
  import SEO from '$lib/components/layout/SEO.svelte';
  import { HIDE_DETAIL_BAY } from '$lib/features';

  const features = [
    {
      icon: Wrench,
      title: 'Full Tool Library',
      body: 'Comprehensive selection of specialty tools, air tools, diagnostic equipment, and everything you need to tackle any job—right at your workstation.'
    },
    {
      icon: Car,
      title: 'Employee-Operated Hoists',
      body: 'Professional two-post and drive-on lifts, set up by our staff for every job. Safe, reliable, and zero DIY lift hazards.'
    },
    {
      icon: Shield,
      title: 'No More Driveways',
      body: 'Work smarter, safer, and cleaner in a professional environment—not on a cold garage floor or a sketchy set of jack stands.'
    },
    {
      icon: Users,
      title: 'More Than a Shop',
      body: 'Racing simulators, automotive resources, community events, and a clubhouse full of like-minded gearheads who love this stuff as much as you do.'
    }
  ];

  const uses = [
    { label: 'Routine maintenance', sub: 'Oil changes, fluids, brakes, suspension' },
    { label: 'Vehicle modification', sub: 'Lift kits, exhaust, intakes, and more' },
    { label: 'Restoration projects', sub: 'Full builds or frame-off restores' },
    { label: 'Pre-purchase inspections', sub: "Know exactly what you're buying" },
    ...(HIDE_DETAIL_BAY
      ? []
      : [{ label: 'DIY detailing & washing', sub: 'Proper detail bay with all supplies' }]),
    { label: "Members-only events", sub: 'Car shows, dyno days, meetups' }
  ];

  const pillars = [
    {
      num: '01',
      title: 'Affordability',
      body: 'Membership rates comparable to a gym. Get access to the facility, clubhouse, and scheduling system—bay time billed separately at transparent hourly rates.'
    },
    {
      num: '02',
      title: 'Flexibility',
      body: HIDE_DETAIL_BAY
        ? 'Hoist bays and flat bays. Book by the hour, the day, or the week. Schedule exactly what you need, when you need it, from your phone.'
        : 'Hoist bays, flat bays, detail bay. Book by the hour, the day, or the week. Schedule exactly what you need, when you need it, from your phone.'
    },
    {
      num: '03',
      title: 'Community',
      body: 'A downtown Grand Rapids clubhouse for enthusiasts of every level—from first oil changes to full engine swaps. Dyno days, car shows, member meetups, and more.'
    }
  ];
</script>

<SEO
  description="A membership-based DIY auto shop at 522 Stocking Ave NW, Grand Rapids, MI. Professional hoists, full tool library, and a community built for gearheads. Coming 2026."
/>

<!-- ── HERO ──────────────────────────────────────────────────────────────── -->
<section class="hero">
  <picture class="hero-picture">
    <source srcset="/assets/team-cars-mobile.webp" media="(max-width: 768px)" type="image/webp" />
    <source srcset="/assets/team-cars-desktop.webp" media="(min-width: 769px)" type="image/webp" />
    <img
      src="/assets/team-cars.jpg"
      alt="Wrench Club facility — four daily drivers lined up at 522 Stocking Ave NW"
      class="hero-bg-img"
      width="1416"
      height="1061"
      fetchpriority="high"
    />
  </picture>
  <div class="hero-overlay"></div>

  <div class="hero-content container mx-auto px-6">
    <!-- Location badge -->
    <div class="badge">
      <MapPin size={13} />
      <span>Grand Rapids, MI · Opening 2026</span>
    </div>

    <!-- Headline -->
    <h1 class="hero-headline font-display">
      West Michigan's Premier<br />
      <span class="text-gradient">Do-It-Yourself</span><br />
      Auto Shop
    </h1>

    <p class="hero-sub">
      From oil changes to engine swaps. If you can dream it,<br class="hidden sm:block" />
      you can do it at Wrench Club.
    </p>

    <!-- CTAs -->
    <div class="hero-ctas">
      <a href="#waitlist" class="btn btn-primary btn-lg">
        Join the Waitlist
        <ArrowRight size={18} />
      </a>
      <a href="/pricing" class="btn btn-ghost btn-lg">
        See Pricing
      </a>
    </div>

    <!-- Scroll indicator -->
    <div class="scroll-hint" aria-hidden="true">
      <div class="scroll-dot"></div>
    </div>
  </div>
</section>

<!-- ── WHAT IS WRENCH CLUB ────────────────────────────────────────────── -->
<section class="section" style="background: var(--bg-secondary)">
  <div class="container mx-auto px-6">
    <div class="section-header">
      <div class="divider"></div>
      <h2 class="section-title font-display">What Is Wrench Club?</h2>
      <p class="section-sub">
        A fully-equipped do-it-yourself garage club. Members book a hoist or flat bay with access
        to their own tool cart and workstation — everything you need, nothing you don't.
      </p>
    </div>

    <div class="features-grid">
      {#each features as feat}
        <div class="feature-card card">
          <div class="feat-icon">
            <feat.icon size={22} />
          </div>
          <h3 class="feat-title">{feat.title}</h3>
          <p class="feat-body">{feat.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ── MEMBERSHIP USES ────────────────────────────────────────────────── -->
<section class="section" style="background: var(--bg-primary)">
  <div class="container mx-auto px-6">
    <div class="section-header">
      <div class="divider"></div>
      <h2 class="section-title font-display">What Can I Use My Membership For?</h2>
      <p class="section-sub">
        Wrench Club is built for everyday car owners and serious enthusiasts alike.
        Your membership unlocks the whole facility.
      </p>
    </div>

    <div class="uses-grid">
      {#each uses as use}
        <div class="use-item">
          <CheckCircle2 size={20} style="color: var(--accent); flex-shrink: 0; margin-top: 2px;" />
          <div>
            <p class="use-label">{use.label}</p>
            <p class="use-sub">{use.sub}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ── WHAT MAKES IT A CLUB ───────────────────────────────────────────── -->
<section class="section club-section" style="background: var(--bg-secondary)">
  <div class="container mx-auto px-6">
    <div class="club-inner">
      <div class="club-text">
        <div class="divider"></div>
        <h2 class="section-title font-display">What Makes It a "Club"?</h2>
        <p class="club-body">
          Built around community, safety, and shared responsibility. Wrench Club is
          membership-based — not a public drop-in shop.
        </p>
        <p class="club-body">
          Every member completes a facility orientation covering equipment operation,
          safety protocols, and workspace standards. The people working next to you
          know what they're doing, and you will too.
        </p>
        <blockquote class="club-quote">
          "We're not just renting you a bay. We're giving you a professional shop,
          a community of people who love cars, and everything you need to do the work right."
          <cite>— Coleman Brook, Co-founder</cite>
        </blockquote>
      </div>
      <div class="club-visual">
        <img
          src="/assets/bmw.jpg"
          alt="Coleman's BMW M760xi at Wrench Club facility — 522 Stocking Ave NW"
          class="club-img"
          width="800"
          height="600"
          loading="lazy"
        />
        <div class="club-img-badge">
          <span class="font-mono-spec">522 Stocking Ave NW</span><br />
          <span>Grand Rapids, MI</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ── THREE PILLARS ──────────────────────────────────────────────────── -->
<section class="section" style="background: var(--bg-primary)">
  <div class="container mx-auto px-6">
    <div class="section-header">
      <div class="divider"></div>
      <h2 class="section-title font-display">Our Structure — Three Pillars</h2>
    </div>

    <div class="pillars-grid">
      {#each pillars as p}
        <div class="pillar">
          <span class="pillar-num font-display">{p.num}</span>
          <h3 class="pillar-title font-display">{p.title}</h3>
          <p class="pillar-body">{p.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ── WAITLIST ────────────────────────────────────────────────────────── -->
<section id="waitlist" class="section waitlist-section">
  <div class="waitlist-bg"></div>
  <div class="container mx-auto px-6 relative z-10">
    <div class="waitlist-inner">
      <div class="waitlist-copy">
        <div class="divider"></div>
        <h2 class="section-title font-display">Be First Through<br />the Garage Door</h2>
        <p style="color: var(--text-secondary); margin-top: 1rem; line-height: 1.7;">
          Sign up to receive launch updates, founding member offers,
          and the first look at availability when we open in 2026.
        </p>
      </div>
      <div class="waitlist-form-wrap">
        <WaitlistForm />
      </div>
    </div>
  </div>
</section>

<style>
  /* ── Hero ──────────────────────────────────────────────── */
  .hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .hero-picture {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .hero-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 40%;
    transform: scale(1.03);
    transition: transform 8s ease;
  }

  .hero:hover .hero-bg-img {
    transform: scale(1.0);
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(10, 10, 10, 0.55) 0%,
      rgba(10, 10, 10, 0.4) 30%,
      rgba(10, 10, 10, 0.75) 70%,
      rgba(10, 10, 10, 0.95) 100%
    );
  }

  .hero-content {
    position: relative;
    z-index: 10;
    padding-top: 8rem;
    padding-bottom: 6rem;
  }

  .badge {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 0.375rem;
    background: rgba(237, 12, 133, 0.22);
    border: 1px solid rgba(237, 12, 133, 0.6);
    backdrop-filter: blur(8px);
    color: var(--accent-text);
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 0.375rem 0.875rem;
    border-radius: 999px;
    margin-bottom: 1.75rem;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  .hero-headline {
    font-size: clamp(2.75rem, 8vw, 6.5rem);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.01em;
    color: white;
    margin-bottom: 1.5rem;
    max-width: 800px;
  }

  .hero-sub {
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    color: rgba(240, 240, 240, 0.8);
    max-width: 520px;
    line-height: 1.65;
    margin-bottom: 2.5rem;
  }

  .hero-ctas {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  /* Ghost button needs a visible border over the photo overlay */
  .hero-ctas :global(.btn-ghost) {
    border-color: rgba(255, 255, 255, 0.45);
    color: #fff;
  }

  .hero-ctas :global(.btn-ghost:hover) {
    border-color: rgba(255, 255, 255, 0.75);
    background: rgba(255, 255, 255, 0.1);
  }

  .scroll-hint {
    margin-top: 4rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .scroll-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: bounce-dot 2s infinite;
  }

  @keyframes bounce-dot {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(6px); opacity: 0.5; }
  }

  /* ── Section headers ───────────────────────────────────── */
  .section-header {
    margin-bottom: 3.5rem;
    max-width: 640px;
  }

  .section-title {
    font-size: clamp(2rem, 5vw, 3.25rem);
    font-weight: 800;
    line-height: 1.1;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .section-sub {
    font-size: 1.0625rem;
    color: var(--text-secondary);
    line-height: 1.7;
    max-width: 560px;
  }

  /* ── Features ──────────────────────────────────────────── */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.25rem;
  }

  .feature-card {
    padding: 2rem;
  }

  .feat-icon {
    width: 44px;
    height: 44px;
    border-radius: 0.625rem;
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    margin-bottom: 1.25rem;
  }

  .feat-title {
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.625rem;
  }

  .feat-body {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.65;
    margin: 0;
  }

  /* ── Uses ──────────────────────────────────────────────── */
  .uses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem 2rem;
  }

  .use-item {
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 0.625rem;
    border: 1px solid var(--border);
    background: var(--bg-card);
    transition: border-color 0.15s, background 0.15s;
  }

  .use-item:hover {
    border-color: var(--accent-border);
    background: var(--accent-muted);
  }

  .use-label {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .use-sub {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin: 0;
  }

  /* ── Club section ──────────────────────────────────────── */
  .club-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: center;
  }

  .club-body {
    color: var(--text-secondary);
    line-height: 1.75;
    margin-bottom: 1rem;
    font-size: 1.0625rem;
  }

  .club-quote {
    margin: 2rem 0 0;
    padding: 1.5rem;
    border-left: 3px solid var(--accent);
    background: var(--accent-muted);
    border-radius: 0 0.5rem 0.5rem 0;
    font-style: italic;
    color: var(--text-secondary);
    font-size: 0.9375rem;
    line-height: 1.7;
  }

  .club-quote cite {
    display: block;
    margin-top: 0.75rem;
    font-style: normal;
    font-weight: 600;
    color: var(--accent-text);
    font-size: 0.875rem;
  }

  .club-visual {
    position: relative;
  }

  .club-img {
    width: 100%;
    aspect-ratio: 4/3;
    object-fit: cover;
    border-radius: 0.875rem;
    border: 1px solid var(--border);
  }

  .club-img-badge {
    position: absolute;
    bottom: -1rem;
    left: -1rem;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 0.875rem 1.125rem;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.5;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  }

  .club-img-badge .font-mono-spec {
    color: var(--accent-text);
    font-weight: 700;
  }

  @media (max-width: 768px) {
    .club-inner {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }

    .club-img-badge {
      bottom: 1rem;
      left: 1rem;
    }
  }

  /* ── Pillars ───────────────────────────────────────────── */
  .pillars-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  @media (max-width: 768px) {
    .pillars-grid {
      grid-template-columns: 1fr;
    }
  }

  .pillar {
    padding: 2.5rem 0;
    border-top: 1px solid var(--border);
    position: relative;
  }

  .pillar::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--accent);
    transition: width 0.4s ease;
  }

  .pillar:hover::before {
    width: 100%;
  }

  .pillar-num {
    font-size: 3rem;
    font-weight: 900;
    color: var(--accent-text);
    opacity: 0.65; /* 3.44:1 effective contrast — WCAG AA for large text */
    line-height: 1;
    display: block;
    margin-bottom: 0.5rem;
  }

  .pillar-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .pillar-body {
    color: var(--text-secondary);
    font-size: 0.9375rem;
    line-height: 1.7;
    margin: 0;
  }

  /* ── Waitlist ──────────────────────────────────────────── */
  .waitlist-section {
    position: relative;
    overflow: hidden;
  }

  .waitlist-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(237, 12, 133, 0.06) 0%, transparent 60%),
                var(--bg-secondary);
  }

  .waitlist-inner {
    position: relative;
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

  .waitlist-form-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
  }
</style>
