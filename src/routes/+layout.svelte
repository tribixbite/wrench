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
{#if !hideChrome}
  <Header user={data.user} />
{/if}

<main>
  {@render children()}
</main>

{#if !hideChrome}
  <Footer />
{/if}
