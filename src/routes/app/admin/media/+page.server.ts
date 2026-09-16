import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { mediaArticles } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
  const articles = await db
    .select()
    .from(mediaArticles)
    .orderBy(desc(mediaArticles.date));
  return { articles };
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    if (locals.user?.role !== 'admin') return fail(403, { error: 'Forbidden' });
    const data = await request.formData();
    const id = data.get('id')?.toString();
    if (!id) return fail(400, { error: 'Missing id' });
    await db.delete(mediaArticles).where(eq(mediaArticles.id, id));
    return { deleted: true };
  },

  togglePublished: async ({ request, locals }) => {
    if (locals.user?.role !== 'admin') return fail(403, { error: 'Forbidden' });
    const data = await request.formData();
    const id = data.get('id')?.toString();
    const current = Number(data.get('published') ?? 1);
    if (!id) return fail(400, { error: 'Missing id' });
    await db
      .update(mediaArticles)
      .set({ published: current === 1 ? 0 : 1 })
      .where(eq(mediaArticles.id, id));
    return { toggled: true };
  }
};
