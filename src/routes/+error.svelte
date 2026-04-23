<script lang="ts">
  import { page } from '$app/stores';
  import { Wrench } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let canGoBack = $state(false);

  onMount(() => {
    canGoBack =
      document.referrer !== '' &&
      new URL(document.referrer).origin === window.location.origin;
  });

  /** Fallback when there's no usable browser history. */
  let fallbackHref = $derived($page.url.pathname.startsWith('/app') ? '/app/dashboard' : '/');
  let fallbackLabel = $derived($page.url.pathname.startsWith('/app') ? 'Back to Dashboard' : 'Back to Home');

  function onBackClick(e: MouseEvent) {
    if (!canGoBack) return;
    e.preventDefault();
    history.back();
  }
</script>

<svelte:head>
  <title>{$page.status} — Wrench Club</title>
</svelte:head>

<div class="error-page">
  <div class="error-inner">
    <div class="error-icon">
      <Wrench size={32} />
    </div>

    <p class="error-code">{$page.status}</p>

    <h1 class="error-title font-display">
      {#if $page.status === 404}
        Wrong Bay
      {:else if $page.status === 403}
        Access Denied
      {:else}
        Something Broke
      {/if}
    </h1>

    <p class="error-sub">
      {#if $page.status === 404}
        That page doesn't exist. Maybe it moved, or you took a wrong turn.
      {:else if $page.status === 403}
        You don't have permission to view this page.
      {:else}
        {$page.error?.message ?? 'An unexpected error occurred.'}
      {/if}
    </p>

    <div class="error-actions">
      <a href={fallbackHref} class="btn btn-primary" onclick={onBackClick}>
        {canGoBack ? 'Go Back' : fallbackLabel}
      </a>
      <a href="/" class="btn btn-ghost">Home</a>
    </div>
  </div>
</div>

<style>
  .error-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: var(--bg-primary);
  }

  .error-inner {
    text-align: center;
    max-width: 480px;
  }

  .error-icon {
    width: 64px;
    height: 64px;
    border-radius: 1rem;
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    margin-bottom: 1.5rem;
  }

  .error-code {
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.75rem;
  }

  .error-title {
    font-size: clamp(2.25rem, 6vw, 3.5rem);
    font-weight: 900;
    line-height: 1.05;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .error-sub {
    font-size: 1.0625rem;
    color: var(--text-secondary);
    line-height: 1.7;
    margin-bottom: 2rem;
  }

  .error-actions {
    display: flex;
    gap: 0.875rem;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
