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

  // Hide footer on auth/app pages to let those layouts control their own chrome
  const hideFooter = $derived(
    $page.url.pathname.startsWith('/app/') ||
    $page.url.pathname.startsWith('/auth/')
  );
</script>

<StructuredData />
<Header user={data.user} />

<main>
  {@render children()}
</main>

{#if !hideFooter}
  <Footer />
{/if}
