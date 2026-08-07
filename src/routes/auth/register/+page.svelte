<script lang="ts">
  import { Eye, EyeOff, CheckCircle2, CreditCard, Lock, Loader2, ArrowLeft } from 'lucide-svelte';
  import { onDestroy } from 'svelte';

  interface Props {
    data: {
      square: { appId: string; locationId: string; environment: 'sandbox' | 'production' };
    };
    form: null;
  }

  const { data }: Props = $props();

  // ── Step state ────────────────────────────────────────────────────────────
  let step = $state<1 | 2>(1);

  // ── Step 1 fields ─────────────────────────────────────────────────────────
  let firstName   = $state('');
  let lastName    = $state('');
  let email       = $state('');
  let password    = $state('');
  let showPassword = $state(false);
  let step1Error  = $state('');

  // ── Step 2 / Square SDK ───────────────────────────────────────────────────
  let sdkReady   = $state(false);
  let sdkError   = $state('');
  let submitting = $state(false);
  let payError   = $state('');

  let cardInstance: any = null;
  const cardElementId = 'sq-register-card';

  async function loadSquareSdk(): Promise<any> {
    if ((window as any).Square) return (window as any).Square;
    return new Promise((resolve, reject) => {
      const src = data.square.environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any).Square));
        existing.addEventListener('error', () => reject(new Error('Square SDK unavailable')));
        return;
      }
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.addEventListener('load', () => resolve((window as any).Square));
      s.addEventListener('error', () => reject(new Error('Square SDK unavailable')));
      document.head.appendChild(s);
    });
  }

  async function initCard() {
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

  onDestroy(() => {
    if (cardInstance) try { cardInstance.destroy(); } catch {}
  });

  // ── Step navigation ───────────────────────────────────────────────────────
  function handleStep1(e: SubmitEvent) {
    e.preventDefault();
    step1Error = '';
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      step1Error = 'All fields are required.'; return;
    }
    if (password.length < 8) {
      step1Error = 'Password must be at least 8 characters.'; return;
    }
    step = 2;
    setTimeout(() => void initCard(), 50); // init after DOM renders
  }

  function backToStep1() {
    step = 1;
    if (cardInstance) try { cardInstance.destroy(); } catch {}
    cardInstance = null;
    sdkReady = false;
    sdkError = '';
    payError = '';
  }

  // ── Final submit ──────────────────────────────────────────────────────────
  async function handlePaySubmit() {
    payError = '';
    sdkError = '';
    if (!cardInstance) { payError = 'Card form is still loading — try again.'; return; }
    submitting = true;
    try {
      const result = await cardInstance.tokenize();
      if (result.status !== 'OK' || !result.token) {
        payError = result.errors?.[0]?.message ?? 'Card details are not valid — please check and try again.';
        return;
      }
      const res = await fetch('/api/membership/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          cardNonce: result.token
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        payError = (json as any).error ?? 'Registration failed — please try again.';
        return;
      }
      // Session cookie is now set — navigate to dashboard
      window.location.href = '/app/dashboard';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Join Wrench Club — Create Account</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth-page">
  <div class="auth-bg"></div>
  <div class="auth-card">
    <a href="/" class="auth-logo">
      <img src="/logo.webp" alt="Wrench Club" class="h-8 w-auto" width="500" height="126" />
    </a>

    <!-- ── Step 1: Account Info ── -->
    {#if step === 1}
      <h1 class="auth-title font-display">Create Your Account</h1>
      <p class="auth-sub">Members get access to bay reservations, the scheduling system, and all club benefits.</p>

      <div class="phase-notice">
        <CheckCircle2 size={16} style="color: var(--accent); flex-shrink: 0;" />
        <span>Member registration opens when Wrench Club launches in 2026. <a href="/#waitlist" class="auth-link">Join the waitlist</a> to be first to know.</span>
      </div>

      {#if step1Error}
        <div class="form-error" role="alert">{step1Error}</div>
      {/if}

      <form class="auth-form" onsubmit={handleStep1}>
        <div class="name-row">
          <div class="field">
            <label for="firstName">First Name</label>
            <input id="firstName" name="firstName" type="text" class="input"
              placeholder="First" bind:value={firstName} required autocomplete="given-name" />
          </div>
          <div class="field">
            <label for="lastName">Last Name</label>
            <input id="lastName" name="lastName" type="text" class="input"
              placeholder="Last" bind:value={lastName} required autocomplete="family-name" />
          </div>
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" class="input"
            placeholder="you@example.com" bind:value={email} required autocomplete="email" />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <div class="password-wrap">
            <input id="password" name="password" type={showPassword ? 'text' : 'password'}
              class="input" placeholder="••••••••" bind:value={password}
              required minlength="8" autocomplete="new-password" aria-describedby="password-hint" />
            <button type="button" class="password-toggle"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}>
              {#if showPassword}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
            </button>
          </div>
          <p id="password-hint" class="field-hint">Minimum 8 characters</p>
        </div>

        <button type="submit" class="btn btn-primary w-full">
          Continue to Payment
        </button>
      </form>

      <div class="auth-footer">
        <p>Already a member? <a href="/auth/login" class="auth-link">Sign in</a></p>
      </div>

    <!-- ── Step 2: Payment ── -->
    {:else}
      <button class="back-btn" onclick={backToStep1}>
        <ArrowLeft size={15} /> Back
      </button>

      <h1 class="auth-title font-display">Set Up Membership</h1>
      <p class="auth-sub">Your card will be charged <strong>$10/month</strong> starting today and automatically billed each month.</p>

      <div class="account-summary">
        <p class="summary-name">{firstName} {lastName}</p>
        <p class="summary-email">{email}</p>
      </div>

      {#if payError}
        <div class="form-error" role="alert">{payError}</div>
      {/if}
      {#if sdkError}
        <div class="form-error" role="alert">{sdkError}</div>
      {/if}

      <div class="payment-box">
        <div class="pay-header">
          <div class="pay-amount">
            <span class="pay-label">Monthly Membership</span>
            <span class="pay-value">$10 / mo</span>
          </div>
          <span class="pay-secure"><Lock size={12} /> Secured by Square</span>
        </div>

        <div class="card-field-wrap">
          {#if !sdkReady && !sdkError}
            <div class="card-loading"><Loader2 size={14} class="spin" /> Loading secure card form…</div>
          {/if}
          <div id={cardElementId} class="sq-card-container" class:hidden={!sdkReady}></div>
        </div>
      </div>

      <button
        class="btn btn-primary w-full"
        disabled={submitting || (!sdkReady && !sdkError)}
        onclick={handlePaySubmit}
      >
        {#if submitting}
          <Loader2 size={16} class="spin" /> Processing…
        {:else}
          <CreditCard size={16} /> Create Account &amp; Pay $10/mo
        {/if}
      </button>

      <p class="cancel-note">Cancel anytime from your member profile. No long-term commitment.</p>
    {/if}
  </div>
</div>

<style>
  .auth-page {
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6rem 1.5rem 3rem;
    position: relative;
    background: var(--bg-primary);
  }

  .auth-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(237, 12, 133, 0.06) 0%, transparent 60%);
    pointer-events: none;
  }

  .auth-card {
    position: relative;
    width: 100%;
    max-width: 440px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1.25rem;
    padding: 2.5rem;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  }

  .auth-logo { display: block; margin-bottom: 2rem; }

  .auth-title {
    font-size: 2rem;
    font-weight: 900;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    line-height: 1.1;
  }

  .auth-sub {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .phase-notice {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    border-radius: 0.625rem;
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.55;
    margin-bottom: 1.5rem;
  }

  .form-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.5rem;
    padding: 0.875rem 1rem;
    color: #fca5a5;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .name-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 380px) {
    .name-row { grid-template-columns: 1fr; }
  }

  .field { display: flex; flex-direction: column; gap: 0.5rem; }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .field-hint {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin: 0;
  }

  .password-wrap { position: relative; }

  .password-toggle {
    position: absolute;
    right: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    padding: 0.25rem;
    transition: color 0.15s;
  }

  .password-toggle:hover { color: var(--text-secondary); }

  .w-full { width: 100%; margin-top: 0.25rem; }

  .auth-footer {
    margin-top: 1.75rem;
    text-align: center;
  }

  .auth-footer p { font-size: 0.9rem; color: var(--text-muted); }

  .auth-link {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }

  .auth-link:hover { text-decoration: underline; }

  /* ── Step 2 ── */
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0;
    margin-bottom: 1.25rem;
    transition: color 0.15s;
  }

  .back-btn:hover { color: var(--text-primary); }

  .account-summary {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1.25rem;
  }

  .summary-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.9375rem;
    margin: 0 0 0.125rem;
  }

  .summary-email {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin: 0;
  }

  .payment-box {
    background: var(--bg-elevated);
    border: 1px solid var(--accent);
    border-radius: 0.75rem;
    padding: 1.25rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pay-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pay-amount { display: flex; flex-direction: column; }

  .pay-label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .pay-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.1;
  }

  .pay-secure {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  .card-field-wrap { display: flex; flex-direction: column; gap: 0.5rem; }

  .card-loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .sq-card-container {
    min-height: 90px;
    background: white;
    border-radius: 0.5rem;
    padding: 0.5rem;
  }

  .sq-card-container.hidden { display: none; }

  .cancel-note {
    text-align: center;
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin-top: 0.75rem;
  }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
