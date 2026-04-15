<script lang="ts">
  import { enhance } from '$app/forms';
  import { Eye, EyeOff, CheckCircle2 } from 'lucide-svelte';

  interface Props {
    form: { error?: string; fields?: { email?: string; name?: string } } | null;
  }

  const { form }: Props = $props();

  let showPassword = $state(false);
  let loading = $state(false);
</script>

<svelte:head>
  <title>Join Wrench Club — Create Account</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth-page">
  <div class="auth-bg"></div>
  <div class="auth-card">
    <a href="/" class="auth-logo">
      <img src="/logo.webp" alt="Wrench Club" class="h-8 w-auto" />
    </a>

    <h1 class="auth-title font-display">Create Your Account</h1>
    <p class="auth-sub">Members get access to bay reservations, the scheduling system, and all club benefits.</p>

    <!-- Phase 2 notice -->
    <div class="phase-notice">
      <CheckCircle2 size={16} style="color: var(--accent); flex-shrink: 0;" />
      <span>Member registration opens when Wrench Club launches in 2026. <a href="/#waitlist" class="auth-link">Join the waitlist</a> to be first to know.</span>
    </div>

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
        <label for="name">Full Name</label>
        <input
          id="name"
          name="name"
          type="text"
          class="input"
          placeholder="Your name"
          value={form?.fields?.name ?? ''}
          required
          autocomplete="name"
        />
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          class="input"
          placeholder="you@example.com"
          value={form?.fields?.email ?? ''}
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
            minlength="8"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="password-toggle"
            onclick={() => (showPassword = !showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {#if showPassword}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
          </button>
        </div>
        <p class="field-hint">Minimum 8 characters</p>
      </div>

      <label class="waiver-label">
        <input type="checkbox" name="waiver" required />
        <span>I agree to Wrench Club's facility waiver and safety orientation requirements</span>
      </label>

      <button type="submit" class="btn btn-primary w-full" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
    </form>

    <div class="auth-footer">
      <p>Already a member? <a href="/auth/login" class="auth-link">Sign in</a></p>
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

  .waiver-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    cursor: pointer;
    line-height: 1.5;
  }

  .waiver-label input {
    margin-top: 2px;
    accent-color: var(--accent);
    flex-shrink: 0;
  }

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
</style>
