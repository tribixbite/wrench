/**
 * Wrench Club media content.
 *
 * Add new entries at the TOP of the `articles` array (newest first).
 * Each entry links to an external URL — a Square Marketing campaign,
 * a news article, an announcement, etc.
 *
 * Fields:
 *   slug        Unique short identifier (kebab-case, used as DOM key).
 *   title       Article/newsletter headline.
 *   date        ISO date string "YYYY-MM-DD".
 *   category    'newsletter' | 'press' | 'announcement'
 *   source      Publisher name shown on the card (e.g. "Wrench Club" or "MLive").
 *   summary     1–3 sentence excerpt shown on the card.
 *   url         Full URL to the external page. Opens in a new tab.
 *   image       Optional card cover image path (relative to /static, e.g. "/assets/bmw.jpg").
 */
export interface MediaArticle {
  slug: string;
  title: string;
  date: string;
  category: 'newsletter' | 'press' | 'announcement';
  source: string;
  summary: string;
  url: string;
  image?: string;
}

export const articles: MediaArticle[] = [
  // ── Add new entries here, newest first ────────────────────────────────────
  // Example newsletter (replace with your Square campaign "View in browser" URL):
  // {
  //   slug: 'september-2026-newsletter',
  //   title: 'September 2026 — Doors Are Open',
  //   date: '2026-09-01',
  //   category: 'newsletter',
  //   source: 'Wrench Club Newsletter',
  //   summary: 'Grand opening recap, what's new in the tool library, and how to book your first bay session.',
  //   url: 'https://email.squareup.com/...',
  //   image: '/assets/team-cars.jpg',
  // },
];

/** All unique categories present in the articles list, in display order. */
export const CATEGORIES: Array<{ value: MediaArticle['category'] | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'press', label: 'Press' },
  { value: 'announcement', label: 'Announcement' },
];

export const CATEGORY_LABELS: Record<MediaArticle['category'], string> = {
  newsletter: 'Newsletter',
  press: 'Press',
  announcement: 'Announcement',
};
