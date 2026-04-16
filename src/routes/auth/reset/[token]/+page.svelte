<script lang="ts">
  import { enhance } from '$app/forms';
  import { Eye, EyeOff } from 'lucide-svelte';

  interface Props {
    data: { valid: boolean };
    form: { error?: string } | null;
  }

  const { data, form }: Props = $props();

  let showPassword = $state(false);
  let showConfirm = $state(false);
  let loading = $state(false);
</script>

<svelte:head>
  <title>Reset Password — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth-page">
  <div class="auth-bg"></div>
  <div class="auth-card">
    <a href="/" class="auth-logo">
      <img src="/logo.webp" alt="Wrench Club" class="h-8 w-auto" width="500" height="126" />
    </a>

    {#if !data.valid}
      <h1 class="auth-title font-display">Link expired.</h1>
      <p class="auth-sub">This reset link is invalid or has expired (links are valid for 1 hour).</p>
      <a href="/auth/forgot-password" class="btn btn-primary w-full">Request a new link</a>
    {:else}
      <h1 class="auth-title font-display">New password.</h1>
      <p class="auth-sub">Choose a strong password for your Wrench Club account.</p>

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
          <label for="password">New password</label>
          <div class="password-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              class="input"
              placeholder="Min. 8 characters"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              class="password-toggle"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword ? 'Hide' : 'Show'}
            >
              {#if showPassword}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
            </button>
          </div>
        </div>

        <div class="field">
          <label for="confirm">Confirm password</label>
          <div class="password-wrap">
            <input
              id="confirm"
              name="confirm"
              type={showConfirm ? 'text' : 'password'}
              class="input"
              placeholder="Repeat password"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              class="password-toggle"
              onclick={() => (showConfirm = !showConfirm)}
              aria-label={showConfirm ? 'Hide' : 'Show'}
            >
              {#if showConfirm}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Set New Password'}
        </button>
      </form>
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

  label { font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); }

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
</style>
