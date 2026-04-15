/**
 * Tests for Zod API schemas in src/lib/schemas/api.ts
 *
 * The `import { z } from 'zod'` in api.ts fails inside vitest's Vite module
 * runner because zod v4's ESM index re-exports z as a namespace (`import * as z
 * from './v3/external.js'; export { z }`) and Vite's interop doesn't resolve
 * the indirect namespace re-export correctly.
 *
 * The fix: we mock 'zod' with the CJS exports which have z as a direct property.
 * Tests cover safeParse() semantics — real zod validation — using the real zod
 * implementation loaded via require().
 */
import { describe, it, expect, vi } from 'vitest';

// Provide the real zod implementation via require (CJS) to avoid the ESM
// namespace re-export issue in vitest's Vite module runner.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const zodCjs = require('zod');
const realZ = zodCjs.z ?? zodCjs;

vi.mock('zod', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const m = require('zod');
  const z = m.z ?? m;
  return {
    z,
    default: z,
    // re-export all named exports from the CJS module
    ...m
  };
});

import {
  WaitlistPostBody,
  AvailabilityPostBody,
  BookingCreateBody
} from '../api';

// Quick sanity: ensure the mock worked and z.object is callable
if (typeof realZ.object !== 'function') {
  throw new Error('Test setup error: zod mock did not expose z.object as a function');
}

// ---------------------------------------------------------------------------
// WaitlistPostBody
// ---------------------------------------------------------------------------

describe('WaitlistPostBody', () => {
  it('accepts a valid email with no name', () => {
    const result = WaitlistPostBody.safeParse({ email: 'driver@example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid email + name', () => {
    const result = WaitlistPostBody.safeParse({ email: 'driver@example.com', name: 'Alex Smith' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Alex Smith');
    }
  });

  it('rejects an invalid email format', () => {
    const result = WaitlistPostBody.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('rejects an empty email string', () => {
    const result = WaitlistPostBody.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email field', () => {
    const result = WaitlistPostBody.safeParse({ name: 'Alex' });
    expect(result.success).toBe(false);
  });

  it('rejects a name longer than 80 characters', () => {
    const longName = 'A'.repeat(81);
    const result = WaitlistPostBody.safeParse({ email: 'ok@example.com', name: longName });
    expect(result.success).toBe(false);
  });

  it('accepts a name of exactly 80 characters', () => {
    const maxName = 'A'.repeat(80);
    const result = WaitlistPostBody.safeParse({ email: 'ok@example.com', name: maxName });
    expect(result.success).toBe(true);
  });

  it('allows name to be omitted (optional)', () => {
    const result = WaitlistPostBody.safeParse({ email: 'ok@example.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// AvailabilityPostBody
// ---------------------------------------------------------------------------

describe('AvailabilityPostBody', () => {
  const valid = { bayNumber: 1, variationKey: 'min90', date: '2026-06-15' };

  it('accepts a valid request body', () => {
    const result = AvailabilityPostBody.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts bayNumber 5 (upper bound)', () => {
    const result = AvailabilityPostBody.safeParse({ ...valid, bayNumber: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects bayNumber 0 (out of range — below min)', () => {
    const result = AvailabilityPostBody.safeParse({ ...valid, bayNumber: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects bayNumber 6 (out of range — above max)', () => {
    const result = AvailabilityPostBody.safeParse({ ...valid, bayNumber: 6 });
    expect(result.success).toBe(false);
  });

  it('accepts variationKey "hr3"', () => {
    const result = AvailabilityPostBody.safeParse({ ...valid, variationKey: 'hr3' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid variationKey', () => {
    const result = AvailabilityPostBody.safeParse({ ...valid, variationKey: 'min45' });
    expect(result.success).toBe(false);
  });

  it('rejects a date in wrong format (MM/DD/YYYY)', () => {
    const result = AvailabilityPostBody.safeParse({ ...valid, date: '06/15/2026' });
    expect(result.success).toBe(false);
  });

  it('rejects a date with time component (not bare YYYY-MM-DD)', () => {
    const result = AvailabilityPostBody.safeParse({ ...valid, date: '2026-06-15T00:00:00Z' });
    expect(result.success).toBe(false);
  });

  it('accepts variationKey "min90"', () => {
    const result = AvailabilityPostBody.safeParse({ ...valid, variationKey: 'min90' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// BookingCreateBody
// ---------------------------------------------------------------------------

describe('BookingCreateBody', () => {
  const valid = {
    bayNumber: 1,
    variationKey: 'hr3',
    startAt: '2026-06-15T10:00:00Z'
  };

  it('accepts a valid booking create body', () => {
    const result = BookingCreateBody.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts a body with an optional note', () => {
    const result = BookingCreateBody.safeParse({ ...valid, note: 'Bringing a BMW M3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBe('Bringing a BMW M3');
    }
  });

  it('rejects a body missing startAt', () => {
    const { startAt: _, ...noStart } = valid;
    const result = BookingCreateBody.safeParse(noStart);
    expect(result.success).toBe(false);
  });

  it('rejects startAt with wrong datetime format (bare date)', () => {
    const result = BookingCreateBody.safeParse({ ...valid, startAt: '2026-06-15' });
    expect(result.success).toBe(false);
  });

  it('rejects bayNumber 0', () => {
    const result = BookingCreateBody.safeParse({ ...valid, bayNumber: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects bayNumber 6', () => {
    const result = BookingCreateBody.safeParse({ ...valid, bayNumber: 6 });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid variationKey', () => {
    const result = BookingCreateBody.safeParse({ ...valid, variationKey: 'day' });
    expect(result.success).toBe(false);
  });

  it('rejects a note exceeding 500 characters', () => {
    const result = BookingCreateBody.safeParse({ ...valid, note: 'N'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts a note of exactly 500 characters', () => {
    const result = BookingCreateBody.safeParse({ ...valid, note: 'N'.repeat(500) });
    expect(result.success).toBe(true);
  });
});
