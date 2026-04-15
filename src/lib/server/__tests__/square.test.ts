/**
 * Tests for Square constants and pure helpers in src/lib/server/square.ts.
 * The Square SDK client and env-dependent LOCATION_ID are tested in isolation
 * using vi.mock() so no real API calls are made.
 */
import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module-level mocks — declared before any imports that use them.
// vi.mock() is hoisted, so these factories run before module evaluation.
// ---------------------------------------------------------------------------

vi.mock('$env/dynamic/private', () => ({
  env: {
    SQUARE_ACCESS_TOKEN: 'test-token',
    SANDBOX_SECRET: 'test-sandbox-secret',
    SQUARE_ENVIRONMENT: 'sandbox',
    SQUARE_LOCATION_ID: 'TEST_LOCATION_ID',
    SQUARE_SANDBOX_LOCATION_ID: 'SANDBOX_LOCATION_ID'
  }
}));

// Mock the Square SDK with a proper class (Reflect.construct requires a real
// constructor, not a plain function, when called with `new`).
vi.mock('square', () => {
  class MockSquareClient {
    customers = { create: vi.fn() };
    bookings = { create: vi.fn(), searchAvailability: vi.fn() };
    catalog = { search: vi.fn() };
  }

  return {
    SquareClient: MockSquareClient,
    SquareEnvironment: {
      Production: 'production',
      Sandbox: 'sandbox'
    }
  };
});

// ---------------------------------------------------------------------------
// Imports (after mocks are declared)
// ---------------------------------------------------------------------------

import {
  BAY_TEAM_MEMBERS,
  BAY_VARIATIONS,
  BAY_PRICES,
  BAY_LABELS,
  LOCATION_ID
} from '../square';

// ---------------------------------------------------------------------------
// BAY_TEAM_MEMBERS
// ---------------------------------------------------------------------------

describe('BAY_TEAM_MEMBERS', () => {
  it('has exactly 5 entries', () => {
    expect(Object.keys(BAY_TEAM_MEMBERS)).toHaveLength(5);
  });

  it('has keys 1 through 5', () => {
    for (let i = 1; i <= 5; i++) {
      expect(BAY_TEAM_MEMBERS[i]).toBeDefined();
    }
  });

  it('does not have a key 0', () => {
    expect(BAY_TEAM_MEMBERS[0]).toBeUndefined();
  });

  it('does not have a key 6', () => {
    expect(BAY_TEAM_MEMBERS[6]).toBeUndefined();
  });

  it('all values are non-empty strings starting with "TM"', () => {
    for (const [, id] of Object.entries(BAY_TEAM_MEMBERS)) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      expect(id).toMatch(/^TM/);
    }
  });

  it('all values are unique (no duplicate team member IDs)', () => {
    const ids = Object.values(BAY_TEAM_MEMBERS);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// BAY_VARIATIONS
// ---------------------------------------------------------------------------

describe('BAY_VARIATIONS', () => {
  it('has exactly the keys "min90" and "hr3"', () => {
    const keys = Object.keys(BAY_VARIATIONS);
    expect(keys).toHaveLength(2);
    expect(keys).toContain('min90');
    expect(keys).toContain('hr3');
  });

  it('min90 value is a non-empty string', () => {
    expect(typeof BAY_VARIATIONS.min90).toBe('string');
    expect(BAY_VARIATIONS.min90.length).toBeGreaterThan(0);
  });

  it('hr3 value is a non-empty string', () => {
    expect(typeof BAY_VARIATIONS.hr3).toBe('string');
    expect(BAY_VARIATIONS.hr3.length).toBeGreaterThan(0);
  });

  it('min90 and hr3 IDs are distinct', () => {
    expect(BAY_VARIATIONS.min90).not.toBe(BAY_VARIATIONS.hr3);
  });
});

// ---------------------------------------------------------------------------
// BAY_PRICES
// ---------------------------------------------------------------------------

describe('BAY_PRICES', () => {
  it('has exactly 2 keys matching BAY_VARIATIONS', () => {
    const priceKeys = Object.keys(BAY_PRICES);
    const variationKeys = Object.keys(BAY_VARIATIONS);
    expect(priceKeys.sort()).toEqual(variationKeys.sort());
  });

  it('min90 price is 4000 cents ($40)', () => {
    expect(BAY_PRICES.min90).toBe(4000);
  });

  it('hr3 price is 6000 cents ($60)', () => {
    expect(BAY_PRICES.hr3).toBe(6000);
  });

  it('all prices are positive integers', () => {
    for (const [, price] of Object.entries(BAY_PRICES)) {
      expect(Number.isInteger(price)).toBe(true);
      expect(price).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// BAY_LABELS
// ---------------------------------------------------------------------------

describe('BAY_LABELS', () => {
  it('has exactly 2 labels matching BAY_VARIATIONS', () => {
    const labelKeys = Object.keys(BAY_LABELS);
    const variationKeys = Object.keys(BAY_VARIATIONS);
    expect(labelKeys.sort()).toEqual(variationKeys.sort());
  });

  it('min90 label is "90 min — $40"', () => {
    expect(BAY_LABELS.min90).toBe('90 min — $40');
  });

  it('hr3 label is "3 hours — $60"', () => {
    expect(BAY_LABELS.hr3).toBe('3 hours — $60');
  });

  it('all labels are non-empty strings', () => {
    for (const [, label] of Object.entries(BAY_LABELS)) {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// LOCATION_ID (env-dependent)
// ---------------------------------------------------------------------------

describe('LOCATION_ID', () => {
  it('is a string', () => {
    expect(typeof LOCATION_ID).toBe('string');
  });

  it('is non-empty when sandbox location env var is set', () => {
    // Our mock sets SQUARE_SANDBOX_LOCATION_ID = 'SANDBOX_LOCATION_ID'
    // and SQUARE_ENVIRONMENT = 'sandbox', so LOCATION_ID should be that value.
    expect(LOCATION_ID.length).toBeGreaterThan(0);
  });

  it('resolves to sandbox location ID in sandbox mode', () => {
    expect(LOCATION_ID).toBe('SANDBOX_LOCATION_ID');
  });
});
