<script lang="ts">
  import { CalendarDays, Clock, Wrench, ArrowRight, AlertCircle, MapPin } from 'lucide-svelte';
  import BayGrid from '$lib/components/app/BayGrid.svelte';
  import type { MemberBooking } from '$lib/server/bookings';

  interface Props {
    data: {
      user: App.Locals['user'];
      upcoming: MemberBooking[];
      pastHoursUsed: number;
      membershipStatus: 'waitlist' | 'active' | 'inactive';
    };
  }

  const { data }: Props = $props();

  function fmtDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function fmtTime(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  function bookingLabel(b: MemberBooking): string {
    // customerNote starts with [order:X|payment:Y] from our booking flow — strip it.
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
    <a href="/app/reservations" class="btn btn-primary">
      Book a Bay <ArrowRight size={16} />
    </a>
  </div>

  <!-- Pre-launch notice (only for waitlist status) -->
  {#if data.membershipStatus === 'waitlist'}
    <div class="notice">
      <AlertCircle size={18} style="color: var(--accent); flex-shrink: 0; margin-top: 1px;" />
      <div>
        <p class="notice-title">Wrench Club opens in 2026</p>
        <p class="notice-body">
          Your account is ready. Bay booking opens at launch — you'll get an email the moment
          scheduling goes live. Check the bay grid below for a preview of the live status system.
        </p>
      </div>
    </div>
  {/if}

  <!-- Stats + Bay Grid -->
  <div class="main-grid">
    <div class="left-col">
      <!-- Stats -->
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
            <p class="stat-value font-display" style="font-size: 1.25rem; text-transform: capitalize;">
              {data.membershipStatus}
            </p>
          </div>
        </div>
      </div>

      <!-- Upcoming reservations -->
      <div class="section-block card">
        <h2 class="block-title font-display">Upcoming Reservations</h2>
        {#if data.upcoming.length === 0}
          <div class="empty-state">
            <CalendarDays size={36} style="color: var(--text-muted); margin-bottom: 0.875rem;" />
            <p class="empty-title">No reservations yet</p>
            <p class="empty-body">
              {#if data.membershipStatus === 'waitlist'}
                Bay booking opens at launch in 2026.
              {:else}
                Ready when you are — book your first bay hour.
              {/if}
            </p>
            <a href="/app/reservations" class="btn btn-outline btn-sm" style="margin-top: 1rem;">
              {data.membershipStatus === 'waitlist' ? 'Learn about booking' : 'Book a Bay'}
            </a>
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
          <a href="/app/reservations" class="btn btn-outline btn-sm" style="margin-top: 1rem;">
            Manage reservations →
          </a>
        {/if}
      </div>
    </div>

    <div class="right-col">
      <!-- Live bay grid -->
      <BayGrid />

      <!-- Location card -->
      <div class="location-card card">
        <div class="location-inner">
          <MapPin size={18} style="color: var(--accent); flex-shrink: 0; margin-top: 2px;" />
          <div>
            <p class="location-name">Wrench Club</p>
            <p class="location-addr">522 Stocking Ave NW, Grand Rapids, MI</p>
            <a
              href="https://maps.google.com/?q=522+Stocking+Ave+NW+Grand+Rapids+MI"
              target="_blank"
              rel="noopener noreferrer"
              class="location-link"
              aria-label="Get directions (opens in a new tab)"
            >
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

  @media (max-width: 768px) {
    .dashboard { padding: 1.5rem 1.25rem; }
  }

  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.75rem;
    flex-wrap: wrap;
  }

  .dash-greeting {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0 0 0.25rem;
  }

  .dash-name {
    font-size: 2rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    margin: 0;
  }

  .notice {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    border-radius: 0.75rem;
    padding: 1.125rem 1.5rem;
    margin-bottom: 2rem;
  }

  .notice-title {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .notice-body {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  /* Main 2-col layout */
  .main-grid {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 900px) {
    .main-grid {
      grid-template-columns: 1fr;
    }
  }

  .left-col, .right-col {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.875rem;
  }

  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: 1fr; }
  }

  .stat-card {
    display: flex;
    gap: 0.875rem;
    align-items: center;
    padding: 1.125rem 1.25rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 0.5rem;
    background: var(--bg-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    flex-shrink: 0;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0 0 0.2rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    line-height: 1;
  }

  .section-block {
    padding: 1.5rem;
  }

  .block-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0 0 1.25rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1.5rem;
    text-align: center;
  }

  .empty-title {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--text-secondary);
    margin: 0 0 0.375rem;
  }

  .empty-body {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0;
  }

  .booking-list {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 0.5rem;
  }
  .booking-row {
    display: flex; align-items: center; gap: 1rem;
    padding: 0.875rem 1rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }
  .booking-when {
    display: flex; flex-direction: column; min-width: 0; flex-shrink: 0;
  }
  .booking-date {
    font-size: 0.875rem; font-weight: 600; color: var(--text-primary);
  }
  .booking-time {
    font-size: 0.75rem; color: var(--text-muted);
  }
  .booking-what {
    display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0;
  }
  .booking-bay {
    font-size: 0.875rem; color: var(--text-secondary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
  }
  .booking-status {
    font-size: 0.6875rem; padding: 0.25rem 0.5rem;
    border-radius: 999px; background: var(--bg-secondary);
    color: var(--text-muted); text-transform: capitalize; flex-shrink: 0;
  }
  .booking-status.confirmed { background: rgba(34, 197, 94, 0.15); color: #22c55e; }

  /* Location card */
  .location-card {
    padding: 1.25rem 1.5rem;
  }

  .location-inner {
    display: flex;
    gap: 0.875rem;
    align-items: flex-start;
  }

  .location-name {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .location-addr {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 0.5rem;
  }

  .location-link {
    font-size: 0.875rem;
    color: var(--accent);
    text-decoration: none;
  }

  .btn-sm {
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
  }
</style>
