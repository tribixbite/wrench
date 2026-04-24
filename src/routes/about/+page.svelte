<script lang="ts">
  import { MapPin, ExternalLink, ArrowRight } from 'lucide-svelte';
  import WaitlistForm from '$lib/components/marketing/WaitlistForm.svelte';
  import SEO from '$lib/components/layout/SEO.svelte';
  import { env } from '$env/dynamic/public';

  const supportEmail = env.PUBLIC_SUPPORT_EMAIL || 'info@thewrench.club';

  const founders = [
    {
      name: 'Coleman Brook',
      role: 'Co-founder',
      photo: '/assets/coleman.jpg',
      bio: `Ever since my blue car bed as a 2 year old, I have always been happiest with a steering wheel in my hands. From farm equipment videos to monster trucks and eventually F1, all I cared to watch on TV was anything with 4 wheels and an engine. My passion for cars led to 16 years and counting of various BMW ownership, as well a 7 year career with my local BMW dealership.

As an adult, I transitioned from a house to downtown condo living, and began to realize my parking ramp was no substitute for a tool-filled garage. I shared a few beers in the building's hot tub with like-minded gearhead neighbors, Derick and Mike, and the idea of WrenchClub was born. We postulated we were not alone in the desire for the proper tools and space to tinker under the hood, and really dug in to what it would take to bring our vision to life. Almost 2 years from concept to reality, we are finally proud to offer Wrench Club as a true amenity to auto enthusiasts in and around Grand Rapids.`,
      daily: { year: '2018', make: 'BMW M760xi', engine: '6.6L Twin Turbo V12', hp: '600hp' }
    },
    {
      name: 'Derick Brower',
      role: 'Co-founder',
      photo: '/assets/derick.jpg',
      bio: `I am a founding member of Wrench Club, a DIY auto shop built for people who want to take control of their own vehicle repairs. I helped create Wrench Club to give everyday car owners access to professional tools, shop space, and a community of people who enjoy working on their own vehicles.

My journey into DIY automotive repair started with owning several older German vehicles. Between the complexity of the cars and the eye-watering dealer repair quotes, it quickly became clear that learning to fix them myself wasn't just rewarding — it was necessary. What started as a way to keep my own cars on the road turned into a passion for understanding how vehicles work and helping others gain the confidence to tackle their own repairs.

I believe that working on your own car shouldn't be limited to professional mechanics or people with fully equipped garages. Wrench Club was created to lower that barrier — providing the equipment, space, and community that make DIY automotive work accessible to everyone.`,
      daily: { year: '2003', make: 'Audi RS6', engine: '4.2L BiTurbo V8', hp: '444hp' }
    },
    {
      name: 'Mike Zandstra',
      role: 'Co-founder',
      photo: '/assets/mike.jpg',
      bio: `According to my mom, my first word was "car." She's very proud. I, unfortunately, have not slowed down since.

I helped found Wrench Club because I believe everyone deserves to understand their own vehicle, and because after years of crawling under cars on jack stands to change my own oil, I simply ran out of clothes I was willing to sacrifice. It turns out gravity doesn't care how careful you are.

My goal is to give the Grand Rapids community the tools, the space, and the confidence to tackle their own repairs — with professional lifts, proper equipment, and a fighting chance of walking out looking roughly the same as they walked in.`,
      daily: { year: '1999', make: 'Chevy Suburban', engine: '5.7L V8', hp: '255hp' }
    },
    {
      name: 'Adrian Hoogerheide',
      role: 'Co-founder',
      photo: '/assets/adrian.jpg',
      bio: `I have been a "car guy" my whole life, and automotive enthusiasm has permeated both my personal and professional life. I have owned and operated Auto Fixit Body Shop in Grand Rapids for 20+ years, and have owned and modified more cars and trucks than I think I can count.

I am excited to take my expertise as a mechanic and auto shop owner, and use it to offer something truly unique for the West Michigan car community.`,
      daily: { year: '2019', make: 'Ford F350', engine: '6.7L TurboDiesel V8', hp: '715hp' }
    }
  ];
</script>

<SEO title="About" description="Meet the founders of Wrench Club — four gearheads building West Michigan's first membership-based DIY auto shop at 522 Stocking Ave NW, Grand Rapids." />

