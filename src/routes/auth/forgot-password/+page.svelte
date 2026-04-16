<script lang="ts">
  import { enhance } from '$app/forms';
  import { Mail } from 'lucide-svelte';

  interface Props {
    form: { error?: string; sent?: boolean } | null;
  }

  const { form }: Props = $props();

  let loading = $state(false);
</script>

<svelte:head>
  <title>Forgot Password — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth-page">
  <div class="auth-bg"></div>
  <div class="auth-card">
    <a href="/" class="auth-logo">
      <img src="/logo.webp" alt="Wrench Club" class="h-8 w-auto" width="500" height="126" />
    </a>

    {#if form?.sent}
      <div class="sent-state">
        <Mail size={40} class="sent-icon" />
        <h1 class="auth-title font-display">Check your inbox.</h1>
        <p class="auth-sub">
          If that email is on file, we sent a reset link. It expires in 1 hour.
        </p>
        <a href="/auth/login" class="btn btn-primary w-full" style="margin-top: 1.5rem;">
          Back to Sign In
        </a>
      </div>
    {:else}
      <h1 class="auth-title font-display">Forgot password?</h1>
      <p class="auth-sub">Enter your email and we'll send a reset link.</p>

      {#if form?.error}
        <div class="form-error" role="alert">{form.error}</div>
      {/if}

      <form
        method="POST"
        class="auth-form"
        use:enhance={() => {
          loading = true;
          return ({ update }) => { loading = false; update(); };
        }}
      >
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            class="input"
            placeholder="you@example.com"
            required
            autocomplete="email"
          />
        </div>

        <button type="submit" class="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>

      <div class="auth-footer">
        <p><a href="/auth/login" class="auth-link">Back to Sign In</a></p>
      </div>
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
    margin-bottom: 2rem;
    line-height: 1.5;
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

  .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }

  .field { display: flex; flex-direction: column; gap: 0.5rem; }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .w-full { width: 100%; margin-top: 0.25rem; }

  .auth-footer { margin-top: 1.75rem; text-align: center; }

  .auth-footer p { font-size: 0.9rem; color: var(--text-muted); }

  .auth-link { color: var(--accent); text-decoration: none; font-weight: 500; }
  .auth-link:hover { text-decoration: underline; }

  .sent-state { text-align: center; }
  :global(.sent-icon) { color: var(--accent); margin-bottom: 1.25rem; }
</style>
