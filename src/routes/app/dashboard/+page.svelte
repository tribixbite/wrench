<script lang="ts">
  import { CalendarDays, Clock, Wrench, ArrowRight, AlertCircle } from 'lucide-svelte';

  interface Props {
    data: {
      user: App.Locals['user'];
      upcomingReservations: unknown[];
      membershipStatus: string;
    };
  }

  const { data }: Props = $props();
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

  <!-- Pre-launch notice -->
  <div class="notice">
    <AlertCircle size={18} style="color: var(--accent); flex-shrink: 0;" />
    <div>
      <p class="notice-title">Wrench Club opens in 2026</p>
      <p class="notice-body">
        Your account is registered and ready. Bay booking will open when we launch.
        We'll email you as soon as scheduling goes live.
      </p>
    </div>
  </div>

  <!-- Stats grid -->
  <div class="stats-grid">
    <div class="stat-card card">
      <div class="stat-icon"><CalendarDays size={20} /></div>
      <div>
        <p class="stat-label">Upcoming Reservations</p>
        <p class="stat-value font-display">0</p>
      </div>
    </div>
    <div class="stat-card card">
      <div class="stat-icon"><Clock size={20} /></div>
      <div>
        <p class="stat-label">Bay Hours Used</p>
        <p class="stat-value font-display">0 hrs</p>
      </div>
    </div>
    <div class="stat-card card">
      <div class="stat-icon"><Wrench size={20} /></div>
      <div>
        <p class="stat-label">Membership Status</p>
        <p class="stat-value font-display">Waitlist</p>
      </div>
    </div>
  </div>

  <!-- Reservations placeholder -->
  <div class="section-block">
    <h2 class="block-title font-display">Upcoming Reservations</h2>
    <div class="empty-state">
      <CalendarDays size={40} style="color: var(--text-muted); margin-bottom: 1rem;" />
      <p class="empty-title">No reservations yet</p>
      <p class="empty-body">Bay booking opens at launch. Check back in 2026.</p>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 2.5rem;
    max-width: 1000px;
  }

  @media (max-width: 768px) {
    .dashboard {
      padding: 1.5rem 1.25rem;
    }
  }

  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
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
    padding: 1.25rem 1.5rem;
    margin-bottom: 2rem;
  }

  .notice-title {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--text-primary);
    margin: 0 0 0.375rem;
  }

  .notice-body {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }

  .stat-card {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1.25rem 1.5rem;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 0.625rem;
    background: var(--bg-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    flex-shrink: 0;
  }

  .stat-label {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin: 0 0 0.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    line-height: 1;
  }

  .section-block {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.875rem;
    padding: 2rem;
  }

  .block-title {
    font-size: 1.375rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
  }

  .empty-title {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text-secondary);
    margin: 0 0 0.5rem;
  }

  .empty-body {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin: 0;
  }
</style>
