<script lang="ts">
  import { ArrowLeft, CalendarDays, Clock, Car, CheckCircle2, XCircle, Loader2 } from 'lucide-svelte';
  import { onMount } from 'svelte';

  const BAYS = [1, 2, 3, 4, 5] as const;
  type Bay = (typeof BAYS)[number];

  const VARIATIONS = [
    { key: 'min90', label: '90 min', sub: '$40', duration: 90 },
    { key: 'hr3',   label: '3 hours', sub: '$60', duration: 180 }
  ] as const;
  type VariationKey = 'min90' | 'hr3';

  interface Slot {
    startAt: string;
    appointmentSegments: unknown[];
  }

  interface Booking {
    id: string;
    startAt: string;
    status: string;
    appointmentSegments: Array<{ teamMemberId: string }>;
    customerNote: string;
  }

  // ── State ───────────────────────────────────────────────────────────────────
  let selectedBay = $state<Bay | null>(null);
  let selectedVariation = $state<VariationKey>('min90');
  let selectedDate = $state<string>(todayStr());
  let selectedSlot = $state<string | null>(null);

  let slots = $state<Slot[]>([]);
  let slotsLoading = $state(false);
  let slotsError = $state<string | null>(null);

  let bookingState = $state<'idle' | 'confirming' | 'booking' | 'success' | 'error'>('idle');
  let bookingId = $state<string | null>(null);
  let bookingError = $state<string | null>(null);

  let upcomingBookings = $state<Booking[]>([]);
  let bookingsLoading = $state(true);

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function minDate() {
    return todayStr();
  }

  /** Load availability whenever bay, variation, or date changes. */
  $effect(() => {
    if (!selectedBay) { slots = []; return; }
    void fetchSlots(selectedBay, selectedVariation, selectedDate);
  });

  async function fetchSlots(bay: Bay, variation: VariationKey, date: string) {
    slotsLoading = true;
    slotsError = null;
    slots = [];
    selectedSlot = null;

    try {
      const res = await fetch('/api/bookings/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bayNumber: bay, variationKey: variation, date })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      slots = data.slots ?? [];
    } catch (e: unknown) {
      slotsError = e instanceof Error ? e.message : 'Failed to load availability';
    } finally {
      slotsLoading = false;
    }
  }

  async function confirmBooking() {
    if (!selectedSlot || !selectedBay) return;
    bookingState = 'booking';
    bookingError = null;

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bayNumber: selectedBay,
          variationKey: selectedVariation,
          startAt: selectedSlot
        })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      bookingId = data.bookingId;
      bookingState = 'success';
      // Refresh upcoming bookings
      void fetchUpcoming();
    } catch (e: unknown) {
      bookingError = e instanceof Error ? e.message : 'Booking failed';
      bookingState = 'error';
    }
  }

  async function fetchUpcoming() {
    bookingsLoading = true;
    try {
      const res = await fetch('/api/bookings/list');
      if (res.ok) {
        const data = await res.json();
        upcomingBookings = data.bookings ?? [];
      }
    } finally {
      bookingsLoading = false;
    }
  }

  function resetBooking() {
    bookingState = 'idle';
    bookingId = null;
    bookingError = null;
    selectedSlot = null;
    if (selectedBay) void fetchSlots(selectedBay, selectedVariation, selectedDate);
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function bayLabel(teamMemberId: string) {
    const map: Record<string, string> = {
      TMKSGvOnHLXY9Qf1: 'Bay 1', TMAQYKApwSTWO88t: 'Bay 2',
      TMwAqjOFVf517b3h: 'Bay 3', TMTjzsKd1G7PU43M: 'Bay 4',
      'TM4sarrWNHu5-kXb': 'Bay 5'
    };
    return map[teamMemberId] ?? 'Bay';
  }

  onMount(() => { void fetchUpcoming(); });
</script>

<svelte:head>
  <title>Bay Reservations — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
  <div class="page-header">
    <a href="/app/dashboard" class="back-link"><ArrowLeft size={16} /> Dashboard</a>
    <h1 class="page-title font-display">Bay Reservations</h1>
  </div>

  <!-- ── Upcoming bookings ─────────────────────────────────────────────── -->
  {#if !bookingsLoading && upcomingBookings.length > 0}
    <section class="upcoming">
      <h2 class="section-label">Your Bookings</h2>
      <div class="booking-list">
        {#each upcomingBookings as b}
          <div class="booking-chip">
            <CalendarDays size={14} class="chip-icon" />
            <div class="chip-info">
              <span class="chip-date">{fmtDate(b.startAt)}</span>
              <span class="chip-time">{fmtTime(b.startAt)}</span>
            </div>
            <span class="chip-bay">
              {bayLabel(b.appointmentSegments?.[0]?.teamMemberId ?? '')}
            </span>
            <span class="chip-status" class:confirmed={b.status === 'ACCEPTED' || b.status === 'APPROVED'}>
              {b.status?.toLowerCase().replace(/_/g, ' ')}
            </span>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- ── Booking form ──────────────────────────────────────────────────── -->
  <section class="booking-section card">
    <h2 class="section-label" style="margin-bottom: 1.5rem;">Book a Bay</h2>

    {#if bookingState === 'success'}
      <!-- Success state -->
      <div class="result-state">
        <CheckCircle2 size={48} style="color: #22c55e; margin-bottom: 1rem;" />
        <h3 class="result-title">Bay reserved!</h3>
        <p class="result-sub">Booking #{bookingId?.slice(0, 8)} confirmed.</p>
        <button class="btn btn-outline" onclick={resetBooking}>Book Another</button>
      </div>

    {:else if bookingState === 'error'}
      <!-- Error state -->
      <div class="result-state">
        <XCircle size={48} style="color: #ef4444; margin-bottom: 1rem;" />
        <h3 class="result-title">Booking failed</h3>
        <p class="result-sub">{bookingError}</p>
        <button class="btn btn-outline" onclick={resetBooking}>Try Again</button>
      </div>

    {:else}
      <!-- ── Step 1: Bay + Duration ───────────────────────────────── -->
      <div class="step">
        <p class="step-label">Select Bay</p>
        <div class="bay-grid">
          {#each BAYS as bay}
            <button
              class="bay-btn"
              class:selected={selectedBay === bay}
              onclick={() => { selectedBay = bay; selectedSlot = null; }}
            >
              <Car size={16} />
              <span>Bay {bay}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="step">
        <p class="step-label">Duration</p>
        <div class="var-grid">
          {#each VARIATIONS as v}
            <button
              class="var-btn"
              class:selected={selectedVariation === v.key}
              onclick={() => { selectedVariation = v.key; selectedSlot = null; }}
            >
              <Clock size={14} />
              <span class="var-label">{v.label}</span>
              <span class="var-price">{v.sub}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- ── Step 2: Date ────────────────────────────────────────── -->
      {#if selectedBay}
        <div class="step">
          <p class="step-label">Date</p>
          <input
            type="date"
            class="date-input input"
            bind:value={selectedDate}
            min={minDate()}
          />
        </div>

        <!-- ── Step 3: Time slots ──────────────────────────────── -->
        <div class="step">
          <p class="step-label">Available Times</p>

          {#if slotsLoading}
            <div class="slots-loading">
              <Loader2 size={20} class="spin" />
              <span>Loading availability…</span>
            </div>
          {:else if slotsError}
            <div class="slots-error">{slotsError}</div>
          {:else if slots.length === 0}
            <div class="slots-empty">No availability for this date. Try another day.</div>
          {:else}
            <div class="slots-grid">
              {#each slots as slot}
                <button
                  class="slot-btn"
                  class:selected={selectedSlot === slot.startAt}
                  onclick={() => { selectedSlot = slot.startAt; bookingState = 'confirming'; }}
                >
                  {fmtTime(slot.startAt ?? '')}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- ── Confirmation panel ──────────────────────────────────── -->
      {#if bookingState === 'confirming' && selectedSlot && selectedBay}
        <div class="confirm-panel">
          <p class="confirm-title">Confirm your reservation</p>
          <div class="confirm-row">
            <span>Bay</span><strong>Bay {selectedBay}</strong>
          </div>
          <div class="confirm-row">
            <span>Duration</span>
            <strong>{selectedVariation === 'min90' ? '90 min' : '3 hours'}</strong>
          </div>
          <div class="confirm-row">
            <span>Date</span><strong>{fmtDate(selectedSlot)}</strong>
          </div>
          <div class="confirm-row">
            <span>Time</span><strong>{fmtTime(selectedSlot)}</strong>
          </div>
          <div class="confirm-row">
            <span>Price</span>
            <strong>{selectedVariation === 'min90' ? '$40' : '$60'}</strong>
          </div>

          <div class="confirm-actions">
            <button
              class="btn btn-primary"
              onclick={confirmBooking}
              disabled={bookingState === 'booking'}
            >
              {#if bookingState === 'booking'}
                <Loader2 size={16} class="spin" /> Booking…
              {:else}
                Confirm Reservation
              {/if}
            </button>
            <button class="btn btn-ghost" onclick={() => { bookingState = 'idle'; selectedSlot = null; }}>
              Cancel
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </section>
</div>

<style>
  .page { padding: 2.5rem; max-width: 760px; }
  @media (max-width: 768px) { .page { padding: 1.5rem 1.25rem; } }

  .back-link {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-size: 0.875rem; color: var(--text-muted); text-decoration: none;
    margin-bottom: 1.5rem; transition: color 0.15s;
  }
  .back-link:hover { color: var(--text-secondary); }

  .page-title {
    font-size: 2.25rem; font-weight: 900; color: var(--text-primary);
    margin-bottom: 2rem; line-height: 1.1;
  }

  /* ── Upcoming bookings ────────────── */
  .upcoming { margin-bottom: 2rem; }

  .section-label {
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.875rem;
  }

  .booking-list { display: flex; flex-direction: column; gap: 0.625rem; }

  .booking-chip {
    display: flex; align-items: center; gap: 0.875rem;
    padding: 0.875rem 1.125rem;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 0.625rem;
  }

  :global(.chip-icon) { color: var(--accent); flex-shrink: 0; }

  .chip-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .chip-date { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
  .chip-time { font-size: 0.8125rem; color: var(--text-muted); }
  .chip-bay { font-size: 0.875rem; font-weight: 600; color: var(--accent); flex-shrink: 0; }
  .chip-status {
    font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize;
    background: var(--bg-elevated); padding: 0.2rem 0.625rem; border-radius: 999px;
    flex-shrink: 0;
  }
  .chip-status.confirmed { color: #22c55e; background: rgba(34,197,94,0.1); }

  /* ── Booking card ─────────────────── */
  .booking-section { padding: 2rem; }
  @media (max-width: 768px) { .booking-section { padding: 1.5rem 1.25rem; } }

  .step { margin-bottom: 2rem; }

  .step-label {
    font-size: 0.8125rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.75rem;
  }

  /* Bay selector */
  .bay-grid {
    display: flex; flex-wrap: wrap; gap: 0.625rem;
  }

  .bay-btn {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.625rem 1.125rem; border-radius: 0.5rem;
    border: 1px solid var(--border); background: var(--bg-elevated);
    color: var(--text-secondary); font-size: 0.9rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .bay-btn:hover { border-color: var(--accent-border); color: var(--accent); }
  .bay-btn.selected {
    border-color: var(--accent); background: var(--accent-muted);
    color: var(--accent); font-weight: 700;
  }

  /* Duration selector */
  .var-grid { display: flex; gap: 0.75rem; flex-wrap: wrap; }

  .var-btn {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.75rem 1.25rem; border-radius: 0.5rem;
    border: 1px solid var(--border); background: var(--bg-elevated);
    color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
  }
  .var-btn:hover { border-color: var(--accent-border); }
  .var-btn.selected { border-color: var(--accent); background: var(--accent-muted); color: var(--text-primary); }

  .var-label { font-weight: 600; font-size: 0.9375rem; }
  .var-price { font-size: 0.8125rem; color: var(--accent); margin-left: 0.25rem; }

  /* Date input */
  .date-input { max-width: 200px; }

  /* Slots */
  .slots-loading, .slots-empty, .slots-error {
    display: flex; align-items: center; gap: 0.625rem;
    padding: 1rem; border-radius: 0.5rem;
    font-size: 0.9rem; color: var(--text-muted);
    background: var(--bg-elevated); border: 1px solid var(--border);
  }
  .slots-error { color: #fca5a5; border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.06); }

  .slots-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }

  .slot-btn {
    padding: 0.5rem 1rem; border-radius: 0.375rem;
    border: 1px solid var(--border); background: var(--bg-elevated);
    color: var(--text-secondary); font-size: 0.875rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .slot-btn:hover { border-color: var(--accent-border); color: var(--accent); }
  .slot-btn.selected { border-color: var(--accent); background: var(--accent-muted); color: var(--accent); font-weight: 700; }

  /* Confirmation */
  .confirm-panel {
    margin-top: 1rem; padding: 1.5rem;
    background: var(--bg-elevated); border: 1px solid var(--accent-border);
    border-radius: 0.75rem;
  }

  .confirm-title {
    font-size: 0.875rem; font-weight: 700; color: var(--text-primary);
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem;
  }

  .confirm-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.5rem 0; border-bottom: 1px solid var(--border);
    font-size: 0.9rem;
  }
  .confirm-row:last-of-type { border-bottom: none; }
  .confirm-row span { color: var(--text-muted); }
  .confirm-row strong { color: var(--text-primary); }

  .confirm-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; flex-wrap: wrap; }

  /* Result states */
  .result-state {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding: 2rem 1rem;
  }

  .result-title { font-size: 1.5rem; font-weight: 900; color: var(--text-primary); margin-bottom: 0.5rem; }
  .result-sub { color: var(--text-secondary); font-size: 0.9375rem; margin-bottom: 1.5rem; }

  /* Spinner */
  :global(.spin) { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
