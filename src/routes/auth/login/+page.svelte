<script lang="ts">
  import { enhance } from '$app/forms';
  import { Wrench, Eye, EyeOff } from 'lucide-svelte';

  interface Props {
    form: { error?: string } | null;
  }

  const { form }: Props = $props();

  let showPassword = $state(false);
  let loading = $state(false);
</script>

<svelte:head>
  <title>Member Login — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth-page">
  <div class="auth-bg"></div>
  <div class="auth-card">
    <!-- Logo -->
    <a href="/" class="auth-logo">
      <img src="/assets/logo.webp" alt="Wrench Club" class="h-8 w-auto" />
    </a>

    <h1 class="auth-title font-display">Member Login</h1>
    <p class="auth-sub">Access your dashboard, reservations, and member benefits.</p>

    {#if form?.error}
      <div class="form-error" role="alert">
        {form.error}
      </div>
    {/if}

    <form
      method="POST"
      class="auth-form"
      use:enhance={() => {
        loading = true;
        return ({ update }) => {
          loading = false;
          update();
        };
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

      <div class="field">
        <label for="password">Password</label>
        <div class="password-wrap">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            class="input"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
          <button
            type="button"
            class="password-toggle"
            onclick={() => (showPassword = !showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {#if showPassword}
              <EyeOff size={16} />
            {:else}
              <Eye size={16} />
            {/if}
          </button>
        </div>
      </div>

      <button type="submit" class="btn btn-primary w-full" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>

    <div class="auth-footer">
      <p>Not a member yet? <a href="/" class="auth-link">Join the waitlist</a></p>
    </div>
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

  .auth-logo {
    display: block;
    margin-bottom: 2rem;
  }

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

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .password-wrap {
    position: relative;
  }

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

  .password-toggle:hover {
    color: var(--text-secondary);
  }

  .w-full {
    width: 100%;
    margin-top: 0.25rem;
  }

  .auth-footer {
    margin-top: 1.75rem;
    text-align: center;
  }

  .auth-footer p {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .auth-link {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }

  .auth-link:hover {
    text-decoration: underline;
  }
</style>
