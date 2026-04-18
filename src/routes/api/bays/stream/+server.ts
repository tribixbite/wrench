import type { RequestHandler } from './$types';
import { BAYS } from '$lib/server/square';

/**
 * GET /api/bays/stream — SSE endpoint for live bay availability.
 * Polls Square Bookings API every 30s and pushes status updates.
 *
 * Phase 2: Wire up to real Square Bookings resources once configured.
 * Phase 1: Returns mock bay statuses.
 */
export const GET: RequestHandler = async ({ request }) => {

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      /** Fetch live bay status from Square Bookings or return mock data */
      async function getBayStatus() {
        // TODO Phase 2: Replace with Square Bookings API query
        // const now = new Date();
        // const bookings = await square.bookings.list({ locationId: LOC, startAtMin: now.toISOString() });
        // Map bookings to bay statuses...

        // Phase 1: derive from configured bays, mark all available.
        return {
          ts: Date.now(),
          bays: BAYS.map(b => ({
            id: `${b.type}-${b.id}`,
            type: b.type,
            label: b.label,
            status: 'available' as const
          }))
        };
      }

      // Send initial state immediately
      getBayStatus().then(send);

      // Poll every 30s
      const interval = setInterval(() => {
        getBayStatus().then(send).catch(() => {
          clearInterval(interval);
          closed = true;
          try { controller.close(); } catch {}
        });
      }, 30_000);

      // Cleanup when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        closed = true;
        try { controller.close(); } catch {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no' // disable nginx buffering
    }
  });
};
