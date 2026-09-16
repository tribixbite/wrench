import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { mediaArticles } from '$lib/server/schema';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
  const category = url.searchParams.get('category') ?? 'all';

  const rows = await db
    .select()
    .from(mediaArticles)
    .where(
      category === 'all'
        ? eq(mediaArticles.published, 1)
        : and(eq(mediaArticles.published, 1), eq(mediaArticles.category, category))
    )
    .orderBy(desc(mediaArticles.date));

  return { articles: rows, activeCategory: category };
};
