import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { mediaArticles } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
  const [article] = await db
    .select()
    .from(mediaArticles)
    .where(and(eq(mediaArticles.slug, params.slug), eq(mediaArticles.published, 1)))
    .limit(1);

  if (!article || article.articleType !== 'newsletter') throw error(404, 'Not found');
  return { article };
};
