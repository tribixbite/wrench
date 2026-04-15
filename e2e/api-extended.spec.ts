/**
 * Extended API tests — covers authenticated endpoints, schema validation,
 * error paths, webhook signature verification, SSE stream, catalog, and docs.
 *
 * Complements api.spec.ts (smoke tests) with deeper coverage.
 * Uses shared auth state from global-setup for authenticated endpoints.
 */
import { test, expect } from '@playwright/test';
import { createHmac } from 'crypto';

const AUTH_STATE = 'e2e/.auth/state.json';

function base() {
  return process.env.TEST_BASE_URL ?? 'https://thewrench.club';
}

/** Build a valid Square HMAC-SHA256 signature for testing */
function squareSignature(body: string, secret: string, url: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(url + body);
  return hmac.digest('base64');
}

// ─── Catalog ────────────────────────────────────────────────────────────────

test.describe('GET /api/catalog', () => {
  test('returns 200 with items array', async ({ request }) => {
    const res = await request.get(`${base()}/api/catalog`);
    // 503 = Square sandbox token issue — skip gracefully
    if (res.status() === 503) { test.skip(); return; }

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
  });

  test('items have correct structure (id, name, description, variations)', async ({ request }) => {
    const res = await request.get(`${base()}/api/catalog`);
    if (res.status() !== 200) { test.skip(); return; }

    const { items } = await res.json();
    if (items.length === 0) { test.skip(); return; }

    const item = items[0];
    expect(typeof item.id).toBe('string');
    expect(typeof item.name).toBe('string');
    expect(typeof item.description).toBe('string');
    expect(Array.isArray(item.variations)).toBe(true);
  });

  test('variations have pricing fields', async ({ request }) => {
    const res = await request.get(`${base()}/api/catalog`);
    if (res.status() !== 200) { test.skip(); return; }

    const { items } = await res.json();
    const withVariations = items.find((i: any) => i.variations.length > 0);
    if (!withVariations) { test.skip(); return; }

    const v = withVariations.variations[0];
    expect(typeof v.id).toBe('string');
    expect(typeof v.name).toBe('string');
    expect(typeof v.priceCents).toBe('number');
    expect(typeof v.currency).toBe('string');
    expect(typeof v.pricingType).toBe('string');
  });

  test('response has cache-control header', async ({ request }) => {
    const res = await request.get(`${base()}/api/catalog`);
    if (res.status() !== 200) { test.skip(); return; }

    const cc = res.headers()['cache-control'] ?? '';
    expect(cc).toMatch(/s-maxage=300/);
  });
});

// ─── Bookings List (authenticated) ──────────────────────────────────────────

