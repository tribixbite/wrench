<script lang="ts">
  /**
   * Square Web Payments SDK card-input + saved-card picker.
   *
   * Flow:
   *   - on mount: load https://web.squarecdn.com/v1/square.js, initialise payments,
   *     create a card field, fetch saved cards from /api/payments/cards
   *   - render: list of saved cards with radio select, plus "Use a new card"
   *   - on submit: if saved-card → emit { sourceId: card.id }; if new → tokenize
   *     via the SDK → emit { sourceId: nonce, saveCard: true }
   *
   * Errors surface inline; parent owns the actual booking submit.
   */
  import { onMount, onDestroy } from 'svelte';
  import { CreditCard, Lock, Loader2 } from 'lucide-svelte';

  type SavedCard = { id: string; brand: string; last4: string; expMonth: number; expYear: number; cardholderName: string };

  interface Props {
    appId: string;
    locationId: string;
    environment: 'sandbox' | 'production';
    amountCents: number;
    submitLabel: string;
    submitting: boolean;
    error?: string | null;
    onsubmit: (payload: { sourceId: string; saveCard: boolean }) => void;
    oncancel: () => void;
  }

  const { appId, locationId, environment, amountCents, submitLabel, submitting, error, onsubmit, oncancel }: Props = $props();

  let cards = $state<SavedCard[]>([]);
  let cardsLoaded = $state(false);
  let selectedCardId = $state<string | 'new'>('new');
  let saveNewCard = $state(true);

  let sdkReady = $state(false);
  let sdkError = $state<string | null>(null);
  let cardInstance: any = null;
  let payments: any = null;
  let cardElementId = `sq-card-${Math.random().toString(36).slice(2)}`;
  let tokenizing = $state(false);

  function brandLabel(brand: string): string {
    const m: Record<string, string> = { VISA: 'Visa', MASTERCARD: 'Mastercard', AMERICAN_EXPRESS: 'Amex', DISCOVER: 'Discover', JCB: 'JCB' };
    return m[brand] ?? brand;
  }
  function formatPrice(cents: number): string {
    const hasCents = cents % 100 !== 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD',
      minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: hasCents ? 2 : 0 }).format(cents / 100);
  }

  async function loadSquareSdk(): Promise<any> {
    if ((window as any).Square) return (window as any).Square;
    return new Promise((resolve, reject) => {
      const src = environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any).Square));
        existing.addEventListener('error', () => reject(new Error('Failed to load Square Web Payments SDK')));
        return;
      }
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.addEventListener('load', () => resolve((window as any).Square));
      s.addEventListener('error', () => reject(new Error('Failed to load Square Web Payments SDK')));
      document.head.appendChild(s);
    });
  }

  async function fetchSavedCards() {
    try {
      const r = await fetch('/api/payments/cards');
      if (r.ok) {
        const d = await r.json();
        cards = d.cards ?? [];
        if (cards.length > 0) selectedCardId = cards[0].id; // default to first saved card
      }
    } catch (e) {
      console.error('[PaymentStep] cards fetch failed:', e);
    } finally {
      cardsLoaded = true;
    }
  }

  async function initCardField() {
    try {
      const Square = await loadSquareSdk();
      if (!Square) throw new Error('Square SDK unavailable');
      payments = Square.payments(appId, locationId);
      cardInstance = await payments.card();
      const target = document.getElementById(cardElementId);
      if (target) await cardInstance.attach(`#${cardElementId}`);
      sdkReady = true;
    } catch (e) {
      sdkError = e instanceof Error ? e.message : 'Couldn\'t initialise card form';
      console.error('[PaymentStep] SDK init failed:', e);
    }
  }

  onMount(() => {
    void fetchSavedCards();
    void initCardField();
  });
  onDestroy(() => {
    if (cardInstance) try { cardInstance.destroy(); } catch {}
  });

  async function handleSubmit() {
    sdkError = null;
    if (selectedCardId !== 'new') {
      onsubmit({ sourceId: selectedCardId, saveCard: false });
      return;
    }
    if (!cardInstance) { sdkError = 'Card form is still loading — try again in a moment'; return; }
    tokenizing = true;
    try {
      const result = await cardInstance.tokenize();
      if (result.status === 'OK' && result.token) {
        onsubmit({ sourceId: result.token, saveCard: saveNewCard });
      } else {
        const msg = result.errors?.[0]?.message ?? 'Card details aren\'t valid — please check and try again';
        sdkError = msg;
      }
    } catch (e) {
      sdkError = e instanceof Error ? e.message : 'Card processing failed';
    } finally {
      tokenizing = false;
    }
  }
