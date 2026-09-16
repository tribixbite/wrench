import type { Actions, PageServerLoad } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { mediaArticles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { sanitizeHtml } from '$lib/server/sanitize';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (locals.user?.role !== 'admin') throw redirect(303, '/app/dashboard');

  const [article] = await db
    .select()
    .from(mediaArticles)
    .where(eq(mediaArticles.id, params.id))
    .limit(1);

  if (!article) throw error(404, 'Article not found');
  return { article };
};

export const actions: Actions = {
  default: async ({ request, locals, params }) => {
    if (locals.user?.role !== 'admin') return fail(403, { error: 'Forbidden' });

    const data = await request.formData();
    const articleType = data.get('articleType')?.toString() === 'newsletter' ? 'newsletter' : 'link';
    const title    = data.get('title')?.toString().trim() ?? '';
    const slug     = data.get('slug')?.toString().trim().toLowerCase() ?? '';
    const category = data.get('category')?.toString() ?? '';
    const date     = data.get('date')?.toString() ?? '';
    const source   = data.get('source')?.toString().trim() ?? '';
    const summary  = data.get('summary')?.toString().trim() ?? '';
    const url      = articleType === 'link' ? (data.get('url')?.toString().trim() ?? '') : '';
    const image    = data.get('image')?.toString().trim() || null;
    const published = data.get('published') === '1' ? 1 : 0;
    const body     = articleType === 'newsletter' ? sanitizeHtml(data.get('body')?.toString() ?? '') : '';

    const fields = { title, slug, category, date, source, summary, url, image: image ?? undefined, published, articleType, body };

    if (!title || !slug || !category || !date || !source) {
      return fail(400, { error: 'Title, slug, category, date, and source are required.', fields });
    }
    if (articleType === 'link' && !url) {
      return fail(400, { error: 'URL is required for Media from Link articles.', fields });
    }
    if (articleType === 'link' && !summary) {
      return fail(400, { error: 'Summary is required for Media from Link articles.', fields });
    }
    if (articleType === 'newsletter' && !body.trim()) {
      return fail(400, { error: 'Newsletter body cannot be empty.', fields });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return fail(400, { error: 'Slug may only contain lowercase letters, numbers, and hyphens.', fields });
    }
    if (!['newsletter', 'press', 'announcement'].includes(category)) {
      return fail(400, { error: 'Invalid category.', fields });
    }

    try {
      await db
        .update(mediaArticles)
        .set({ slug, title, date, category, source, summary, url, image, published, articleType, body })
        .where(eq(mediaArticles.id, params.id));
    } catch (e: any) {
      const duplicate = e?.message?.includes('UNIQUE') || e?.code === 'SQLITE_CONSTRAINT_UNIQUE';
      return fail(400, {
        error: duplicate ? `A slug "${slug}" already exists — choose a different one.` : 'Failed to save article. Please try again.',
        fields
      });
    }

    throw redirect(303, '/app/admin/media');
  }
};