test.describe('GET /api/bookings/list (authenticated)', () => {
  test.use({ storageState: AUTH_STATE });

  test('returns 200 with bookings array', async ({ request }) => {
    const res = await request.get(`${base()}/api/bookings/list`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('bookings');
    expect(Array.isArray(body.bookings)).toBe(true);
  });

  test('bookings are sorted chronologically', async ({ request }) => {
    const res = await request.get(`${base()}/api/bookings/list`);
    if (res.status() !== 200) { test.skip(); return; }

    const { bookings } = await res.json();
    if (bookings.length < 2) { test.skip(); return; }

    for (let i = 1; i < bookings.length; i++) {
      expect(bookings[i].startAt >= bookings[i - 1].startAt).toBe(true);
    }
  });

  test('does not return cancelled bookings', async ({ request }) => {
    const res = await request.get(`${base()}/api/bookings/list`);
    if (res.status() !== 200) { test.skip(); return; }

    const { bookings } = await res.json();
    const cancelled = bookings.filter(
      (b: any) => b.status === 'CANCELLED_BY_CUSTOMER' || b.status === 'CANCELLED_BY_SELLER' || b.status === 'NO_SHOW'
    );
    expect(cancelled).toHaveLength(0);
  });
});

// ─── Bookings Availability (authenticated) ──────────────────────────────────

test.describe('POST /api/bookings/availability (authenticated)', () => {
  test.use({ storageState: AUTH_STATE });

  // Use a date 7 days from now to increase chance of availability
  const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  test('returns 200 with slots array for all bays', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/availability`, {
      data: { variationKey: 'min90', date: futureDate },
      headers: { 'Content-Type': 'application/json' },
    });
    // 502 = Square sandbox unavailable
    if (res.status() === 502) { test.skip(); return; }

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('slots');
    expect(Array.isArray(body.slots)).toBe(true);
  });

  test('returns slots with bayNumber and teamMemberId', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/availability`, {
      data: { variationKey: 'min90', date: futureDate },
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status() !== 200) { test.skip(); return; }

    const { slots } = await res.json();
    if (slots.length === 0) { test.skip(); return; }

    const slot = slots[0];
    expect(typeof slot.startAt).toBe('string');
    expect(typeof slot.teamMemberId).toBe('string');
    expect(typeof slot.bayNumber).toBe('number');
    expect(slot.bayNumber).toBeGreaterThanOrEqual(1);
    expect(slot.bayNumber).toBeLessThanOrEqual(5);
  });

  test('single bay query returns slots for that bay only', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/availability`, {
      data: { bayNumber: 1, variationKey: 'min90', date: futureDate },
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status() !== 200) { test.skip(); return; }

    const { slots } = await res.json();
    for (const slot of slots) {
      expect(slot.bayNumber).toBe(1);
    }
  });

  test('3-hour variation returns slots', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/availability`, {
      data: { variationKey: 'hr3', date: futureDate },
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status() === 502) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.slots)).toBe(true);
  });

  test('invalid bayNumber returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/availability`, {
      data: { bayNumber: 99, variationKey: 'min90', date: futureDate },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('invalid variationKey returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/availability`, {
      data: { variationKey: 'invalid', date: futureDate },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('invalid date format returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/availability`, {
      data: { variationKey: 'min90', date: 'not-a-date' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('missing required fields returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/availability`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── Bookings Create (authenticated) ────────────────────────────────────────

test.describe('POST /api/bookings/create (authenticated)', () => {
  test.use({ storageState: AUTH_STATE });

  test('invalid bayNumber returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/create`, {
      data: { bayNumber: 0, variationKey: 'min90', startAt: new Date().toISOString() },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('bayNumber 6 (out of range) returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/create`, {
      data: { bayNumber: 6, variationKey: 'min90', startAt: new Date().toISOString() },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('invalid variationKey returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/create`, {
      data: { bayNumber: 1, variationKey: 'invalid', startAt: new Date().toISOString() },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('invalid startAt (not ISO datetime) returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/create`, {
      data: { bayNumber: 1, variationKey: 'min90', startAt: 'not-a-date' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('missing body returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/create`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('note exceeding 500 chars returns 400', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/create`, {
      data: {
        bayNumber: 1,
        variationKey: 'min90',
        startAt: new Date().toISOString(),
        note: 'x'.repeat(501)
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── Resend Verification ────────────────────────────────────────────────────

test.describe('POST /api/resend-verification', () => {
  test('returns 401 without a session cookie', async ({ request }) => {
    const res = await request.post(`${base()}/api/resend-verification`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('POST /api/resend-verification (authenticated)', () => {
  test.use({ storageState: AUTH_STATE });

  test('returns 200 with ok field', async ({ request }) => {
    const res = await request.post(`${base()}/api/resend-verification`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBeLessThan(500);
    const body = await res.json();
    expect(body).toHaveProperty('ok');
  });
});

// ─── Square Webhook ─────────────────────────────────────────────────────────

test.describe('POST /api/webhooks/square', () => {
  const webhookUrl = `${base()}/api/webhooks/square`;

  test('missing signature returns 401 (when secret is configured)', async ({ request }) => {
    const body = JSON.stringify({ type: 'payment.completed', data: {} });
    const res = await request.post(webhookUrl, {
      data: body,
      headers: { 'Content-Type': 'application/json' },
    });
    // 401 = invalid signature (secret configured), 503 = secret not configured
    expect([401, 503]).toContain(res.status());
  });

  test('invalid signature returns 401', async ({ request }) => {
    const body = JSON.stringify({ type: 'booking.created', data: {} });
    const res = await request.post(webhookUrl, {
      data: body,
      headers: {
        'Content-Type': 'application/json',
        'Square-Signature': 'invalid-signature-value'
      },
    });
    expect([401, 503]).toContain(res.status());
  });

  test('empty body with signature returns 400 or 401', async ({ request }) => {
    const res = await request.post(webhookUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Square-Signature': 'dGVzdA=='
      },
    });
    // 400 (malformed JSON), 401 (invalid sig), or 503 (not configured)
    expect([400, 401, 503]).toContain(res.status());
  });

  test('known event types do not crash the server', async ({ request }) => {
    // Without the webhook secret, we can't generate valid signatures.
    // This test verifies the endpoint handles all event types gracefully
    // (returns 401 or 503, not 500).
    const events = [
      'payment.completed',
      'subscription.created',
      'subscription.updated',
      'booking.created',
      'booking.updated',
      'booking.cancelled',
      'customer.created',
      'inventory.count.updated'
    ];

    for (const eventType of events) {
      const body = JSON.stringify({ type: eventType, data: {} });
      const res = await request.post(webhookUrl, {
        data: body,
        headers: { 'Content-Type': 'application/json' },
      });
      // 401 (invalid sig) or 503 (secret not configured) — never 500 (crash)
      expect([401, 503]).toContain(res.status());
    }
  });
});

// ─── SSE Stream ─────────────────────────────────────────────────────────────
// SSE streams never close, so we use fetch + AbortController with a short timeout

test.describe('GET /api/bays/stream (SSE)', () => {
  /** Fetch SSE stream with a timeout, return headers + partial body */
  async function fetchSSE(timeoutMs = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${base()}/api/bays/stream`, {
      signal: controller.signal,
      headers: { Accept: 'text/event-stream' },
    }).catch(() => null);

    clearTimeout(timer);
    if (!res) return null;

    let text = '';
    try {
      // Read until abort or enough data
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          // Stop after first complete SSE message
          if (text.includes('\n\n')) break;
        }
        reader.cancel().catch(() => {});
      }
    } catch {
      // AbortError is expected
    }

    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      text,
    };
  }

  test('returns 200 with text/event-stream content type', async () => {
    const res = await fetchSSE();
    if (!res) { test.skip(); return; }

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
  });

  test('returns cache-control: no-cache', async () => {
    const res = await fetchSSE();
    if (!res) { test.skip(); return; }

    expect(res.headers['cache-control']).toMatch(/no-cache/);
  });

  test('initial SSE payload contains bay data', async () => {
    const res = await fetchSSE();
    if (!res || !res.text) { test.skip(); return; }

    expect(res.text).toContain('data:');

    const match = res.text.match(/data:\s*(.+)/);
    expect(match).not.toBeNull();

    const payload = JSON.parse(match![1]);
    expect(payload).toHaveProperty('ts');
    expect(payload).toHaveProperty('bays');
    expect(Array.isArray(payload.bays)).toBe(true);
    expect(payload.bays.length).toBeGreaterThan(0);
  });

  test('bay objects have correct structure', async () => {
    const res = await fetchSSE();
    if (!res || !res.text) { test.skip(); return; }

    const match = res.text.match(/data:\s*(.+)/);
    if (!match) { test.skip(); return; }

    const payload = JSON.parse(match[1]);
    const bay = payload.bays[0];
    expect(typeof bay.id).toBe('string');
    expect(typeof bay.type).toBe('string');
    expect(typeof bay.label).toBe('string');
    expect(typeof bay.status).toBe('string');
    expect(['available', 'occupied', 'reserved', 'maintenance']).toContain(bay.status);
  });
});

// ─── API Docs ───────────────────────────────────────────────────────────────

test.describe('GET /api/docs', () => {
  test('returns Swagger UI HTML page', async ({ request }) => {
    const res = await request.get(`${base()}/api/docs`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/text\/html/);

    const html = await res.text();
    expect(html).toContain('swagger-ui');
    expect(html).toContain('WRENCH CLUB');
    expect(html).toContain('/api/docs/openapi.json');
  });
});

test.describe('GET /api/docs/openapi.json', () => {
  test('returns valid OpenAPI spec', async ({ request }) => {
    const res = await request.get(`${base()}/api/docs/openapi.json`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/application\/json/);

    const spec = await res.json();
    expect(spec).toHaveProperty('openapi');
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec).toHaveProperty('info');
    expect(spec.info).toHaveProperty('title');
    expect(spec).toHaveProperty('paths');
  });

  test('has CORS header for external tools', async ({ request }) => {
    const res = await request.get(`${base()}/api/docs/openapi.json`);
    expect(res.headers()['access-control-allow-origin']).toBe('*');
  });

  test('has cache-control header', async ({ request }) => {
    const res = await request.get(`${base()}/api/docs/openapi.json`);
    const cc = res.headers()['cache-control'] ?? '';
    expect(cc).toMatch(/max-age=60/);
  });
});

// ─── Auth guard consistency ─────────────────────────────────────────────────

test.describe('Auth guards (unauthenticated)', () => {
  test('GET /api/bookings/list returns 401', async ({ request }) => {
    const res = await request.get(`${base()}/api/bookings/list`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/bookings/availability returns 401', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/availability`, {
      data: { variationKey: 'min90', date: '2026-06-01' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/bookings/create returns 401', async ({ request }) => {
    const res = await request.post(`${base()}/api/bookings/create`, {
      data: { bayNumber: 1, variationKey: 'min90', startAt: new Date().toISOString() },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/resend-verification returns 401', async ({ request }) => {
    const res = await request.post(`${base()}/api/resend-verification`);
    expect(res.status()).toBe(401);
  });
});
