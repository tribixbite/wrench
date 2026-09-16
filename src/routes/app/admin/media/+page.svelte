<script lang="ts">
  import { enhance } from '$app/forms';
  import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, Newspaper } from 'lucide-svelte';
  import BackLink from '$lib/components/app/BackLink.svelte';
  import type { MediaArticle } from '$lib/server/schema';

  interface Props {
    data: { articles: MediaArticle[] };
  }
  const { data }: Props = $props();

  const CATEGORY_LABELS: Record<string, string> = {
    newsletter: 'Newsletter',
    press: 'Press',
    announcement: 'Announcement'
  };

  const CATEGORY_COLOR: Record<string, string> = {
    newsletter: 'badge-pink',
    press: 'badge-blue',
    announcement: 'badge-yellow'
  };

  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  let deleting = $state<string | null>(null);
  let toggling = $state<string | null>(null);
</script>

<svelte:head>
  <title>Media — Admin — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="admin">
  <div class="admin-header">
    <div>
      <BackLink href="/app/admin" />
      <p class="admin-label">Admin · Media</p>
      <h1 class="admin-title font-display">Media Articles</h1>
    </div>
    <a href="/app/admin/media/new" class="btn btn-primary">
      <Plus size={16} /> New Article
    </a>
  </div>

  {#if data.articles.length === 0}
    <div class="empty card">
      <Newspaper size={40} style="color: var(--text-muted); margin-bottom: 1rem;" />
      <p class="empty-title">No articles yet</p>
      <p class="empty-body">Add your first newsletter, press mention, or announcement.</p>
      <a href="/app/admin/media/new" class="btn btn-primary" style="margin-top: 1.25rem;">
        <Plus size={15} /> Add First Article
      </a>
    </div>
  {:else}
    <div class="table-wrap card">
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.articles as article (article.id)}
              <tr class:draft={!article.published}>
                <td class="title-cell">
                  <div class="article-title">{article.title}</div>
                  <div class="article-source">{article.source}</div>
                </td>
                <td>
                  <span class="badge {CATEGORY_COLOR[article.category] ?? ''}">
                    {CATEGORY_LABELS[article.category] ?? article.category}
                  </span>
                </td>
                <td class="date-cell">{fmtDate(article.date)}</td>
                <td>
                  <span class="status-badge" class:published={!!article.published}>
                    {article.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <!-- Toggle published -->
                    <form method="POST" action="?/togglePublished" use:enhance={() => {
                      toggling = article.id;
                      return async ({ update }) => { await update(); toggling = null; };
                    }}>
                      <input type="hidden" name="id" value={article.id} />
                      <input type="hidden" name="published" value={article.published ?? 1} />
                      <button
                        type="submit"
                        class="icon-btn"
                        title={article.published ? 'Unpublish' : 'Publish'}
                        disabled={toggling === article.id}
                      >
                        {#if article.published}
                          <EyeOff size={15} />
                        {:else}
                          <Eye size={15} />
                        {/if}
                      </button>
                    </form>

                    <!-- External link preview -->
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="icon-btn"
                      title="Open URL"
                    >
                      <ExternalLink size={15} />
                    </a>

                    <!-- Edit -->
                    <a href="/app/admin/media/{article.id}" class="icon-btn" title="Edit">
                      <Pencil size={15} />
                    </a>

                    <!-- Delete -->
                    <form method="POST" action="?/delete" use:enhance={({ cancel }) => {
                      if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) {
                        cancel(); return;
                      }
                      deleting = article.id;
                      return async ({ update }) => { await update(); deleting = null; };
                    }}>
                      <input type="hidden" name="id" value={article.id} />
                      <button
                        type="submit"
                        class="icon-btn icon-btn-danger"
                        title="Delete"
                        disabled={deleting === article.id}
                      >
                        <Trash2 size={15} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .admin {
    padding: 2.5rem;
    max-width: 960px;
    margin: 0 auto;
  }
  @media (max-width: 768px) { .admin { padding: 1.5rem 1.25rem; } }

  .admin-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.75rem;
  }

  .admin-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
    margin: 0.75rem 0 0.25rem;
  }

  .admin-title {
    font-size: 2rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    margin: 0;
  }

  /* Empty state */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 4rem 2rem;
  }
  .empty-title { font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin: 0 0 0.375rem; }
  .empty-body { font-size: 0.9rem; color: var(--text-muted); margin: 0; }

  /* Table */
  .table-wrap { padding: 0; overflow: hidden; }
  .table-scroll { overflow-x: auto; }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .table th {
    text-align: left;
    padding: 0.875rem 1.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  .table td {
    padding: 0.875rem 1.25rem;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }

  .table tbody tr:last-child td { border-bottom: none; }
  .table tbody tr:hover td { background: var(--bg-elevated); }
  .table tbody tr.draft td { opacity: 0.55; }

  .title-cell { min-width: 200px; }
  .article-title { color: var(--text-primary); font-weight: 500; }
  .article-source { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }
  .date-cell { white-space: nowrap; font-size: 0.8125rem; }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    white-space: nowrap;
  }
  .badge-pink  { background: rgba(237,12,133,0.12); color: var(--accent); border: 1px solid rgba(237,12,133,0.25); }
  .badge-blue  { background: rgba(59,130,246,0.1);  color: #93c5fd;       border: 1px solid rgba(59,130,246,0.2); }
  .badge-yellow{ background: rgba(234,179,8,0.1);   color: #fde047;       border: 1px solid rgba(234,179,8,0.2); }

  .status-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-muted);
    white-space: nowrap;
  }
  .status-badge.published {
    background: rgba(34,197,94,0.1);
    border-color: rgba(34,197,94,0.25);
    color: #22c55e;
  }

  /* Action buttons */
  .actions { display: flex; align-items: center; gap: 0.25rem; }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px; height: 30px;
    border-radius: 0.375rem;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    text-decoration: none;
  }
  .icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
  .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .icon-btn-danger:hover { background: rgba(239,68,68,0.1); color: #f87171; }
</style>
