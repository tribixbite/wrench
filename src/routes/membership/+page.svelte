<script lang="ts">
  import { Monitor, Wrench, Tag, Calendar, Car, Users, ArrowRight, CheckCircle2 } from 'lucide-svelte';
  import WaitlistForm from '$lib/components/marketing/WaitlistForm.svelte';
  import SEO from '$lib/components/layout/SEO.svelte';

  const benefits = [
    {
      icon: Monitor,
      title: 'Clubhouse Access',
      description: 'The Wrench Club clubhouse features racing simulators, an automotive library, a lounge, and a community of people who love cars as much as you do.',
      bullets: ['Full-motion racing simulators', 'Automotive reference library', 'Lounge and common area', 'TV and streaming for race day']
    },
    {
      icon: Wrench,
      title: 'Full Tool Library',
      description: 'Access to a comprehensive selection of specialty tools, air tools, diagnostic equipment, and hand tools — all organized and maintained by our staff.',
      bullets: ['Specialty hand tools', 'Air tools (impact, ratchets, cutoffs)', 'OBD diagnostic equipment', 'Torque wrenches, pullers, bearing kits']
    },
    {
      icon: Tag,
      title: 'Parts Discounts',
      description: "We've negotiated pricing with local parts suppliers so members pay less. Show your membership card and get the Wrench Club rate.",
      bullets: ['Discounted rates with local suppliers', 'OEM and aftermarket parts', 'In-store pickup available', 'No markup on special orders']
    },
    {
      icon: Calendar,
      title: 'Events & Community',
      description: 'The club hosts regular events for members — car shows, dyno days, group drives, and meetups with vendors and enthusiast groups from across West Michigan.',
      bullets: ['Monthly member meetups', 'Annual car show (members + guests)', 'Dyno day events', 'Guest speaker nights']
    },
    {
      icon: Car,
      title: 'Priority Bay Booking',
      description: 'Members get first access to the scheduling system and priority booking windows — so your favorite bay is there when you need it.',
      bullets: ['Online booking system', 'Priority reservation windows', 'Bay holds and recurring bookings', 'SMS / email reminders']
    },
    {
      icon: Users,
      title: 'Orientation & Support',
      description: 'New members complete a facility orientation covering every piece of equipment, safety protocols, and best practices — so you\'re never on your own.',
      bullets: ['Facility orientation session', 'Equipment training', 'Staff available during operating hours', 'Member community for advice']
    }
  ];
</script>

<SEO title="Membership" description="Everything included with Wrench Club membership: hoist access, full tool library, parts discounts, and a community of gearheads in Grand Rapids, MI." />

<!-- Page Header -->
<div class="page-header">
  <div class="container mx-auto px-6">
    <p class="overline">Membership Benefits</p>
    <h1 class="page-title font-display">Everything You Need.<br />Nothing You Don't.</h1>
    <p class="page-sub">
      Your Wrench Club membership isn't just a bay rental. It's access to a professional facility,
      a community of enthusiasts, and every tool you'd ever need — at a rate that makes sense.
    </p>
    <a href="#waitlist" class="btn btn-primary btn-lg" style="margin-top: 0.5rem;">
      Join the Waitlist <ArrowRight size={18} />
    </a>
  </div>
</div>

<!-- Benefits Grid -->
<section class="section" style="background: var(--bg-secondary)">
  <div class="container mx-auto px-6">
    <div class="benefits-grid">
      {#each benefits as b}
        <div class="benefit-card card">
          <div class="benefit-header">
            <div class="benefit-icon">
              <b.icon size={20} />
            </div>
            <h3 class="benefit-title font-display">{b.title}</h3>
          </div>
          <p class="benefit-desc">{b.description}</p>
          <ul class="benefit-list">
            {#each b.bullets as bullet}
              <li>
                <CheckCircle2 size={14} style="color: var(--accent); flex-shrink: 0;" />
                {bullet}
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Philosophy -->
<section class="section" style="background: var(--bg-primary)">
  <div class="container mx-auto px-6">
    <div class="phil-grid">
      <div>
        <div class="divider"></div>
        <h2 class="section-title font-display">Working on Your Own Car<br />Shouldn't Require a Trust Fund</h2>
        <p class="phil-body">
          Dealer labor rates have never been higher. Professional shops are backed up for weeks.
          And if you don't have your own equipped garage, you're stuck.
        </p>
        <p class="phil-body">
          Wrench Club was built to change that. We give you the space, the tools, and the
          professional equipment to tackle any job yourself — from a $30 oil change to a
          full engine rebuild.
        </p>
        <p class="phil-body">
          The only thing you bring is the motivation. We'll handle the rest.
        </p>
      </div>
      <div class="quote-stack">
        <blockquote class="pull-quote">
          <p>"Working on your own car shouldn't be limited to professional mechanics or people with fully equipped garages. Wrench Club was created to lower that barrier."</p>
          <cite>— Derick Brower, Co-founder</cite>
        </blockquote>
        <blockquote class="pull-quote">
          <p>"After years of crawling under cars on jack stands, I simply ran out of clothes I was willing to sacrifice. Gravity doesn't care how careful you are."</p>
          <cite>— Mike Zandstra, Co-founder</cite>
        </blockquote>
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
        <h2 class="section-title font-display">Founding Member Benefits</h2>
        <p style="color: var(--text-secondary); margin-top: 0.75rem; font-size: 1.0625rem; line-height: 1.7;">
          Join the waitlist now and lock in founding member pricing when we open in 2026.
          First 100 signups receive a discount on their first three months.
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
    margin-bottom: 1rem;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .benefit-card {
    padding: 2rem;
  }

  .benefit-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .benefit-icon {
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

  .benefit-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.2;
  }

  .benefit-desc {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.65;
    margin-bottom: 1.25rem;
  }

  .benefit-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .benefit-list li {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  /* Philosophy */
  .section-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    line-height: 1.1;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .phil-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: start;
  }

  @media (max-width: 768px) {
    .phil-grid {
      grid-template-columns: 1fr;
      gap: 3rem;
    }
  }

  .phil-body {
    font-size: 1.0625rem;
    color: var(--text-secondary);
    line-height: 1.75;
    margin-bottom: 1rem;
  }

  .quote-stack {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .pull-quote {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 0 0.625rem 0.625rem 0;
    padding: 1.5rem;
    margin: 0;
  }

  .pull-quote p {
    font-style: italic;
    color: var(--text-secondary);
    font-size: 0.9375rem;
    line-height: 1.7;
    margin: 0 0 0.875rem;
  }

  .pull-quote cite {
    font-style: normal;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--accent-text);
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
