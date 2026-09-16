<script lang="ts">
  import { Eye, EyeOff } from 'lucide-svelte';

  interface Props {
    data: Record<string, never>;
    form: { error?: string; fields?: { firstName?: string; lastName?: string; email?: string } } | null;
  }

  const { form }: Props = $props();

  let showPassword = $state(false);
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

    <h1 class="auth-title font-display">Create Your Account</h1>
    <p class="auth-sub">Get access to bay reservations, the scheduling system, and all club benefits.</p>

    {#if form?.error}
      <div class="form-error" role="alert">{form.error}</div>
    {/if}

    <form class="auth-form" method="POST">
      <div class="name-row">
        <div class="field">
          <label for="firstName">First Name</label>
          <input id="firstName" name="firstName" type="text" class="input"
            placeholder="First" value={form?.fields?.firstName ?? ''} required autocomplete="given-name" />
        </div>
        <div class="field">
          <label for="lastName">Last Name</label>
          <input id="lastName" name="lastName" type="text" class="input"
            placeholder="Last" value={form?.fields?.lastName ?? ''} required autocomplete="family-name" />
        </div>
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" class="input"
          placeholder="you@example.com" value={form?.fields?.email ?? ''} required autocomplete="email" />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <div class="password-wrap">
          <input id="password" name="password" type={showPassword ? 'text' : 'password'}
            class="input" placeholder="••••••••"
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
        Create Account
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
</style>
