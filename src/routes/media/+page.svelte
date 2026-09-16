<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { ExternalLink, Newspaper, Megaphone, BookOpen } from 'lucide-svelte';
  import SEO from '$lib/components/layout/SEO.svelte';
  import { CATEGORIES, CATEGORY_LABELS } from '$lib/content/media';
  import type { MediaArticle } from '$lib/server/schema';

  interface Props {
    data: { articles: MediaArticle[]; activeCategory: string };
  }
  const { data }: Props = $props();

  function fmtDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  function setCategory(value: string) {
    const params = new URLSearchParams($page.url.searchParams);
    if (value === 'all') params.delete('category');
    else params.set('category', value);
    goto(`?${params}`, { keepFocus: true, noScroll: true });
  }

  const categoryIcon: Record<string, typeof Newspaper> = {
    newsletter: Newspaper,
    press: BookOpen,
    announcement: Megaphone,
  };

  const categoryColor: Record<string, string> = {
    newsletter:   'badge-pink',
    press:        'badge-blue',
    announcement: 'badge-yellow',
  };

  // CATEGORY_LABELS from media.ts is keyed on the union type; cast for DB string
  function catLabel(cat: string): string {
    return (CATEGORY_LABELS as Record<string, string>)[cat] ?? cat;
  }
</script>

<SEO
  title="Media"
  description="Newsletters, press coverage, and announcements from Wrench Club — West Michigan's premier DIY auto shop."
/>

<div class="page-header">
  <div class="container mx-auto px-6">
    <p class="overline">Stay in the Loop</p>
    <h1 class="page-title font-display">Media &amp; News</h1>
    <p class="page-sub">
      Newsletters, press coverage, and announcements from the Wrench Club crew.
    </p>
  </div>
</div>

<section class="content-section">
  <div class="container mx-auto px-6">

    <!-- Category filter -->
    <div class="filter-bar" role="tablist" aria-label="Filter by category">
      {#each CATEGORIES as cat}
        <button
          role="tab"
          aria-selected={data.activeCategory === cat.value}
          class="filter-btn"
          class:active={data.activeCategory === cat.value}
          onclick={() => setCategory(cat.value)}
        >
          {cat.label}
        </button>
      {/each}
    </div>

    {#if data.articles.length === 0}
      <!-- Empty state -->
      <div class="empty-state">
        <Newspaper size={48} style="color: var(--text-muted); margin-bottom: 1.25rem;" />
        <h2 class="empty-title font-display">Nothing here yet</h2>
        <p class="empty-body">
          Check back soon — newsletters and announcements will appear here as we publish them.
        </p>
      </div>
    {:else}
      <div class="articles-grid">
        {#each data.articles as article (article.slug)}
          {@const Icon = categoryIcon[article.category] ?? Newspaper}
          <article class="article-card">
            {#if article.image}
              <div class="card-image">
                <img src={article.image} alt={article.title} loading="lazy" />
                <div class="image-overlay"></div>
              </div>
            {/if}

            <div class="card-body">
              <div class="card-meta">
                <span class="badge {categoryColor[article.category]}">
                  <Icon size={11} />
                  {catLabel(article.category)}
                </span>
                <span class="meta-source">{article.source}</span>
              </div>

              <h2 class="card-title font-display">{article.title}</h2>
              <p class="card-date">{fmtDate(article.date)}</p>
              {#if article.summary}
                <p class="card-summary">{article.summary}</p>
              {:else if article.articleType === 'newsletter'}
                <p class="card-summary card-summary-muted">Click to read the full newsletter.</p>
              {/if}

              {#if article.articleType === 'newsletter'}
                <a href="/media/{article.slug}" class="read-link">
                  Read Newsletter
                </a>
              {:else}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="read-link"
                  aria-label="Read {article.title} (opens in a new tab)"
                >
                  {article.category === 'press' ? 'Read Article' : 'Read More'}
                  <ExternalLink size={14} />
                </a>
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}

  </div>
</section>

<style>
  /* ── Page header ── */
  .page-header {
    padding-top: 8rem;
    padding-bottom: 4rem;
    border-bottom: 1px solid var(--border);
  }

  .overline {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1rem;
  }

  .page-title {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 1.25rem;
  }

  .page-sub {
    font-size: 1.125rem;
    color: var(--text-secondary);
    max-width: 480px;
    line-height: 1.6;
  }

  /* ── Content ── */
  .content-section {
    padding: 3.5rem 0 6rem;
  }

  /* ── Filter bar ── */
  .filter-bar {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 2.5rem;
  }

  .filter-btn {
    padding: 0.5rem 1.25rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  .filter-btn:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }

  .filter-btn.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    font-weight: 600;
  }

  /* ── Grid ── */
  .articles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  /* ── Card ── */
  .article-card {
    background: var(--bg-card, var(--bg-elevated));
    border: 1px solid var(--border);
    border-radius: 1rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s, transform 0.2s;
  }

  .article-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }

  .card-image {
    position: relative;
    height: 200px;
    overflow: hidden;
  }

  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6));
  }

  .card-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    flex: 1;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* ── Badges ── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
  }

  .badge-pink {
    background: rgba(237, 12, 133, 0.15);
    color: var(--accent);
    border: 1px solid rgba(237, 12, 133, 0.3);
  }

  .badge-blue {
    background: rgba(59, 130, 246, 0.12);
    color: #93c5fd;
    border: 1px solid rgba(59, 130, 246, 0.25);
  }

  .badge-yellow {
    background: rgba(234, 179, 8, 0.12);
    color: #fde047;
    border: 1px solid rgba(234, 179, 8, 0.25);
  }

  .meta-source {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .card-title {
    font-size: 1.375rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.2;
    margin: 0.25rem 0 0;
  }

  .card-date {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  .card-summary {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.65;
    flex: 1;
  }

  .card-summary-muted {
    color: var(--text-muted);
    font-style: italic;
  }

  .read-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--accent);
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    margin-top: 0.5rem;
    transition: gap 0.15s;
  }

  .read-link:hover {
    gap: 0.625rem;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* ── Empty state ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 5rem 1.5rem;
  }

  .empty-title {
    font-size: 2rem;
    font-weight: 900;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
  }

  .empty-body {
    font-size: 1rem;
    color: var(--text-secondary);
    max-width: 400px;
    line-height: 1.6;
  }
</style>
