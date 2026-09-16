<script lang="ts">
  import { page } from '$app/stores';
  import { CalendarDays, Clock, Wrench, ArrowRight, Lock, Loader2, CreditCard, CheckCircle2 } from 'lucide-svelte';
  import { onDestroy } from 'svelte';
  import BayGrid from '$lib/components/app/BayGrid.svelte';
  import type { MemberBooking } from '$lib/server/bookings';
  import { MapPin } from 'lucide-svelte';

  interface Props {
    data: {
      user: App.Locals['user'];
      upcoming: MemberBooking[];
      pastHoursUsed: number;
      membershipStatus: 'active' | 'inactive';
      square: { appId: string; locationId: string; environment: 'sandbox' | 'production' };
    };
  }

  const { data }: Props = $props();

  // Show membership required notice if redirected from reservations
  const membershipRequired = $derived($page.url.searchParams.get('membership') === 'required');

  // ── Buy Membership card form ──────────────────────────────────────────────
  let showPayForm = $state(false);
  let sdkReady    = $state(false);
  let sdkError    = $state('');
  let submitting  = $state(false);
  let payError    = $state('');
  let paySuccess  = $state(false);

  let cardInstance: any = null;
  const cardElementId = 'sq-dashboard-card';

  async function loadSquareSdk(): Promise<any> {
    if ((window as any).Square) return (window as any).Square;
    return new Promise((resolve, reject) => {
      const src = data.square.environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.addEventListener('load', () => resolve((window as any).Square));
      s.addEventListener('error', () => reject(new Error('Square SDK unavailable')));
      document.head.appendChild(s);
    });
  }

  async function openPayForm() {
    showPayForm = true;
    sdkReady = false;
    sdkError = '';
    payError = '';
    await new Promise(r => setTimeout(r, 50)); // wait for DOM
    try {
      const Square = await loadSquareSdk();
      const payments = Square.payments(data.square.appId, data.square.locationId);
      cardInstance = await payments.card();
      await cardInstance.attach(`#${cardElementId}`);
      sdkReady = true;
    } catch (e) {
      sdkError = e instanceof Error ? e.message : 'Card form failed to load';
    }
  }

  async function handleSubscribe() {
    if (!cardInstance) { payError = 'Card form is still loading — try again.'; return; }
    payError = '';
    submitting = true;
    try {
      const result = await cardInstance.tokenize();
      if (result.status !== 'OK' || !result.token) {
        payError = result.errors?.[0]?.message ?? 'Card details are not valid — please check and try again.';
        return;
      }
      const res = await fetch('/api/membership/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cardNonce: result.token })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        payError = (json as any).error ?? 'Payment failed — please try again.';
        return;
      }
      paySuccess = true;
      // Reload to reflect active membership
      setTimeout(() => window.location.reload(), 1500);
    } finally {
      submitting = false;
    }
  }

  onDestroy(() => {
    if (cardInstance) try { cardInstance.destroy(); } catch {}
  });

  // ── Booking helpers ───────────────────────────────────────────────────────
  function fmtDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function fmtTime(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  function bookingLabel(b: MemberBooking): string {
    const note = (b.customerNote ?? '').replace(/^\[order:[^|]+\|payment:[^\]]+\]\s*/, '');
    return note || 'Bay reservation';
  }
</script>

