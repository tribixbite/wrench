<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import { Loader2, Save, Wand2, Link2, PenLine } from 'lucide-svelte';
  import type { MediaArticle } from '$lib/server/schema';

  interface Props {
    article?: Partial<MediaArticle>;
    form?: { error?: string; fields?: Partial<MediaArticle> } | null;
    action: string;
  }
  const { article = {}, form = null, action }: Props = $props();

  const f = form?.fields ?? article;

  let submitting  = $state(false);
  let articleType = $state<'link' | 'newsletter'>((f.articleType as 'link' | 'newsletter') ?? 'link');
  let urlVal      = $state(f.url     ?? '');
  let summaryVal  = $state(f.summary ?? '');
  let bodyVal     = $state(f.body    ?? '');
  let fillState   = $state<'idle' | 'loading' | 'error'>('idle');

  let editorEl: HTMLDivElement | undefined = $state();

  onMount(() => {
    // Populate contenteditable with existing body when editing
    if (editorEl && bodyVal) {
      editorEl.innerHTML = bodyVal;
    }
  });

  function syncBody() {
    bodyVal = editorEl?.innerHTML ?? '';
  }

  function handlePaste(e: ClipboardEvent) {
    const items = Array.from(e.clipboardData?.items ?? []);

    // If clipboard has HTML (e.g. pasting from Square's newsletter), let the
    // browser insert it as-is — img tags with CDN src URLs are preserved and
    // now allowed by the img-src CSP directive.
    const hasHtml = items.some(i => i.type === 'text/html');
    if (hasHtml) {
      // Sync after the browser finishes inserting the HTML
      setTimeout(syncBody, 0);
      return;
    }

    // For raw image data (screenshot, copied image file) with no HTML wrapper,
    // read it as a data URL and insert an <img> tag manually.
    const imageItem = items.find(i => i.type.startsWith('image/'));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.execCommand('insertHTML', false, `<img src="${reader.result as string}" style="max-width:100%;height:auto" />`);
        syncBody();
      };
      reader.readAsDataURL(file);
    }
  }

  function format(cmd: string) {
    editorEl?.focus();
    document.execCommand(cmd, false);
    syncBody();
  }

  async function autoFill() {
    if (!urlVal || fillState === 'loading') return;
    fillState = 'loading';
    try {
      const res = await fetch('/api/admin/scrape-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      summaryVal = data.summary;
      fillState = 'idle';
    } catch {
      fillState = 'error';
      setTimeout(() => (fillState = 'idle'), 3000);
    }
  }

  function toSlug(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  let titleVal = $state(f.title ?? '');
  let slugVal  = $state(f.slug  ?? '');
  let autoSlug = $state(!f.slug);

  function onTitleInput(e: Event) {
    titleVal = (e.target as HTMLInputElement).value;
    if (autoSlug) slugVal = toSlug(titleVal);
  }
  function onSlugInput(e: Event) {
    slugVal = (e.target as HTMLInputElement).value;
    autoSlug = slugVal === '';
  }
</script>

<form
  method="POST"
  {action}
  use:enhance={() => {
    // Sync editor HTML to hidden input right before submit
    syncBody();
    submitting = true;
    return async ({ update }) => { await update(); submitting = false; };
  }}
  class="article-form"
>
  {#if form?.error}
    <div class="form-error" role="alert">{form.error}</div>
  {/if}

  <!-- Article type selector -->
  <div class="type-selector">
    <button
      type="button"
      class="type-btn"
      class:active={articleType === 'link'}
      onclick={() => (articleType = 'link')}
    >
      <Link2 size={15} />
      Media from Link
    </button>
    <button
      type="button"
      class="type-btn"
      class:active={articleType === 'newsletter'}
      onclick={() => (articleType = 'newsletter')}
    >
      <PenLine size={15} />
      Hand Wrote Newsletter
    </button>
  </div>
  <input type="hidden" name="articleType" value={articleType} />

  <div class="form-grid">
    <!-- Title -->
    <div class="field full">
      <label for="af-title">Title <span class="req">*</span></label>
      <input
        id="af-title"
        name="title"
        type="text"
        value={titleVal}
        oninput={onTitleInput}
        required
        placeholder="September 2026 Newsletter"
        class="input"
      />
    </div>

    <!-- Slug -->
    <div class="field full">
      <label for="af-slug">
        Slug <span class="req">*</span>
        <span class="field-hint">URL key — auto-filled from title, edit if needed</span>
      </label>
      <input
        id="af-slug"
        name="slug"
        type="text"
        value={slugVal}
        oninput={onSlugInput}
        required
        placeholder="september-2026-newsletter"
        class="input"
        pattern="[a-z0-9\-]+"
        title="Lowercase letters, numbers, and hyphens only"
      />
    </div>

    <!-- Category -->
    <div class="field">
      <label for="af-category">Category <span class="req">*</span></label>
      <select id="af-category" name="category" class="input" value={f.category ?? 'newsletter'}>
        <option value="newsletter">Newsletter</option>
        <option value="press">Press</option>
        <option value="announcement">Announcement</option>
      </select>
    </div>

    <!-- Date -->
    <div class="field">
      <label for="af-date">
        Date <span class="req">*</span>
        <span class="field-hint">Publication date shown on the card</span>
      </label>
      <input
        id="af-date"
        name="date"
        type="date"
        value={f.date ?? new Date().toISOString().slice(0, 10)}
        required
        class="input"
      />
    </div>

    <!-- Source -->
    <div class="field">
      <label for="af-source">
        Source <span class="req">*</span>
        <span class="field-hint">Publisher name shown on the card</span>
      </label>
      <input
        id="af-source"
        name="source"
        type="text"
        value={f.source ?? ''}
        required
        placeholder="Wrench Club Newsletter"
        class="input"
      />
    </div>

    <!-- Published toggle -->
    <div class="field field-checkbox">
      <label class="checkbox-label">
        <input
          type="checkbox"
          name="published"
          value="1"
          checked={f.published === undefined ? true : !!f.published}
          class="checkbox"
        />
        <span>Published <span class="field-hint">(uncheck to save as draft)</span></span>
      </label>
    </div>

    <!-- ── Link type fields ── -->
    {#if articleType === 'link'}
      <div class="field full">
        <label for="af-url">
          URL <span class="req">*</span>
          <span class="field-hint">Square "View in browser" link, news article URL, etc.</span>
        </label>
        <input
          id="af-url"
          name="url"
          type="url"
          value={urlVal}
          oninput={(e) => (urlVal = (e.target as HTMLInputElement).value)}
          placeholder="https://email.squareup.com/..."
          class="input"
        />
      </div>

      <div class="field full">
        <label for="af-image">
          Cover Image
          <span class="field-hint">Optional — path from /static (e.g. /assets/bmw.jpg)</span>
        </label>
        <input
          id="af-image"
          name="image"
          type="text"
          value={f.image ?? ''}
          placeholder="/assets/team-cars.jpg"
          class="input"
        />
      </div>

      <div class="field full">
        <div class="summary-label-row">
          <label for="af-summary">
            Summary <span class="req">*</span>
            <span class="field-hint">1–3 sentences shown on the media index card</span>
          </label>
          <button
            type="button"
            class="autofill-btn"
            class:error={fillState === 'error'}
            disabled={!urlVal || fillState === 'loading'}
            onclick={autoFill}
            title="Pull summary from the URL above"
          >
            {#if fillState === 'loading'}
              <Loader2 size={13} class="spin" /> Fetching…
            {:else if fillState === 'error'}
              <Wand2 size={13} /> Failed — try again
            {:else}
              <Wand2 size={13} /> Auto-fill from URL
            {/if}
          </button>
        </div>
        <textarea
          id="af-summary"
          name="summary"
          rows="4"
          placeholder="Grand opening recap, what's new in the tool library, and how to book your first bay session."
          class="input textarea"
          value={summaryVal}
          oninput={(e) => (summaryVal = (e.target as HTMLTextAreaElement).value)}
        ></textarea>
      </div>
    {/if}

    <!-- ── Newsletter type fields ── -->
    {#if articleType === 'newsletter'}
      <div class="field full">
        <div class="summary-label-row">
          <label for="af-summary-nl">
            Card Preview
            <span class="field-hint">Optional — short excerpt shown on the media index card</span>
          </label>
        </div>
        <textarea
          id="af-summary-nl"
          name="summary"
          rows="2"
          placeholder="Leave blank to show a generic 'Read Newsletter' prompt on the card."
          class="input textarea"
          value={summaryVal}
          oninput={(e) => (summaryVal = (e.target as HTMLTextAreaElement).value)}
        ></textarea>
      </div>

      <div class="field full">
        <p class="rte-label" id="rte-label">
          Newsletter Body <span class="req">*</span>
          <span class="field-hint">Paste your newsletter content here — formatting and images supported</span>
        </p>

        <!-- Formatting toolbar -->
        <div class="rte-toolbar" role="toolbar" aria-label="Text formatting">
          <button type="button" class="rte-btn bold" onclick={() => format('bold')} title="Bold (Ctrl+B)">B</button>
          <button type="button" class="rte-btn italic" onclick={() => format('italic')} title="Italic (Ctrl+I)">I</button>
          <button type="button" class="rte-btn underline" onclick={() => format('underline')} title="Underline (Ctrl+U)">U</button>
          <div class="rte-divider"></div>
          <button type="button" class="rte-btn" onclick={() => format('insertUnorderedList')} title="Bullet list">• List</button>
          <button type="button" class="rte-btn" onclick={() => format('insertOrderedList')} title="Numbered list">1. List</button>
          <div class="rte-divider"></div>
          <button type="button" class="rte-btn" onclick={() => format('removeFormat')} title="Clear formatting">✕ Clear</button>
        </div>

        <!-- Editable area -->
        <div
          bind:this={editorEl}
          contenteditable="true"
          role="textbox"
          aria-multiline="true"
          aria-labelledby="rte-label"
          class="rte-editor"
          oninput={syncBody}
          onpaste={handlePaste}
        ></div>
        <input type="hidden" name="body" value={bodyVal} />
      </div>
    {/if}
  </div>

  <!-- Hidden url/image for newsletter (not shown but still submitted) -->
  {#if articleType === 'newsletter'}
    <input type="hidden" name="url" value="" />
    <input type="hidden" name="image" value={f.image ?? ''} />
  {/if}

  <div class="form-actions">
    <button type="submit" class="btn btn-primary" disabled={submitting}>
      {#if submitting}
        <Loader2 size={16} class="spin" /> Saving…
      {:else}
        <Save size={16} /> Save Article
      {/if}
    </button>
    <a href="/app/admin/media" class="btn-cancel">Cancel</a>
  </div>
</form>

<style>
  .article-form { display: flex; flex-direction: column; gap: 1.75rem; }

  /* ── Type selector ── */
  .type-selector {
    display: flex;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    overflow: hidden;
    width: fit-content;
  }

  .type-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    background: var(--bg-elevated);
    color: var(--text-muted);
    border: none;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }

  .type-btn:first-child {
    border-right: 1px solid var(--border);
  }

  .type-btn.active {
    background: var(--accent);
    color: white;
  }

  .type-btn:not(.active):hover {
    background: var(--bg-card);
    color: var(--text-primary);
  }

  /* ── Form grid ── */
  .form-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 0.5rem;
    padding: 0.875rem 1rem;
    color: #fca5a5;
    font-size: 0.875rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }
  @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }

  .field { display: flex; flex-direction: column; gap: 0.375rem; }
  .field.full { grid-column: 1 / -1; }
  .field-checkbox { justify-content: flex-end; }

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .req { color: var(--accent); }

  .field-hint {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--text-muted);
  }

  .input {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
    color: var(--text-primary);
    width: 100%;
    transition: border-color 0.15s;
    font-family: inherit;
  }
  .input:focus { outline: none; border-color: var(--accent); }
  .input::placeholder { color: var(--text-muted); }
  .textarea { resize: vertical; min-height: 72px; }

  .summary-label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .rte-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin: 0;
  }

  /* ── Rich text editor ── */
  .rte-toolbar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: 0.5rem 0.5rem 0 0;
    flex-wrap: wrap;
  }

  .rte-btn {
    padding: 0.25rem 0.625rem;
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    font-family: inherit;
    line-height: 1.4;
  }

  .rte-btn.bold  { font-family: serif; }
  .rte-btn.italic { font-style: italic; font-family: serif; }
  .rte-btn.underline { text-decoration: underline; }

  .rte-btn:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border-color: var(--border);
  }

  .rte-divider {
    width: 1px;
    height: 1.25rem;
    background: var(--border);
    margin: 0 0.125rem;
    flex-shrink: 0;
  }

  .rte-editor {
    min-height: 320px;
    max-height: 640px;
    overflow-y: auto;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 0 0 0.5rem 0.5rem;
    padding: 1rem;
    font-size: 0.9375rem;
    color: var(--text-primary);
    line-height: 1.7;
    outline: none;
    /* Allow images to resize within the editor */
    word-break: break-word;
  }

  .rte-editor:focus {
    border-color: var(--accent);
  }

  .rte-editor :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.25rem;
  }

  .rte-editor :global(a) {
    color: var(--accent-text);
  }

  /* ── Autofill btn ── */
  .autofill-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.3rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-muted, rgba(237,12,133,0.1));
    border: 1px solid var(--accent-border, rgba(237,12,133,0.3));
    border-radius: 0.375rem;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, opacity 0.15s;
    flex-shrink: 0;
  }
  .autofill-btn:hover:not(:disabled) { background: rgba(237,12,133,0.18); }
  .autofill-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .autofill-btn.error { color: #f87171; border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.08); }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    cursor: pointer;
    font-weight: 400;
    font-size: 0.9375rem;
    color: var(--text-secondary);
  }
  .checkbox { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }

  .form-actions { display: flex; align-items: center; gap: 1.25rem; }

  .btn-cancel {
    background: none; border: none;
    color: var(--text-muted); font-size: 0.875rem;
    cursor: pointer; text-decoration: none;
    transition: color 0.15s;
  }
  .btn-cancel:hover { color: var(--text-secondary); }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
