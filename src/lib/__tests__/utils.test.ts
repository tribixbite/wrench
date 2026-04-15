import { describe, it, expect } from 'vitest';
import { formatDate, formatDuration } from '../utils';

describe('formatDate', () => {
  it('formats a UTC midnight ISO string', () => {
    // 2026-04-15T00:00:00Z → Apr 15, 2026 at 12:00 AM
    const result = formatDate('2026-04-15T00:00:00Z');
    expect(result).toBe('Apr 15, 2026 at 12:00 AM');
  });

  it('formats a morning time slot', () => {
    // 2026-06-15T09:00:00Z → Jun 15, 2026 at 9:00 AM
    const result = formatDate('2026-06-15T09:00:00Z');
    expect(result).toBe('Jun 15, 2026 at 9:00 AM');
  });

  it('formats an afternoon time slot', () => {
    const result = formatDate('2026-06-15T14:30:00Z');
    expect(result).toBe('Jun 15, 2026 at 2:30 PM');
  });

  it('formats noon correctly', () => {
    const result = formatDate('2026-01-01T12:00:00Z');
    expect(result).toBe('Jan 1, 2026 at 12:00 PM');
  });

  it('contains "at" separator between date and time', () => {
    const result = formatDate('2026-04-15T09:00:00Z');
    expect(result).toContain(' at ');
  });

  it('produces a string (non-empty)', () => {
    const result = formatDate('2026-12-25T18:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDuration', () => {
  it('formats 90 minutes as "90 min"', () => {
    expect(formatDuration(90)).toBe('90 min');
  });

  it('formats 180 minutes as "3 hrs"', () => {
    expect(formatDuration(180)).toBe('3 hrs');
  });

  it('formats 60 minutes as "1 hr" (singular)', () => {
    expect(formatDuration(60)).toBe('1 hr');
  });

  it('formats 120 minutes as "2 hrs"', () => {
    expect(formatDuration(120)).toBe('2 hrs');
  });

  it('formats 30 minutes as "30 min"', () => {
    expect(formatDuration(30)).toBe('30 min');
  });

  it('formats 45 minutes as "45 min" (non-round hour)', () => {
    expect(formatDuration(45)).toBe('45 min');
  });

  it('formats 75 minutes as "75 min" (not evenly divisible by 60)', () => {
    // 75 / 60 = 1.25 — not an even hour, so stays in minutes
    expect(formatDuration(75)).toBe('75 min');
  });
});
