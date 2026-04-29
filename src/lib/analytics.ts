/**
 * Tiny client-only wrapper around the Umami tracker.
 *
 * Lets call sites do `track('booking-confirmed', { hours: 4 })` without
 * checking whether the tracker actually loaded (dev/preview, adblockers,
 * DNT-honoring browsers). Errors inside the tracker are swallowed so a
 * tracking failure can never break the user-facing flow.
 */

interface UmamiTracker {
  track(eventName: string, eventData?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

export function track(eventName: string, eventData?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    window.umami?.track(eventName, eventData);
  } catch {
    // Analytics must never throw into the calling code path.
  }
}
