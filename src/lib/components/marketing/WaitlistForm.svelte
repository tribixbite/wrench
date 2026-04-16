<script lang="ts">
  import { CheckCircle, AlertCircle, Loader } from 'lucide-svelte';

  interface Props {
    compact?: boolean;
  }

  const { compact = false }: Props = $props();

  let email = $state('');
  let name = $state('');
  let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let message = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!email || status === 'loading') return;

    status = 'loading';
    message = '';

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        status = 'success';
        message = data.message ?? "You're on the list! We'll be in touch soon.";
        email = '';
        name = '';
      } else {
        status = 'error';
        message = data.error ?? 'Something went wrong. Please try again.';
      }
    } catch {
      status = 'error';
      message = 'Network error. Please try again.';
    }
  }
</script>

{#if status === 'success'}
  <div class="success-state">
    <CheckCircle size={32} style="color: var(--success)" />
    <div>
      <p class="font-semibold text-white">You're on the list!</p>
      <p class="text-sm mt-1" style="color: var(--text-secondary)">{message}</p>
    </div>
  </div>
{:else}
  <form onsubmit={handleSubmit} class="waitlist-form" class:compact>
    {#if !compact}
      <label for="waitlist-name" class="sr-only">First name (optional)</label>
      <input
        id="waitlist-name"
        type="text"
        bind:value={name}
        placeholder="First name (optional)"
        class="input"
        autocomplete="given-name"
      />
    {/if}

    <div class="input-row">
      <label for="waitlist-email" class="sr-only">Email address</label>
      <input
        id="waitlist-email"
        type="email"
        bind:value={email}
        placeholder="your@email.com"
        class="input"
        required
        autocomplete="email"
      />
      <button type="submit" class="btn btn-primary" disabled={status === 'loading'}>
        {#if status === 'loading'}
          <Loader size={16} class="animate-spin" />
          Joining…
        {:else}
          Join Waitlist
        {/if}
      </button>
    </div>

    {#if status === 'error'}
      <p class="error-msg">
        <AlertCircle size={14} />
        {message}
      </p>
    {/if}

    <p class="privacy-note">
      No spam — just launch updates and club news.
    </p>
  </form>
{/if}

<style>
  /* Visually hidden but accessible to screen readers */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .waitlist-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .input-row {
    display: flex;
    gap: 0.625rem;
  }

  .input-row .input {
    flex: 1;
    min-width: 0;
  }

  .input-row .btn {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .error-msg {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--danger);
    font-size: 0.875rem;
  }

  .privacy-note {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0;
  }

  .success-state {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 0.75rem;
    padding: 1.25rem 1.5rem;
  }

  /* Compact mode (header/nav inline form) */
  .compact .input-row {
    flex-direction: row;
  }

  @media (max-width: 480px) {
    .input-row {
      flex-direction: column;
    }
  }
</style>
