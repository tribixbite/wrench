import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (locals.user?.role !== 'admin') throw error(403, 'Forbidden');

	const body = await request.json().catch(() => null);
	const url: unknown = body?.url;
	if (typeof url !== 'string' || !url) throw error(400, 'Missing url');

	// SSRF guard — only allow public HTTP(S) URLs
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw error(400, 'Invalid URL');
	}
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		throw error(400, 'Only http and https URLs are allowed');
	}
	const host = parsed.hostname.toLowerCase();
	// Block localhost, link-local (169.254.x.x), and RFC-1918 private ranges
	if (
		host === 'localhost' ||
		host === '0.0.0.0' ||
		/^127\./.test(host) ||
		/^10\./.test(host) ||
		/^192\.168\./.test(host) ||
		/^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
		/^169\.254\./.test(host) ||
		/^::1$/.test(host) ||
		/^::ffff:/i.test(host) ||           // IPv4-mapped IPv6 (covers all v4 private ranges)
		/^fc[0-9a-f]{2}:/i.test(host) ||   // IPv6 unique-local fc00::/7
		/^fe[89ab][0-9a-f]:/i.test(host) || // IPv6 link-local fe80::/10
		host.endsWith('.internal') ||
		host.endsWith('.local')
	) {
		throw error(400, 'That URL is not reachable');
	}

	let html: string;
	try {
		const res = await fetch(url, {
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WrenchBot/1.0)' },
			signal: AbortSignal.timeout(8000)
		});
		if (!res.ok) throw error(422, `URL returned ${res.status}`);
		html = await res.text();
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(422, 'Could not fetch that URL');
	}

	// Priority 1: og:description (used by most news sites + social platforms)
	const ogDesc = extractMeta(html, 'og:description', 'property') ?? extractMeta(html, 'og:description', 'name');
	if (ogDesc && ogDesc.length > 30) return json({ summary: ogDesc });

	// Priority 2: standard meta description
	const metaDesc = extractMeta(html, 'description', 'name');
	if (metaDesc && metaDesc.length > 30) return json({ summary: metaDesc });

	// Priority 3: first two sentences from <p> tags
	const sentences = extractSentences(html, 2);
	if (sentences) return json({ summary: sentences });

	throw error(422, 'Could not extract summary from that page');
};

function extractMeta(html: string, value: string, attr: 'property' | 'name'): string | null {
	// Handles both attribute orderings: <meta property="X" content="Y"> and <meta content="Y" property="X">
	const patterns = [
		new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']{10,500})["']`, 'i'),
		new RegExp(`<meta[^>]+content=["']([^"']{10,500})["'][^>]+${attr}=["']${value}["']`, 'i')
	];
	for (const re of patterns) {
		const m = html.match(re);
		if (m?.[1]) return decodeEntities(m[1].trim());
	}
	return null;
}

function extractSentences(html: string, count: number): string {
	const paragraphs: string[] = [];
	const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
	let m: RegExpExecArray | null;
	while ((m = pRe.exec(html)) !== null && paragraphs.join(' ').length < 800) {
		const text = stripTags(m[1]).trim();
		if (text.length > 40) paragraphs.push(text);
	}
	const full = paragraphs.join(' ');
	const sentences = full.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [];
	return sentences.slice(0, count).join(' ').trim() || full.slice(0, 300);
}

function stripTags(s: string): string {
	return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeEntities(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ');
}
