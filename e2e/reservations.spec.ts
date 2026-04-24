/**
 * Reservations page tests — bay-type pills, hour selector, slot loading.
 * Uses shared auth state from global-setup (no per-test registration).
 *
 * Production layout: 2 hoist + 3 flat + 1 detail = 6 bays, 1-8 hr durations.
 *
 * Tests currently run against staging, which is wired to:
 *   - Square sandbox   → 2 flat bays (not 3)
 *   - HIDE_DETAIL_BAY=true → Detail Bay suppressed until zoning clears
 * Re-add the Detail and Flat Bay 3 assertions when both conditions reverse.
 */
import { test, expect } from '@playwright/test';
import { gotoOrSkipIfCloudflare } from './helpers';

const AUTH_STATE = 'e2e/.auth/state.json';

test.describe('Unauthenticated guard', () => {
  test('/app/reservations redirects to /auth/login when not logged in', async ({ page }) => {
    await page.goto('/app/reservations');
    await expect(page).toHaveURL(/auth\/login/);
  });
});

test.describe('Reservations page (authenticated)', () => {
  test.use({ storageState: AUTH_STATE });

  test('reservations page loads with correct title', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    await expect(page).toHaveTitle(/Reservation|Booking|Wrench Club/i);
  });

  test('Flat Bay is selected by default', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    const flatBtn = page.locator('button.type-btn', { hasText: 'Flat Bay' }).first();
    await expect(flatBtn).toBeVisible({ timeout: 10_000 });
    await expect(flatBtn).toHaveClass(/selected/);
  });

  test('bay-type selector shows Flat / Hoist with rates', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    await expect(page.locator('body')).toContainText('Flat Bay');
    await expect(page.locator('body')).toContainText('Hoist Bay');
    await expect(page.locator('body')).toContainText('$25/hr');
    await expect(page.locator('body')).toContainText('$35/hr');
    // Detail Bay intentionally hidden on staging per PUBLIC_HIDE_DETAIL_BAY.
    await expect(page.locator('body')).not.toContainText('Detail Bay');
  });

  test('bay grid renders Any + the configured flat bays', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    // Sandbox staging has 2 flat bays (prod has 3).
    await expect(page.locator('button.bay-btn', { hasText: 'Any Flat Bay' })).toBeVisible();
    await expect(page.locator('button.bay-btn', { hasText: 'Flat Bay 1' })).toBeVisible();
    await expect(page.locator('button.bay-btn', { hasText: 'Flat Bay 2' })).toBeVisible();
  });

  test('switching to Hoist shows the 2 hoist bays', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    await page.locator('button.type-btn', { hasText: 'Hoist Bay' }).first().click();
    await expect(page.locator('button.bay-btn', { hasText: 'Any Hoist Bay' })).toBeVisible();
    await expect(page.locator('button.bay-btn', { hasText: 'Hoist Bay 1' })).toBeVisible();
    await expect(page.locator('button.bay-btn', { hasText: 'Hoist Bay 2' })).toBeVisible();
  });

  test('duration selector shows 1-8 hour options', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    for (const h of [1, 2, 4, 8]) {
      const label = h === 1 ? '1 hr' : `${h} hrs`;
      await expect(page.locator('button.hour-btn', { hasText: label })).toBeVisible();
    }
  });

  test('date input is visible and defaults to today', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible({ timeout: 5000 });

    const today = new Date().toISOString().slice(0, 10);
    const value = await dateInput.inputValue();
    expect(value).toBe(today);
  });

  test('availability area renders (loading | empty | slots | error)', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    const body = page.locator('body');
    await expect(body).toContainText(
      /Loading availability|No availability|Available Times|Flat Bay \d|Hoist Bay \d|Detail Bay \d|temporarily unavailable/i,
      { timeout: 15_000 }
    );
  });

  test('upcoming bookings or "Book a Bay" header is rendered', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    await expect(page.locator('body')).toContainText(/Book a Bay|Your Bookings/i);
  });
});
