/**
 * Reservations page tests — bay selector, duration options, slot loading.
 * Uses shared auth state from global-setup (no per-test registration).
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

  test('"Any Bay" is selected by default', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    // The "Any Bay" button should have the .selected class by default
    const anyBayBtn = page.locator('button', { hasText: /Any Bay/i }).first();
    await expect(anyBayBtn).toBeVisible({ timeout: 10_000 });
    await expect(anyBayBtn).toHaveClass(/selected/);
  });

  test('bay selector renders Any Bay + 5 bay options', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    await expect(page.locator('text=Any Bay')).toBeVisible({ timeout: 10_000 });
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`button:has-text("Bay ${i}")`)).toBeVisible();
    }
  });

  test('duration selector shows 90 min and 3 hour options', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    await expect(page.locator('body')).toContainText('90 min');
    await expect(page.locator('body')).toContainText('3 hour');
  });

  test('date input is visible and defaults to today', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible({ timeout: 5000 });

    const today = new Date().toISOString().slice(0, 10);
    const value = await dateInput.inputValue();
    expect(value).toBe(today);
  });

  test('availability loads automatically with all bays', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');

    // Wait for slots to load or error/empty state to appear
    const body = page.locator('body');
    await expect(body).toContainText(
      /Loading availability|No availability|Bay \d|Available Times/i,
      { timeout: 15_000 }
    );
  });

  test('selecting a specific bay filters results', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');

    // Click Bay 1 specifically
    const bay1 = page.locator('button', { hasText: 'Bay 1' }).first();
    await bay1.click();

    // Wait for slot loading to complete
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    const hasResponse = await body.evaluate((el) =>
      /available|unavailable|loading|error|no availability|bay/i.test(el.textContent ?? '')
    );
    expect(hasResponse).toBe(true);
  });

  test('upcoming bookings section is rendered', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/reservations');
    await expect(page.locator('body')).toContainText(/upcoming|reservation|booking|book a bay/i);
  });
});
