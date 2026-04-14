import type { RequestHandler } from './$types';
import { square } from '$lib/server/square';
import { env } from '$env/dynamic/private';

/**
 * GET /api/bays/stream — SSE endpoint for live bay availability.
 * Polls Square Bookings API every 30s and pushes status updates.
 *
 * Phase 2: Wire up to real Square Bookings resources once configured.
 * Phase 1: Returns mock bay statuses.
 */
export const GET: RequestHandler = async ({ request }) => {
  const LOC = env.SQUARE_LOCATION_ID ?? env.SQUARE_SANDBOX_LOCATION_ID ?? '';

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

        // Mock data for Phase 1 / dev
        return {
          ts: Date.now(),
          bays: [
            { id: 'flat-1', type: 'flat', label: 'Flat Bay 1', status: 'available' },
            { id: 'flat-2', type: 'flat', label: 'Flat Bay 2', status: 'available' },
            { id: 'flat-3', type: 'flat', label: 'Flat Bay 3', status: 'available' },
            { id: 'hoist-1', type: 'hoist', label: 'Hoist Bay 1', status: 'available' },
            { id: 'hoist-2', type: 'hoist', label: 'Hoist Bay 2', status: 'available' },
            { id: 'hoist-3', type: 'hoist', label: 'Hoist Bay 3', status: 'available' },
            { id: 'detail-1', type: 'detail', label: 'Detail Bay', status: 'available' }
          ]
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
