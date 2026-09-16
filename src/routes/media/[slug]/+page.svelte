<script lang="ts">
  import { Newspaper, Megaphone, BookOpen, ArrowLeft, Calendar } from 'lucide-svelte';
  import SEO from '$lib/components/layout/SEO.svelte';
  import { CATEGORY_LABELS } from '$lib/content/media';

  interface Props {
    data: { article: import('$lib/server/schema').MediaArticle };
  }
  const { data }: Props = $props();
  const article = $derived(data.article);

  function fmtDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  const categoryIcon = {
    newsletter: Newspaper,
    press: BookOpen,
    announcement: Megaphone,
  } as Record<string, typeof Newspaper>;

  const categoryColor: Record<string, string> = {
    newsletter:   'badge-pink',
    press:        'badge-blue',
    announcement: 'badge-yellow',
  };

  function catLabel(cat: string): string {
    return (CATEGORY_LABELS as Record<string, string>)[cat] ?? cat;
  }

  const Icon = categoryIcon[article.category] ?? Newspaper;
</script>

<SEO
  title={article.title}
  description={article.summary || `${catLabel(article.category)} from ${article.source}`}
/>

<div class="page-header">
  <div class="container mx-auto px-6">
    <a href="/media" class="back-link">
      <ArrowLeft size={15} />
      Back to Media
    </a>

    <div class="article-meta">
      <span class="badge {categoryColor[article.category]}">
        <Icon size={11} />
        {catLabel(article.category)}
      </span>
      <span class="meta-source">{article.source}</span>
    </div>

    <h1 class="article-title font-display">{article.title}</h1>

    <div class="article-date">
      <Calendar size={14} />
      {fmtDate(article.date)}
    </div>

    {#if article.summary}
      <p class="article-summary">{article.summary}</p>
    {/if}
  </div>
</div>

{#if article.image}
  <div class="hero-image-wrap">
    <img src={article.image} alt={article.title} class="hero-image" />
  </div>
{/if}

<article class="article-body-section">
  <div class="container mx-auto px-6">
    <div class="newsletter-body">
      {@html article.body}
    </div>
  </div>
</article>

<div class="back-section">
  <div class="container mx-auto px-6">
    <a href="/media" class="back-link">
      <ArrowLeft size={15} />
      Back to Media
    </a>
  </div>
</div>

<style>
  .page-header {
    padding-top: 8rem;
    padding-bottom: 3rem;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    text-decoration: none;
    margin-bottom: 2rem;
    transition: color 0.15s;
  }
  .back-link:hover { color: var(--text-secondary); }

  .article-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }

  .article-title {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 900;
    line-height: 1.05;
    color: var(--text-primary);
    margin-bottom: 1rem;
    max-width: 800px;
  }

  .article-date {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }

  .article-summary {
    font-size: 1.0625rem;
    color: var(--text-secondary);
    line-height: 1.7;
    max-width: 680px;
  }

  /* Category badges — base + color variants */
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
  :global(.badge-pink)   { background: rgba(237,12,133,0.15); color: var(--accent); border: 1px solid rgba(237,12,133,0.3); }
  :global(.badge-blue)   { background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.25); }
  :global(.badge-yellow) { background: rgba(234,179,8,0.12); color: #fde047; border: 1px solid rgba(234,179,8,0.25); }

  .meta-source {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  /* Hero image */
  .hero-image-wrap {
    width: 100%;
    max-height: 420px;
    overflow: hidden;
  }
  .hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  /* Article body */
  .article-body-section {
    padding-block: 4rem;
  }

  .newsletter-body {
    max-width: 720px;
    font-size: 1rem;
    line-height: 1.8;
    color: var(--text-secondary);
  }

  /* Rich content styles scoped to newsletter body */
  .newsletter-body :global(h1),
  .newsletter-body :global(h2),
  .newsletter-body :global(h3),
  .newsletter-body :global(h4) {
    color: var(--text-primary);
    font-family: var(--font-display);
    font-weight: 800;
    line-height: 1.2;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
  }

  .newsletter-body :global(h1) { font-size: clamp(1.5rem, 3vw, 2rem); }
  .newsletter-body :global(h2) { font-size: clamp(1.25rem, 2.5vw, 1.6rem); }
  .newsletter-body :global(h3) { font-size: 1.25rem; }

  .newsletter-body :global(p) {
    margin-bottom: 1.25rem;
  }

  .newsletter-body :global(a) {
    color: var(--accent-text);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .newsletter-body :global(a:hover) {
    color: var(--accent);
  }

  .newsletter-body :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin-block: 1.5rem;
  }

  .newsletter-body :global(ul),
  .newsletter-body :global(ol) {
    padding-left: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .newsletter-body :global(li) {
    margin-bottom: 0.375rem;
  }

  .newsletter-body :global(blockquote) {
    border-left: 3px solid var(--accent);
    padding-left: 1.25rem;
    margin-left: 0;
    color: var(--text-muted);
    font-style: italic;
    margin-bottom: 1.25rem;
  }

  .newsletter-body :global(strong),
  .newsletter-body :global(b) {
    color: var(--text-primary);
    font-weight: 700;
  }

  .newsletter-body :global(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin-block: 2rem;
  }

  /* Back to media */
  .back-section {
    padding-bottom: 4rem;
    border-top: 1px solid var(--border);
    padding-top: 2rem;
  }
</style>
