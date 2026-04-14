<script lang="ts">
  import { CheckCircle, XCircle, Mail } from 'lucide-svelte';

  interface Props {
    data: { success: boolean; reason?: 'invalid' };
  }

  const { data }: Props = $props();
</script>

<svelte:head>
  <title>Verify Email — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
  <a href="/" class="wordmark">WRENCH CLUB</a>

  <div class="card">
    {#if data.success}
      <CheckCircle size={48} class="icon success" />
      <h1 class="heading">Email verified.</h1>
      <p class="sub">Your Wrench Club account is fully active.</p>
      <a href="/app/dashboard" class="btn-primary">Go to Dashboard →</a>
    {:else}
      <XCircle size={48} class="icon error" />
      <h1 class="heading">Link expired or invalid.</h1>
      <p class="sub">
        Verification links expire after 24 hours. Sign in and we'll send you a fresh one.
      </p>
      <a href="/auth/login" class="btn-primary">Sign In</a>
    {/if}
  </div>
</div>

<style>
  .page {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.25rem;
    background: var(--bg-primary);
    gap: 2rem;
  }

  .wordmark {
    font-size: 1.25rem;
    font-weight: 900;
    color: var(--accent);
    letter-spacing: -0.02em;
    text-decoration: none;
  }

  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 3rem 2rem;
    max-width: 440px;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  :global(.icon) { margin-bottom: 1.25rem; }
  :global(.icon.success) { color: #22c55e; }
  :global(.icon.error) { color: #ef4444; }

  .heading {
    font-size: 1.75rem;
    font-weight: 900;
    color: var(--text-primary);
    margin: 0 0 0.75rem;
    line-height: 1.1;
    font-family: var(--font-display);
  }

  .sub {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    margin: 0 0 2rem;
    line-height: 1.6;
  }

  .btn-primary {
    display: inline-block;
    background: var(--accent);
    color: #fff;
    font-weight: 700;
    font-size: 0.9375rem;
    padding: 0.75rem 1.75rem;
    border-radius: 0.5rem;
    text-decoration: none;
    transition: opacity 0.15s;
  }

  .btn-primary:hover { opacity: 0.88; }
</style>
