<script lang="ts">
  import { CalendarDays, Clock, Car, CheckCircle2, XCircle, Loader2, X } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import PaymentStep from '$lib/components/app/PaymentStep.svelte';
  import BackLink from '$lib/components/app/BackLink.svelte';
  import { extractErrorMessage } from '$lib/utils';
  import { HIDE_DETAIL_BAY } from '$lib/features';

  type BayType = 'flat' | 'detail' | 'hoist';
  type BayInfo = { id: number; type: BayType; label: string };

  interface Props {
    data: {
      bays: BayInfo[];
      hourlyRate: Record<BayType, number>;
      typeLabel: Record<BayType, string>;
      square: { appId: string; locationId: string; environment: 'sandbox' | 'production' };
    };
  }
  const { data }: Props = $props();

  interface Slot {
    startAt: string;
    teamMemberId: string;
    bayNumber: number;
    durationMinutes: number;
    serviceVariationId: string;
  }

  interface Booking {
    id: string;
    version: number;
    startAt: string;
    status: string;
    appointmentSegments: Array<{ teamMemberId: string }>;
    customerNote: string;
  }

  // ── State ────────────────────────────────────────────────────────────────
  let selectedBayType = $state<BayType>('flat');
  let selectedHours   = $state<number>(2);
  /** null = "Any" of the chosen bay type */
  let selectedBay     = $state<number | null>(null);
  let selectedDate    = $state<string>(todayStr());
  let selectedSlot    = $state<Slot | null>(null);

  let slots         = $state<Slot[]>([]);
  let slotsLoading  = $state(false);
  let slotsError    = $state<string | null>(null);

  let bookingState  = $state<'idle' | 'confirming' | 'paying' | 'booking' | 'success' | 'error'>('idle');
  let bookingId     = $state<string | null>(null);
  let bookingError  = $state<string | null>(null);
  let lastReceipt   = $state<{ amountCents: number; cardSaved: boolean } | null>(null);

  let upcomingBookings = $state<Booking[]>([]);
  let bookingsLoading  = $state(true);

  /** Cancellation state — booking ID currently being acted on, plus any error */
  let cancelTargetId = $state<string | null>(null);
  let cancelInFlight = $state(false);
  let cancelError    = $state<string | null>(null);
  let cancelToast    = $state<string | null>(null);
  let cancelConfirmEl = $state<HTMLDivElement | null>(null);
  let cancelToastTimer: ReturnType<typeof setTimeout> | null = null;

  /** Close the inline cancel panel on Escape; focus confirm button when opened. */
  $effect(() => {
    if (cancelTargetId && cancelConfirmEl) {
      // Focus the destructive action once the panel mounts so keyboard users
      // don't have to tab through the chip. But land on Keep first for safety.
      const keep = cancelConfirmEl.querySelector<HTMLButtonElement>('[data-cancel-keep]');
      keep?.focus();
    }
  });

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && cancelTargetId && !cancelInFlight) {
      cancelTargetId = null;
      cancelError = null;
    }
  }

  function dismissToast() {
    cancelToast = null;
    if (cancelToastTimer) { clearTimeout(cancelToastTimer); cancelToastTimer = null; }
  }

  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function minDate()  { return todayStr(); }

  // Bays narrowed to the selected type
  let baysOfType = $derived(data.bays.filter(b => b.type === selectedBayType));

  // Reset specific-bay selection when type changes if it no longer fits
  $effect(() => {
    const _t = selectedBayType;
    if (selectedBay !== null && !baysOfType.some(b => b.id === selectedBay)) {
      selectedBay = null;
    }
  });

  /** Estimated total for the chosen type + hours (linear pricing). */
  let estimatedPrice = $derived(data.hourlyRate[selectedBayType] * selectedHours);

  /** Load availability whenever inputs change. */
  $effect(() => {
    const _type = selectedBayType;
    const _hrs = selectedHours;
    const _bay = selectedBay;
    const _date = selectedDate;
    void fetchSlots(_type, _hrs, _bay, _date);
  });

  async function fetchSlots(bayType: BayType, hours: number, bayNumber: number | null, date: string) {
    slotsLoading = true;
    slotsError = null;
    slots = [];
    selectedSlot = null;

    try {
      const payload: Record<string, unknown> = { bayType, hours, date };
      if (bayNumber) payload.bayNumber = bayNumber;

      const res = await fetch('/api/bookings/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res));
      }
      const json = await res.json();
      slots = json.slots ?? [];
    } catch (e: unknown) {
      slotsError = e instanceof Error ? e.message : 'Failed to load availability';
    } finally {
      slotsLoading = false;
    }
  }

  async function confirmAndPay(payload: { sourceId: string; saveCard: boolean }) {
    if (!selectedSlot) return;
    bookingState = 'booking';
    bookingError = null;

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bayNumber: selectedSlot.bayNumber,
          bayType: selectedBayType,
          hours: selectedHours,
          startAt: selectedSlot.startAt,
          sourceId: payload.sourceId,
          saveCard: payload.saveCard
        })
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res));
      }
      const json = await res.json();
      bookingId = json.bookingId;
      lastReceipt = { amountCents: json.amountCents ?? 0, cardSaved: !!json.savedCardId };
      bookingState = 'success';
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
        const json = await res.json();
        upcomingBookings = json.bookings ?? [];
      }
    } finally {
      bookingsLoading = false;
    }
  }

  /** Hours until the booking starts, for the 24h-cancellation policy hint. */
  function hoursUntil(iso: string): number {
    const ms = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / (60 * 60 * 1000)));
  }
  function canCancel(b: Booking): boolean {
    return hoursUntil(b.startAt) >= 24;
  }

  async function cancelBooking(b: Booking) {
    cancelInFlight = true;
    cancelError = null;
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: b.id })
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res));
      }
      const data = await res.json().catch(() => ({}));
      const refunded = data.refundedCents ?? 0;
      cancelToast = refunded > 0
        ? `Cancelled. ${formatPrice(refunded)} refunded to your card.`
        : 'Cancelled.';
      cancelTargetId = null;
      await fetchUpcoming();
      // Auto-clear toast (user can dismiss manually too)
      if (cancelToastTimer) clearTimeout(cancelToastTimer);
      cancelToastTimer = setTimeout(() => { cancelToast = null; cancelToastTimer = null; }, 6000);
    } catch (e: unknown) {
      cancelError = e instanceof Error ? e.message : 'Cancel failed';
    } finally {
      cancelInFlight = false;
    }
  }

  function resetBooking() {
    bookingState = 'idle';
    bookingId = null;
    bookingError = null;
    lastReceipt = null;
    selectedSlot = null;
    void fetchSlots(selectedBayType, selectedHours, selectedBay, selectedDate);
  }

  function formatPrice(cents: number): string {
    const hasCents = cents % 100 !== 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD',
      minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: hasCents ? 2 : 0 }).format(cents / 100);
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function bayLabelById(id: number) {
    return data.bays.find(b => b.id === id)?.label ?? `Bay ${id}`;
  }
  function bayTypeLabel(t: BayType) { return data.typeLabel[t]; }

  /** Deduplicate "Any Bay" slots by startAt — keep the lowest-numbered bay. */
  function dedupeSlots(allSlots: Slot[]): Slot[] {
    const seen = new Map<string, Slot>();
    for (const s of allSlots) {
      if (!seen.has(s.startAt) || s.bayNumber < seen.get(s.startAt)!.bayNumber) {
        seen.set(s.startAt, s);
      }
    }
    return [...seen.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
  }

  let displaySlots = $derived(selectedBay ? slots : dedupeSlots(slots));

  onMount(() => { void fetchUpcoming(); });

  const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
  const BAY_TYPES: BayType[] = HIDE_DETAIL_BAY
    ? ['flat', 'hoist']
    : ['flat', 'detail', 'hoist'];
</script>

<svelte:head>
  <title>Bay Reservations — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<div class="page">
  <div class="page-header">
    <BackLink href="/app/dashboard" label="Dashboard" />
    <h1 class="page-title font-display">Bay Reservations</h1>
  </div>

  {#if cancelToast}
    <div class="toast toast-success" role="status">
      <span class="toast-msg">{cancelToast}</span>
      <button type="button" class="toast-close" onclick={dismissToast} aria-label="Dismiss notification">
        <X size={14} />
      </button>
    </div>
  {/if}

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
            <span class="chip-bay">{b.customerNote || 'Bay reservation'}</span>
            <span class="chip-status" class:confirmed={b.status === 'ACCEPTED' || b.status === 'APPROVED'}>
              {b.status?.toLowerCase().replace(/_/g, ' ')}
            </span>

            {#if canCancel(b)}
              <button
                type="button"
                class="chip-cancel-btn"
                title="Cancel booking"
                aria-label="Cancel booking"
                onclick={() => { cancelTargetId = b.id; cancelError = null; }}
              >
                <X size={14} />
              </button>
            {:else}
              <span class="chip-locked" title="Cancellations require 24h notice">
                {hoursUntil(b.startAt)}h to start
              </span>
            {/if}
          </div>

          {#if cancelTargetId === b.id}
            <div
              class="cancel-confirm"
              role="group"
              aria-labelledby="cancel-confirm-title-{b.id}"
              bind:this={cancelConfirmEl}
            >
              <p id="cancel-confirm-title-{b.id}" class="cancel-confirm-title">Cancel this booking?</p>
              <p class="cancel-confirm-body">
                Your card will be refunded the full amount ({hoursUntil(b.startAt)}h until start).
                Press <kbd>Esc</kbd> to keep it.
              </p>
              {#if cancelError}
                <p class="cancel-error" role="alert">{cancelError}</p>
              {/if}
              <div class="cancel-actions">
                <button class="btn btn-primary" onclick={() => cancelBooking(b)} disabled={cancelInFlight}>
                  {#if cancelInFlight}
                    <Loader2 size={14} class="spin" /> Cancelling…
                  {:else}
                    Yes, cancel & refund
                  {/if}
                </button>
                <button
                  class="btn btn-ghost"
                  data-cancel-keep
                  onclick={() => { cancelTargetId = null; cancelError = null; }}
                >
                  Keep booking
                </button>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

  <section class="booking-section card">
    <h2 class="section-label" style="margin-bottom: 1.5rem;">Book a Bay</h2>

    {#if bookingState === 'success'}
      <div class="result-state">
        <CheckCircle2 size={48} style="color: #22c55e; margin-bottom: 1rem;" />
        <h3 class="result-title">Bay reserved!</h3>
        <p class="result-sub">
          {#if lastReceipt}
            Charged {formatPrice(lastReceipt.amountCents)}{lastReceipt.cardSaved ? ' · card saved for next time' : ''}.
          {/if}
          Booking #{bookingId?.slice(0, 8)} confirmed.
        </p>
        <button class="btn btn-outline" onclick={resetBooking}>Book Another</button>
      </div>

    {:else if bookingState === 'error'}
      <div class="result-state">
        <XCircle size={48} style="color: #ef4444; margin-bottom: 1rem;" />
        <h3 class="result-title">Booking failed</h3>
        <p class="result-sub">{bookingError}</p>
        <button class="btn btn-outline" onclick={resetBooking}>Try Again</button>
      </div>

    {:else}
      <!-- Step 1: Bay type -->
      <div class="step">
        <p class="step-label">Bay Type</p>
        <div class="type-grid">
          {#each BAY_TYPES as t}
            <button
              class="type-btn"
              class:selected={selectedBayType === t}
              onclick={() => { selectedBayType = t; selectedSlot = null; }}
            >
              <span class="type-name">{bayTypeLabel(t)}</span>
              <span class="type-rate">${data.hourlyRate[t]}/hr</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Step 2: Specific bay (optional) -->
      <div class="step">
        <p class="step-label">Bay</p>
        <div class="bay-grid">
          <button class="bay-btn" class:selected={selectedBay === null}
            onclick={() => { selectedBay = null; selectedSlot = null; }}>
            <Car size={16} />
            <span>Any {bayTypeLabel(selectedBayType)}</span>
          </button>
          {#each baysOfType as bay}
            <button class="bay-btn" class:selected={selectedBay === bay.id}
              onclick={() => { selectedBay = bay.id; selectedSlot = null; }}>
              <Car size={16} />
              <span>{bay.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Step 3: Hours -->
      <div class="step">
        <p class="step-label">Duration</p>
        <div class="hours-grid">
          {#each HOUR_OPTIONS as h}
            <button
              class="hour-btn"
              class:selected={selectedHours === h}
              onclick={() => { selectedHours = h; selectedSlot = null; }}
            >
              <Clock size={14} />
              <span class="hour-label">{h}{h === 1 ? ' hr' : ' hrs'}</span>
              <span class="hour-price">${data.hourlyRate[selectedBayType] * h}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Step 4: Date -->
      <div class="step">
        <p class="step-label">Date</p>
        <input type="date" class="date-input input" bind:value={selectedDate} min={minDate()} />
      </div>

      <!-- Step 5: Time slots -->
      <div class="step">
        <p class="step-label">Available Times</p>

        {#if slotsLoading}
          <div class="slots-loading"><Loader2 size={20} class="spin" /><span>Loading availability…</span></div>
        {:else if slotsError}
          <div class="slots-error">{slotsError}</div>
        {:else if displaySlots.length === 0}
          <div class="slots-empty">No availability for this date. Try another day or duration.</div>
        {:else}
          <div class="slots-grid">
            {#each displaySlots as slot}
              <button
                class="slot-btn"
                class:selected={selectedSlot?.startAt === slot.startAt}
                aria-label={`${fmtTime(slot.startAt ?? '')} at ${bayLabelById(slot.bayNumber)}, select slot`}
                onclick={() => { selectedSlot = slot; bookingState = 'confirming'; }}
              >
                <span class="slot-time">{fmtTime(slot.startAt ?? '')}</span>
                <span class="slot-bay">{bayLabelById(slot.bayNumber)}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      {#if selectedSlot && (bookingState === 'confirming' || bookingState === 'paying' || bookingState === 'booking')}
        <div class="confirm-panel">
          <p class="confirm-title">Confirm your reservation</p>
          <div class="confirm-row"><span>Bay</span><strong>{bayLabelById(selectedSlot.bayNumber)}</strong></div>
          <div class="confirm-row"><span>Duration</span><strong>{selectedHours}{selectedHours === 1 ? ' hour' : ' hours'}</strong></div>
          <div class="confirm-row"><span>Date</span><strong>{fmtDate(selectedSlot.startAt)}</strong></div>
          <div class="confirm-row"><span>Time</span><strong>{fmtTime(selectedSlot.startAt)}</strong></div>
          <div class="confirm-row"><span>Price</span><strong>{formatPrice(estimatedPrice * 100)}</strong></div>

          {#if bookingState === 'confirming'}
            <div class="confirm-actions">
              <button class="btn btn-primary" onclick={() => { bookingState = 'paying'; }}>
                Continue to Payment
              </button>
              <button class="btn btn-ghost" onclick={() => { bookingState = 'idle'; selectedSlot = null; }}>
                Back
              </button>
            </div>
          {:else}
            <PaymentStep
              appId={data.square.appId}
              locationId={data.square.locationId}
              environment={data.square.environment}
              amountCents={estimatedPrice * 100}
              submitLabel={`Pay ${formatPrice(estimatedPrice * 100)} & Book`}
              submitting={bookingState === 'booking'}
              error={bookingError}
              onsubmit={confirmAndPay}
              oncancel={() => { bookingState = 'confirming'; bookingError = null; }}
            />
          {/if}
        </div>
      {/if}
    {/if}
  </section>
</div>

<style>
  .page { padding: 2.5rem; max-width: 760px; margin: 0 auto; }
  @media (max-width: 768px) { .page { padding: 1.5rem 1.25rem; } }

  .page-title {
    font-size: 2.25rem; font-weight: 900; color: var(--text-primary);
    margin-bottom: 2rem; line-height: 1.1;
  }

  .section-label {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.75rem;
  }

  /* Upcoming bookings */
  .upcoming { margin-bottom: 2rem; }
  .booking-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .booking-chip {
    display: flex; align-items: center; gap: 0.875rem;
    padding: 0.75rem 1rem; background: var(--bg-card);
    border: 1px solid var(--border); border-radius: 0.625rem;
  }
  .chip-icon { color: var(--accent); flex-shrink: 0; }
  .chip-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .chip-date { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
  .chip-time { font-size: 0.75rem; color: var(--text-muted); }
  .chip-bay { font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
  .chip-status {
    font-size: 0.6875rem; padding: 0.25rem 0.5rem;
    border-radius: 999px; background: var(--bg-secondary);
    color: var(--text-muted); text-transform: capitalize;
  }
  .chip-status.confirmed { background: rgba(34, 197, 94, 0.15); color: #22c55e; }

  .chip-cancel-btn {
    width: 36px; height: 36px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 6px; border: 1px solid transparent;
    background: transparent; color: var(--text-muted);
    cursor: pointer; transition: all 0.15s;
  }
  .chip-cancel-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }

  .chip-locked {
    font-size: 0.6875rem;
    color: var(--text-muted);
    padding: 0.25rem 0.5rem;
    background: var(--bg-secondary);
    border-radius: 999px;
  }

  .cancel-confirm {
    margin-top: -0.25rem;
    margin-bottom: 0.5rem;
    padding: 0.875rem 1rem;
    background: rgba(239, 68, 68, 0.07);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 0.625rem;
  }
  .cancel-confirm-title {
    font-size: 0.875rem; font-weight: 600;
    color: var(--text-primary); margin-bottom: 0.25rem;
  }
  .cancel-confirm-body {
    font-size: 0.8125rem; color: var(--text-secondary);
    margin-bottom: 0.75rem;
  }
  .cancel-error {
    font-size: 0.8125rem; color: #ef4444;
    margin-bottom: 0.5rem;
  }
  .cancel-actions { display: flex; gap: 0.5rem; }

  .toast {
    display: flex; align-items: center; gap: 0.75rem;
    margin: 0 0 1.25rem;
    padding: 0.75rem 1rem;
    border-radius: 0.625rem;
    font-size: 0.875rem;
  }
  .toast-msg { flex: 1; }
  .toast-close {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    background: transparent; border: none; border-radius: 0.375rem;
    color: inherit; opacity: 0.7; cursor: pointer;
    transition: opacity 0.15s, background 0.15s;
  }
  .toast-close:hover { opacity: 1; background: rgba(255, 255, 255, 0.08); }
  .toast-success {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
  }

  .cancel-confirm kbd {
    display: inline-block;
    padding: 0 0.35rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    font-size: 0.6875rem;
    font-family: var(--font-mono, ui-monospace, monospace);
    color: var(--text-muted);
  }

  /* Booking form */
  .booking-section { padding: 2rem; }
  @media (max-width: 768px) { .booking-section { padding: 1.5rem; } }

  .step { margin-bottom: 1.5rem; }
  .step-label {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.625rem;
  }

  /* Bay-type pills */
  .type-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;
  }
  .type-btn {
    display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem;
    padding: 0.875rem 1rem; background: var(--bg-card);
    border: 1px solid var(--border); border-radius: 0.5rem;
    color: var(--text-secondary); cursor: pointer;
    transition: all 0.15s;
  }
  .type-btn:hover { border-color: var(--accent); color: var(--text-primary); }
  .type-btn.selected {
    background: var(--accent-muted); border-color: var(--accent);
    color: var(--text-primary);
  }
  .type-name { font-size: 0.9375rem; font-weight: 700; }
  .type-rate { font-size: 0.75rem; color: var(--text-muted); }
  .type-btn.selected .type-rate { color: var(--accent-text); }

  /* Bay grid */
  .bay-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .bay-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.625rem 0.875rem; background: var(--bg-card);
    border: 1px solid var(--border); border-radius: 0.5rem;
    color: var(--text-secondary); cursor: pointer;
    font-size: 0.875rem; transition: all 0.15s;
  }
  .bay-btn:hover { border-color: var(--accent); color: var(--text-primary); }
  .bay-btn.selected { background: var(--accent-muted); border-color: var(--accent); color: var(--text-primary); }

  /* Hour grid */
  .hours-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;
  }
  @media (max-width: 480px) { .hours-grid { grid-template-columns: repeat(2, 1fr); } }
  .hour-btn {
    display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
    padding: 0.625rem 0.5rem; background: var(--bg-card);
    border: 1px solid var(--border); border-radius: 0.5rem;
    color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
  }
  .hour-btn:hover { border-color: var(--accent); color: var(--text-primary); }
  .hour-btn.selected { background: var(--accent-muted); border-color: var(--accent); color: var(--text-primary); }
  .hour-label { font-size: 0.8125rem; font-weight: 600; }
  .hour-price { font-size: 0.6875rem; color: var(--text-muted); }
  .hour-btn.selected .hour-price { color: var(--accent-text); }

  /* Date */
  .date-input {
    width: 100%; max-width: 220px; padding: 0.625rem 0.875rem;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 0.5rem; color: var(--text-primary); font-size: 0.9375rem;
  }

  /* Slots */
  .slots-loading, .slots-error, .slots-empty {
    padding: 1rem; background: var(--bg-card);
    border: 1px solid var(--border); border-radius: 0.5rem;
    color: var(--text-muted); font-size: 0.875rem;
    display: flex; align-items: center; gap: 0.625rem;
  }
  .slots-error { color: #ef4444; }

  .slots-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 0.5rem;
  }
  .slot-btn {
    display: flex; flex-direction: column; align-items: center; gap: 0.125rem;
    padding: 0.625rem 0.5rem; background: var(--bg-card);
    border: 1px solid var(--border); border-radius: 0.5rem;
    color: var(--text-primary); cursor: pointer; transition: all 0.15s;
  }
  .slot-btn:hover { border-color: var(--accent); }
  .slot-btn.selected { background: var(--accent); color: white; border-color: var(--accent); }
  .slot-time { font-size: 0.875rem; font-weight: 600; }
  .slot-bay { font-size: 0.6875rem; color: var(--text-muted); }
  .slot-btn.selected .slot-bay { color: rgba(255, 255, 255, 0.8); }

  /* Confirmation */
  .confirm-panel {
    margin-top: 1.5rem; padding: 1.5rem;
    background: var(--bg-card); border: 1px solid var(--accent);
    border-radius: 0.625rem;
  }
  .confirm-title {
    font-size: 0.875rem; font-weight: 700; color: var(--text-primary);
    margin-bottom: 1rem;
  }
  .confirm-row {
    display: flex; justify-content: space-between;
    padding: 0.5rem 0; font-size: 0.875rem;
    border-bottom: 1px solid var(--border);
  }
  .confirm-row:last-of-type { border-bottom: none; margin-bottom: 0.75rem; }
  .confirm-row span { color: var(--text-muted); }
  .confirm-row strong { color: var(--text-primary); font-weight: 600; }

  .confirm-actions { display: flex; gap: 0.625rem; margin-top: 1rem; }

  /* Result states */
  .result-state {
    padding: 2.5rem 1rem; text-align: center;
    display: flex; flex-direction: column; align-items: center;
  }
  .result-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
  .result-sub { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.5rem; }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
