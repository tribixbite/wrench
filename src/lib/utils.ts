/**
 * Shared pure utility functions — no server-only imports, safe to use in
 * both client and server contexts.
 */

/**
 * Format an ISO 8601 date string into a human-readable date + time.
 * Example: "2026-04-15T09:00:00Z" → "Apr 15, 2026 at 9:00 AM"
 *
 * @param isoString - ISO 8601 date-time string
 * @returns Formatted string in "MMM D, YYYY at h:mm AM/PM" style (UTC)
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  });
  return `${datePart} at ${timePart}`;
}

/**
 * Extract a user-facing error message from a non-OK fetch Response.
 * Prefers `{ message }` or `{ error }` JSON fields; falls back to raw body
 * text (first 200 chars) or `HTTP {status}`. Never throws.
 */
export async function extractErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.message === 'string' && parsed.message) return parsed.message;
        if (typeof parsed.error === 'string' && parsed.error) return parsed.error;
      }
    } catch {
      // Not JSON — fall through to raw text if it's short enough to be human-readable.
      const trimmed = text.trim();
      if (trimmed && trimmed.length <= 200) return trimmed;
    }
  }
  return `HTTP ${res.status}`;
}

/**
 * Format a duration in minutes to a short human-readable string.
 * 90  → "90 min"
 * 180 → "3 hrs"
 * 60  → "1 hr"
 *
 * @param minutes - Duration in minutes (must be a positive integer)
 * @returns Human-readable duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60 || minutes % 60 !== 0) {
    return `${minutes} min`;
  }
  const hrs = minutes / 60;
  return hrs === 1 ? '1 hr' : `${hrs} hrs`;
}
