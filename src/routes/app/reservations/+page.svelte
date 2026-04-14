<script lang="ts">
  import { CalendarDays, Clock, ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Bay Reservations — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
  <div class="page-header">
    <a href="/app/dashboard" class="back-link">
      <ArrowLeft size={16} /> Dashboard
    </a>
    <h1 class="page-title font-display">Bay Reservations</h1>
    <p class="page-sub">
      Online booking opens when Wrench Club launches in 2026.
    </p>
  </div>

  <div class="coming-card card">
    <CalendarDays size={48} style="color: var(--accent); margin-bottom: 1.5rem;" />
    <h2 class="font-display" style="font-size: 1.75rem; font-weight: 900; margin-bottom: 0.75rem;">
      Booking Opens at Launch
    </h2>
    <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto; line-height: 1.7;">
      Reserve flat bays, hoist bays, and the detail bay directly from the scheduling system.
      You'll be able to book by the hour, day, or week — and pay securely through Square.
    </p>

    <div class="features-list">
      <div class="feature-row">
        <Clock size={16} style="color: var(--accent);" />
        <span>Hourly, daily, and weekly booking options</span>
      </div>
      <div class="feature-row">
        <CalendarDays size={16} style="color: var(--accent);" />
        <span>Real-time bay availability calendar</span>
      </div>
    </div>
  </div>
</div>

<style>
  .page { padding: 2.5rem; max-width: 800px; }
  @media (max-width: 768px) { .page { padding: 1.5rem 1.25rem; } }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    text-decoration: none;
    margin-bottom: 1.5rem;
    transition: color 0.15s;
  }
  .back-link:hover { color: var(--text-secondary); }

  .page-title {
    font-size: 2.25rem;
    font-weight: 900;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    line-height: 1.1;
  }

  .page-sub {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .coming-card {
    padding: 3rem 2rem;
    text-align: center;
  }

  .features-list {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    text-align: left;
    max-width: 360px;
    margin-inline: auto;
  }

  .feature-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9375rem;
    color: var(--text-secondary);
  }
</style>