</script>

<div class="payment-step">
  <header class="pay-header">
    <div class="pay-amount">
      <span class="pay-label">Total</span>
      <span class="pay-value">{formatPrice(amountCents)}</span>
    </div>
    <span class="pay-secure"><Lock size={12} /> Secured by Square</span>
  </header>

  {#if cardsLoaded && cards.length > 0}
    <div class="card-list">
      {#each cards as c}
        <label class="card-row" class:selected={selectedCardId === c.id}>
          <input type="radio" name="paycard" value={c.id} bind:group={selectedCardId} />
          <CreditCard size={16} />
          <span class="card-brand">{brandLabel(c.brand)}</span>
          <span class="card-last4">•••• {c.last4}</span>
          <span class="card-exp">{String(c.expMonth).padStart(2, '0')}/{String(c.expYear).slice(-2)}</span>
        </label>
      {/each}
      <label class="card-row" class:selected={selectedCardId === 'new'}>
        <input type="radio" name="paycard" value="new" bind:group={selectedCardId} />
        <CreditCard size={16} />
        <span>Use a new card</span>
      </label>
    </div>
  {/if}

  {#if selectedCardId === 'new'}
    <div class="new-card">
      {#if !sdkReady && !sdkError}
        <div class="card-loading"><Loader2 size={14} class="spin" /> Loading secure card form…</div>
      {/if}
      <div id={cardElementId} class="sq-card-container" class:hidden={!sdkReady}></div>
      {#if sdkReady && cards.length === 0}
        <label class="save-card-toggle">
          <input type="checkbox" bind:checked={saveNewCard} />
          <span>Save this card for next time</span>
        </label>
      {/if}
    </div>
  {/if}

  {#if sdkError || error}
    <p class="pay-error">{sdkError ?? error}</p>
  {/if}

  <div class="pay-actions">
    <button
      type="button"
      class="btn btn-primary"
      disabled={submitting || tokenizing || (!sdkReady && selectedCardId === 'new')}
      onclick={handleSubmit}
    >
      {#if submitting || tokenizing}
        <Loader2 size={16} class="spin" /> Processing…
      {:else}
        {submitLabel}
      {/if}
    </button>
    <button type="button" class="btn btn-ghost" disabled={submitting || tokenizing} onclick={oncancel}>
      Back
    </button>
  </div>
</div>

<style>
  .payment-step {
    display: flex; flex-direction: column; gap: 1rem;
    padding: 1.25rem;
    background: var(--bg-card);
    border: 1px solid var(--accent);
    border-radius: 0.75rem;
  }
  .pay-header { display: flex; align-items: center; justify-content: space-between; }
  .pay-amount { display: flex; flex-direction: column; }
  .pay-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
  .pay-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); line-height: 1.1; }
  .pay-secure {
    display: inline-flex; align-items: center; gap: 0.25rem;
    font-size: 0.6875rem; color: var(--text-muted);
  }

  .card-list { display: flex; flex-direction: column; gap: 0.375rem; }
  .card-row {
    display: flex; align-items: center; gap: 0.625rem;
    padding: 0.625rem 0.75rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    cursor: pointer; font-size: 0.875rem;
    transition: all 0.15s;
  }
  .card-row:hover { border-color: var(--accent); }
  .card-row.selected { background: var(--accent-muted); border-color: var(--accent); }
  .card-row input[type="radio"] { accent-color: var(--accent); }
  .card-brand { font-weight: 600; color: var(--text-primary); }
  .card-last4 { color: var(--text-secondary); font-variant-numeric: tabular-nums; }
  .card-exp { margin-left: auto; font-size: 0.75rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }

  .new-card { display: flex; flex-direction: column; gap: 0.625rem; }
  .card-loading { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); }
  .sq-card-container {
    min-height: 90px;
    background: white; border-radius: 0.5rem; padding: 0.5rem;
  }
  .sq-card-container.hidden { display: none; }
  .save-card-toggle {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-size: 0.8125rem; color: var(--text-secondary);
    cursor: pointer;
  }
  .save-card-toggle input[type="checkbox"] { accent-color: var(--accent); }

  .pay-error {
    padding: 0.625rem 0.75rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.5rem;
    color: #ef4444;
    font-size: 0.8125rem;
  }

  .pay-actions { display: flex; gap: 0.625rem; }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
