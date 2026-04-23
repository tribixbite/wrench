<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
  import { onMount } from 'svelte';

  interface Props {
    /** Fallback href if history-back isn't available or referrer is off-site. */
    href: string;
    /** Visible label — defaults to "Back". */
    label?: string;
  }

  const { href, label = 'Back' }: Props = $props();

  let hasSameOriginHistory = $state(false);

  onMount(() => {
    hasSameOriginHistory =
      typeof document !== 'undefined' &&
      document.referrer !== '' &&
      new URL(document.referrer).origin === window.location.origin;
  });

  function onClick(e: MouseEvent) {
    if (!hasSameOriginHistory) return;
    e.preventDefault();
    history.back();
  }
</script>

<a {href} class="back-link" onclick={onClick}>
  <ArrowLeft size={16} />
  {label}
</a>

<style>
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    text-decoration: none;
    margin-bottom: 1.5rem;
    transition: color 0.15s;
  }
  .back-link:hover {
    color: var(--text-secondary);
  }
</style>