<!-- Page Header -->
<div class="page-header">
  <div class="container mx-auto px-6">
    <p class="overline">The Team Behind the Wrenches</p>
    <h1 class="page-title font-display">Four Gearheads<br />One Hell of a Garage</h1>
    <p class="page-sub">
      Wrench Club started with a hot tub, a few beers, and a shared frustration with
      not having a proper place to work on their cars. Two years later, it's a reality.
    </p>
  </div>
</div>

<!-- Team Cars Hero -->
<div class="team-cars-wrap">
  <img
    src="/assets/team-cars.jpg"
    alt="The Wrench Club team's daily drivers — BMW M760xi, Audi RS6, Chevy Suburban, Ford F350 — lined up at 522 Stocking Ave NW"
    class="team-cars-img"
    width="1416"
    height="1061"
    loading="eager"
  />
  <div class="team-cars-label">
    <span class="font-mono-spec">522 Stocking Ave NW · Grand Rapids, MI</span>
  </div>
</div>

<!-- Founder Bios -->
<section class="section" style="background: var(--bg-secondary)">
  <div class="container mx-auto px-6">
    <div class="section-header">
      <div class="divider"></div>
      <h2 class="section-title font-display">Meet the Founders</h2>
      <p class="section-sub">Real gearheads. Real daily drivers. Real skin in the game.</p>
    </div>

    <div class="founders-list">
      {#each founders as founder, i}
        <div class="founder-card card" class:reverse={i % 2 === 1}>
          <div class="founder-photo-wrap">
            <img
              src={founder.photo}
              alt="{founder.name} — {founder.role} at Wrench Club"
              class="founder-photo"
              width="600"
              height="400"
              loading="lazy"
            />
          </div>
          <div class="founder-content">
            <div class="founder-meta">
              <h3 class="founder-name font-display">{founder.name}</h3>
              <span class="founder-role">{founder.role}</span>
            </div>

            <div class="daily-badge">
              <span class="daily-label font-mono-spec">CURRENT DAILY</span>
              <div class="daily-car">
                <span class="daily-year font-mono-spec">{founder.daily.year}</span>
                <span class="daily-make font-display">{founder.daily.make}</span>
              </div>
              <div class="daily-specs font-mono-spec">
                <span>{founder.daily.engine}</span>
                <span class="spec-sep">·</span>
                <span class="daily-hp">{founder.daily.hp}</span>
              </div>
            </div>

            <div class="founder-bio">
              {#each founder.bio.split('\n\n') as para}
                {#if para.trim()}
                  <p>{para.trim()}</p>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Location -->
<section class="section" style="background: var(--bg-primary)">
  <div class="container mx-auto px-6">
    <div class="location-grid">
      <div>
        <div class="divider"></div>
        <h2 class="section-title font-display">Find Us in Downtown<br />Grand Rapids</h2>
        <div class="address-block">
          <MapPin size={18} style="color: var(--accent); flex-shrink: 0; margin-top: 3px;" />
          <div>
            <p class="address-text">522 Stocking Ave NW</p>
            <p class="address-text">Grand Rapids, MI</p>
          </div>
        </div>
        <div class="location-details">
          <div class="detail-row">
            <span class="detail-label font-mono-spec">HOURS</span>
            <span class="detail-value">TBD — Opening 2026</span>
          </div>
          <div class="detail-row">
            <span class="detail-label font-mono-spec">EMAIL</span>
            <a href="mailto:{supportEmail}" class="detail-link">{supportEmail}</a>
          </div>
          <div class="detail-row">
            <span class="detail-label font-mono-spec">FACEBOOK</span>
            <a
              href="https://facebook.com/wrenchclubb"
              target="_blank"
              rel="noopener noreferrer"
              class="detail-link"
            >
              facebook.com/wrenchclubb
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <a
          href="https://maps.google.com/?q=522+Stocking+Ave+NW+Grand+Rapids+MI"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-outline mt-6 inline-flex"
        >
          Get Directions <ExternalLink size={16} />
        </a>
      </div>
      <div class="map-embed">
        <iframe
          title="Wrench Club — 522 Stocking Ave NW, Grand Rapids, MI"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2917.5!2d-85.681!3d42.967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8819ae6f6f6f6f6f%3A0x0!2s522+Stocking+Ave+NW%2C+Grand+Rapids%2C+MI!5e0!3m2!1sen!2sus!4v1"
          width="100%"
          height="400"
          style="border: none; border-radius: 0.875rem; filter: invert(90%) hue-rotate(180deg);"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  </div>
</section>

<!-- Waitlist CTA -->
<section id="waitlist" class="section" style="background: var(--bg-secondary)">
  <div class="container mx-auto px-6">
    <div class="cta-inner">
      <div>
        <div class="divider"></div>
        <h2 class="section-title font-display">Join the Community<br />Before We Open</h2>
        <p style="color: var(--text-secondary); margin-top: 0.75rem; font-size: 1.0625rem;">
          Get early access, founding member rates, and the first look at the schedule when
          we open our doors in 2026.
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
    color: var(--accent-text);
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
    max-width: 600px;
    line-height: 1.7;
  }

  /* Team Cars image */
  .team-cars-wrap {
    position: relative;
    height: 400px;
    overflow: hidden;
  }

  .team-cars-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 60%;
    filter: brightness(0.8);
  }

  .team-cars-label {
    position: absolute;
    bottom: 1.5rem;
    right: 1.5rem;
    background: rgba(10, 10, 10, 0.85);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    backdrop-filter: blur(8px);
  }

  /* Section headers */
  .section-header {
    margin-bottom: 3.5rem;
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

  /* Founder cards */
  .founders-list {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .founder-card {
    display: grid;
    grid-template-columns: 380px 1fr;
    overflow: visible;
    background: transparent;
    border: none;
  }

  .founder-card.reverse {
    grid-template-columns: 1fr 380px;
  }

  .founder-card.reverse .founder-photo-wrap {
    order: 2;
  }

  .founder-card.reverse .founder-content {
    order: 1;
  }

  @media (max-width: 900px) {
    .founder-card,
    .founder-card.reverse {
      grid-template-columns: 1fr;
    }

    .founder-card.reverse .founder-photo-wrap,
    .founder-card.reverse .founder-content {
      order: unset;
    }
  }

  .founder-photo-wrap {
    border-radius: 0.875rem;
    overflow: hidden;
    border: 1px solid var(--border);
  }

  .founder-photo {
    width: 100%;
    height: 100%;
    min-height: 400px;
    object-fit: cover;
    display: block;
    transition: transform 0.6s ease;
  }

  .founder-photo-wrap:hover .founder-photo {
    transform: scale(1.03);
  }

  .founder-content {
    padding: 0.5rem 0 0.5rem 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .founder-card.reverse .founder-content {
    padding: 0.5rem 2.5rem 0.5rem 0;
  }

  @media (max-width: 900px) {
    .founder-content,
    .founder-card.reverse .founder-content {
      padding: 1.5rem 0 0;
    }
  }

  .founder-name {
    font-size: 2.5rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .founder-role {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--accent-text);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* Daily driver badge */
  .daily-badge {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.125rem 1.375rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .daily-label {
    font-size: 0.625rem;
    color: var(--text-muted);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .daily-car {
    display: flex;
    align-items: baseline;
    gap: 0.625rem;
  }

  .daily-year {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .daily-make {
    font-size: 1.375rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .daily-specs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--text-secondary);
  }

  .spec-sep {
    color: var(--text-muted);
  }

  .daily-hp {
    color: var(--accent-text);
    font-weight: 700;
  }

  .founder-bio {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .founder-bio p {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.75;
    margin: 0;
  }

  /* Location */
  .location-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: start;
  }

  @media (max-width: 768px) {
    .location-grid {
      grid-template-columns: 1fr;
      gap: 3rem;
    }
  }

  .address-block {
    display: flex;
    gap: 0.875rem;
    margin: 1.5rem 0 2rem;
  }

  .address-text {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.5;
  }

  .location-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .detail-label {
    font-size: 0.625rem;
    color: var(--text-muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    width: 4.5rem;
    flex-shrink: 0;
  }

  .detail-value {
    font-size: 0.9375rem;
    color: var(--text-secondary);
  }

  .detail-link {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition: color 0.15s;
  }

  .detail-link:hover {
    color: var(--accent);
  }

  .map-embed {
    border-radius: 0.875rem;
    overflow: hidden;
    border: 1px solid var(--border);
  }

  /* CTA */
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
  }

  .form-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
  }
</style>
