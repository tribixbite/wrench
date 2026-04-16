<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import StructuredData from '$lib/components/layout/StructuredData.svelte';
  import { page } from '$app/stores';

  interface Props {
    data: { user: App.Locals['user'] };
    children: import('svelte').Snippet;
  }

  const { data, children }: Props = $props();

  // Hide marketing chrome on auth/app pages — those layouts control their own chrome
  const hideChrome = $derived(
    $page.url.pathname.startsWith('/app/') ||
    $page.url.pathname.startsWith('/auth/')
  );
</script>

<StructuredData />
<a href="#main-content" class="skip-link">Skip to content</a>
{#if !hideChrome}
  <Header user={data.user} />
{/if}

<main id="main-content">
  {@render children()}
</main>

{#if !hideChrome}
  <Footer />
{/if}

<style>
  /* Visually hidden until focused — standard sr-only-focusable pattern */
  .skip-link {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
    z-index: 9999;
  }

  .skip-link:focus {
    position: fixed;
    top: 1rem;
    left: 1rem;
    width: auto;
    height: auto;
    padding: 0.75rem 1.5rem;
    margin: 0;
    overflow: visible;
    clip: auto;
    background: var(--accent);
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    border-radius: 0.375rem;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
</style>