<svelte:head>
  <title>Dashboard — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="dashboard">
  <!-- Header -->
  <div class="dash-header">
    <div>
      <p class="dash-greeting">Welcome back</p>
      <h1 class="dash-name font-display">{data.user?.name}</h1>
    </div>
    {#if data.membershipStatus === 'active'}
      <a href="/app/reservations" class="btn btn-primary" data-umami-event="dashboard-book-bay-click">
        Book a Bay <ArrowRight size={16} />
      </a>
    {/if}
  </div>

  <!-- Membership required redirect notice -->
  {#if membershipRequired && data.membershipStatus === 'inactive'}
    <div class="notice notice-warn">
      <Lock size={18} style="flex-shrink: 0; margin-top: 1px;" />
      <div>
        <p class="notice-title">Membership required for bay booking</p>
        <p class="notice-body">Activate your membership below to unlock bay reservations.</p>
      </div>
    </div>
  {/if}

  <div class="main-grid">
    <div class="left-col">

      {#if data.membershipStatus === 'inactive'}
        <!-- ── Buy Membership Card ── -->
        <div class="membership-card card">
          <div class="member-card-header">
            <div>
              <h2 class="block-title font-display">Activate Your Membership</h2>
              <p class="member-card-sub">Get full access to bay reservations, tools, hoists, and the Wrench Club community.</p>
            </div>
            <div class="member-price">
              <span class="price-amount">$10</span>
              <span class="price-period">/mo</span>
            </div>
          </div>

          <ul class="member-perks">
            <li><CheckCircle2 size={15} /> Unlimited bay reservations</li>
            <li><CheckCircle2 size={15} /> Access to all tools &amp; equipment</li>
            <li><CheckCircle2 size={15} /> 2 hoists, 3 flat bays, 1 detail bay</li>
            <li><CheckCircle2 size={15} /> Cancel anytime</li>
          </ul>

          {#if paySuccess}
            <div class="pay-success">
              <CheckCircle2 size={20} /> Membership activated — refreshing…
            </div>
          {:else if !showPayForm}
            <button class="btn btn-primary" onclick={openPayForm}>
              <CreditCard size={16} /> Buy Membership — $10/mo
            </button>
          {:else}
            {#if payError}
              <div class="form-error" role="alert">{payError}</div>
            {/if}
            {#if sdkError}
              <div class="form-error" role="alert">{sdkError}</div>
            {/if}

            <div class="pay-box">
              <div class="pay-header-row">
                <span class="pay-label">Monthly Membership · $10/mo</span>
                <span class="pay-secure"><Lock size={11} /> Secured by Square</span>
              </div>
              <div class="card-field-wrap">
                {#if !sdkReady && !sdkError}
                  <div class="card-loading"><Loader2 size={14} class="spin" /> Loading secure card form…</div>
                {/if}
                <div id={cardElementId} class="sq-card-container" class:hidden={!sdkReady}></div>
              </div>
            </div>

            <div class="pay-actions">
              <button class="btn btn-primary" disabled={submitting || (!sdkReady && !sdkError)} onclick={handleSubscribe}>
                {#if submitting}
                  <Loader2 size={16} class="spin" /> Processing…
                {:else}
                  <CreditCard size={16} /> Confirm $10/mo Membership
                {/if}
              </button>
              <button class="btn-cancel" onclick={() => { showPayForm = false; if (cardInstance) try { cardInstance.destroy(); } catch {} cardInstance = null; sdkReady = false; }}>
                Cancel
              </button>
            </div>
            <p class="cancel-note">You can cancel your membership anytime from your profile.</p>
          {/if}
        </div>

      {:else}
        <!-- ── Active member: stats + bookings ── -->
        <div class="stats-grid">
          <div class="stat-card card">
            <div class="stat-icon"><CalendarDays size={20} /></div>
            <div>
              <p class="stat-label">Upcoming Reservations</p>
              <p class="stat-value font-display">{data.upcoming.length}</p>
            </div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon"><Clock size={20} /></div>
            <div>
              <p class="stat-label">Bay Hours Used</p>
              <p class="stat-value font-display">{data.pastHoursUsed}{data.pastHoursUsed === 1 ? ' hr' : ' hrs'}</p>
            </div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon"><Wrench size={20} /></div>
            <div>
              <p class="stat-label">Status</p>
              <p class="stat-value font-display" style="font-size: 1.125rem; color: #22c55e;">Active</p>
            </div>
          </div>
        </div>

        <div class="section-block card">
          <h2 class="block-title font-display">Upcoming Reservations</h2>
          {#if data.upcoming.length === 0}
            <div class="empty-state">
              <CalendarDays size={36} style="color: var(--text-muted); margin-bottom: 0.875rem;" />
              <p class="empty-title">No reservations yet</p>
              <p class="empty-body">Ready when you are — book your first bay hour.</p>
              <a href="/app/reservations" class="btn btn-outline btn-sm" style="margin-top: 1rem;">Book a Bay</a>
            </div>
          {:else}
            <ul class="booking-list">
              {#each data.upcoming as b (b.id)}
                <li class="booking-row">
                  <div class="booking-when">
                    <span class="booking-date">{fmtDate(b.startAt)}</span>
                    <span class="booking-time">{fmtTime(b.startAt)}</span>
                  </div>
                  <div class="booking-what">
                    <span class="booking-bay">{bookingLabel(b)}</span>
                    <span class="booking-status" class:confirmed={b.status === 'ACCEPTED' || b.status === 'APPROVED'}>
                      {b.status?.toLowerCase().replace(/_/g, ' ') ?? 'pending'}
                    </span>
                  </div>
                </li>
              {/each}
            </ul>
            <a href="/app/reservations" class="btn btn-outline btn-sm" style="margin-top: 1rem;">Manage reservations →</a>
          {/if}
        </div>

        <a href="/Member%20Code%20of%20Conduct.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm conduct-link">
          View Member Code of Conduct (PDF)
        </a>
      {/if}
    </div>

    <div class="right-col">
      <BayGrid />
      <div class="location-card card">
        <div class="location-inner">
          <MapPin size={18} style="color: var(--accent); flex-shrink: 0; margin-top: 2px;" />
          <div>
            <p class="location-name">Wrench Club</p>
            <p class="location-addr">522 Stocking Ave NW, Grand Rapids, MI</p>
            <a href="https://maps.google.com/?q=522+Stocking+Ave+NW+Grand+Rapids+MI"
              target="_blank" rel="noopener noreferrer" class="location-link"
              aria-label="Get directions (opens in a new tab)">
              Get Directions →
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 2.5rem;
    max-width: 1100px;
    margin: 0 auto;
  }
  @media (max-width: 768px) { .dashboard { padding: 1.5rem 1.25rem; } }

  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.75rem;
    flex-wrap: wrap;
  }
  .dash-greeting { font-size: 0.875rem; color: var(--text-muted); margin: 0 0 0.25rem; }
  .dash-name { font-size: 2rem; font-weight: 900; color: var(--text-primary); line-height: 1; margin: 0; }

  .notice {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    border-radius: 0.75rem;
    padding: 1.125rem 1.5rem;
    margin-bottom: 2rem;
    color: var(--accent);
  }
  .notice-warn { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.25); color: #fca5a5; }
  .notice-title { font-weight: 600; font-size: 0.9375rem; color: var(--text-primary); margin: 0 0 0.25rem; }
  .notice-body { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }

  .main-grid {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1.5rem;
    align-items: start;
  }
  @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

  .left-col, .right-col { display: flex; flex-direction: column; gap: 1.25rem; }

  /* ── Membership card ── */
  .membership-card { padding: 1.75rem; display: flex; flex-direction: column; gap: 1.5rem; }

  .member-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .member-card-sub {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0.375rem 0 0;
    max-width: 340px;
  }

  .member-price {
    display: flex;
    align-items: baseline;
    gap: 0.125rem;
    flex-shrink: 0;
  }
  .price-amount { font-size: 2.5rem; font-weight: 900; color: var(--text-primary); line-height: 1; }
  .price-period { font-size: 1rem; color: var(--text-muted); }

  .member-perks {
    list-style: none;
    padding: 0; margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }
  .member-perks li {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  .member-perks li :global(svg) { color: var(--accent); flex-shrink: 0; }

  .pay-success {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    color: #22c55e;
    font-weight: 600;
    font-size: 0.9375rem;
  }

  .pay-box {
    background: var(--bg-elevated);
    border: 1px solid var(--accent);
    border-radius: 0.75rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .pay-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pay-label { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
  .pay-secure { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.6875rem; color: var(--text-muted); }

  .card-field-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
  .card-loading { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); }
  .sq-card-container { min-height: 90px; background: white; border-radius: 0.5rem; padding: 0.5rem; }
  .sq-card-container.hidden { display: none; }

  .pay-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }

  .btn-cancel {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
  }
  .btn-cancel:hover { color: var(--text-secondary); }

  .cancel-note { font-size: 0.8125rem; color: var(--text-muted); margin: 0; }

  .form-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.5rem;
    padding: 0.875rem 1rem;
    color: #fca5a5;
    font-size: 0.875rem;
  }

  /* ── Active member: stats ── */
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.875rem; }
  @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }

  .stat-card { display: flex; gap: 0.875rem; align-items: center; padding: 1.125rem 1.25rem; }
  .stat-icon {
    width: 40px; height: 40px; border-radius: 0.5rem;
    background: var(--bg-elevated);
    display: flex; align-items: center; justify-content: center;
    color: var(--accent); flex-shrink: 0;
  }
  .stat-label { font-size: 0.75rem; color: var(--text-muted); margin: 0 0 0.2rem; }
  .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1; }

  .section-block { padding: 1.5rem; }
  .block-title { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0 0 1.25rem; }

  .empty-state {
    display: flex; flex-direction: column; align-items: center;
    padding: 2.5rem 1.5rem; text-align: center;
  }
  .empty-title { font-weight: 600; font-size: 0.9375rem; color: var(--text-secondary); margin: 0 0 0.375rem; }
  .empty-body { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

  .booking-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .booking-row {
    display: flex; align-items: center; gap: 1rem;
    padding: 0.875rem 1rem;
    background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 0.5rem;
  }
  .booking-when { display: flex; flex-direction: column; min-width: 0; flex-shrink: 0; }
  .booking-date { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
  .booking-time { font-size: 0.75rem; color: var(--text-muted); }
  .booking-what { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
  .booking-bay { font-size: 0.875rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .booking-status { font-size: 0.6875rem; padding: 0.25rem 0.5rem; border-radius: 999px; background: var(--bg-secondary); color: var(--text-muted); text-transform: capitalize; flex-shrink: 0; }
  .booking-status.confirmed { background: rgba(34, 197, 94, 0.15); color: #22c55e; }

  /* ── Right col ── */
  .location-card { padding: 1.25rem 1.5rem; }
  .location-inner { display: flex; gap: 0.875rem; align-items: flex-start; }
  .location-name { font-weight: 600; font-size: 0.9375rem; color: var(--text-primary); margin: 0 0 0.25rem; }
  .location-addr { font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 0.5rem; }
  .location-link { font-size: 0.875rem; color: var(--accent); text-decoration: none; }

  .btn-sm { padding: 0.5rem 1.25rem; font-size: 0.875rem; }
  .conduct-link { display: inline-flex; align-self: flex-start; }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
