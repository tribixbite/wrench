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
  BAYS,
  BAY_TEAM_MEMBERS,
  BAY_VARIATIONS,
  BAY_HOURLY_RATE,
  BAY_TYPE_LABEL,
  LOCATION_ID
} from '../square';

// ---------------------------------------------------------------------------
// BAYS — production layout: 2 hoist + 3 flat + 1 detail
// ---------------------------------------------------------------------------

describe('BAYS', () => {
  it('has 6 entries with ids 1-6', () => {
    expect(BAYS).toHaveLength(6);
    expect(BAYS.map(b => b.id).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('has 2 hoist, 3 flat, 1 detail', () => {
    const counts = BAYS.reduce<Record<string, number>>((acc, b) => {
      acc[b.type] = (acc[b.type] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ hoist: 2, flat: 3, detail: 1 });
  });

  it('every team member ID is unique and prefixed with "TM"', () => {
    const ids = BAYS.map(b => b.teamMemberId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^TM/);
  });
});

describe('BAY_TEAM_MEMBERS', () => {
  it('mirrors BAYS by id', () => {
    expect(Object.keys(BAY_TEAM_MEMBERS)).toHaveLength(6);
    for (const bay of BAYS) {
      expect(BAY_TEAM_MEMBERS[bay.id]).toBe(bay.teamMemberId);
    }
  });
});

// ---------------------------------------------------------------------------
// BAY_VARIATIONS — 1-8 hours per bay type, all FIXED_PRICING service variations
// ---------------------------------------------------------------------------

describe('BAY_VARIATIONS', () => {
  it('has all three bay types', () => {
    expect(Object.keys(BAY_VARIATIONS).sort()).toEqual(['detail', 'flat', 'hoist']);
  });

  it('each type has 8 hourly variations (1-8)', () => {
    for (const type of ['flat', 'detail', 'hoist'] as const) {
      const hours = Object.keys(BAY_VARIATIONS[type]).map(Number).sort((a, b) => a - b);
      expect(hours).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    }
  });

  it('all variation IDs are non-empty strings, distinct across types', () => {
    const seen = new Set<string>();
    for (const type of ['flat', 'detail', 'hoist'] as const) {
      for (let h = 1; h <= 8; h++) {
        const id = BAY_VARIATIONS[type][h];
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// BAY_HOURLY_RATE — pricing tiers (Hoist > Detail > Flat)
// ---------------------------------------------------------------------------

describe('BAY_HOURLY_RATE', () => {
  it('uses the published $25 / $30 / $35 hourly tiers', () => {
    expect(BAY_HOURLY_RATE.flat).toBe(25);
    expect(BAY_HOURLY_RATE.detail).toBe(30);
    expect(BAY_HOURLY_RATE.hoist).toBe(35);
  });

  it('hoist is the priciest, flat the cheapest', () => {
    expect(BAY_HOURLY_RATE.hoist).toBeGreaterThan(BAY_HOURLY_RATE.detail);
    expect(BAY_HOURLY_RATE.detail).toBeGreaterThan(BAY_HOURLY_RATE.flat);
  });
});

describe('BAY_TYPE_LABEL', () => {
  it('has a human label for every bay type', () => {
    expect(BAY_TYPE_LABEL.flat).toBe('Flat Bay');
    expect(BAY_TYPE_LABEL.detail).toBe('Detail Bay');
    expect(BAY_TYPE_LABEL.hoist).toBe('Hoist Bay');
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
