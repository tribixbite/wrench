<script lang="ts">
  import BackLink from '$lib/components/app/BackLink.svelte';
  import MediaArticleForm from '$lib/components/admin/MediaArticleForm.svelte';

  interface Props {
    form?: { error?: string; fields?: Record<string, string> } | null;
  }
  const { form = null }: Props = $props();
</script>

<svelte:head>
  <title>New Article — Admin — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="admin">
  <div class="page-header">
    <BackLink href="/app/admin/media" />
    <p class="admin-label">Admin · Media</p>
    <h1 class="admin-title font-display">New Article</h1>
  </div>

  <div class="form-card card">
    <MediaArticleForm {form} action="" />
  </div>
</div>

<style>
  .admin { padding: 2.5rem; max-width: 780px; margin: 0 auto; }
  @media (max-width: 768px) { .admin { padding: 1.5rem 1.25rem; } }

  .page-header { margin-bottom: 1.75rem; }
  .admin-label {
    font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--accent); margin: 0.75rem 0 0.25rem;
  }
  .admin-title { font-size: 2rem; font-weight: 900; color: var(--text-primary); line-height: 1; margin: 0; }

  .form-card { padding: 2rem; }
</style>
