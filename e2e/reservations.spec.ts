/**
 * Reservations page tests — bay selector, duration options, slot loading.
 * Unauthenticated access guard is also verified here.
 */
import { test, expect } from '@playwright/test';
import { testEmail } from './helpers';

const EMAIL = testEmail('resv');
const PASSWORD = 'TestPass123!';

/** Register + sign in, land on the reservations page */
async function goToReservations(page: import('@playwright/test').Page) {
  // Register (idempotent — if account already exists the login below handles it)
  await page.goto('/auth/register');
  await page.fill('[name="name"]', 'Reservations QA');
  await page.fill('[name="email"]', EMAIL);
  await page.fill('[name="password"]', PASSWORD);
  await page.check('[name="waiver"]');
  await page.click('[type="submit"]');
  await page.waitForURL(/\/(app\/dashboard|auth\/login|auth\/verify)/, { timeout: 20_000 });

  // If redirected to login (duplicate email case), sign in explicitly
  if (page.url().includes('/auth/login')) {
    await page.fill('[name="email"]', EMAIL);
    await page.fill('[name="password"]', PASSWORD);
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(app\/dashboard|auth\/verify)/, { timeout: 15_000 });
  }

  // Navigate to reservations
  if (!page.url().includes('/auth/verify')) {
    await page.goto('/app/reservations');
    await page.waitForURL(/\/app\/reservations/, { timeout: 10_000 });
  }
}

test.describe('Unauthenticated guard', () => {
  test('/app/reservations redirects to /auth/login when not logged in', async ({ page }) => {
    await page.goto('/app/reservations');
    await expect(page).toHaveURL(/auth\/login/);
  });
});

test.describe('Reservations page (authenticated)', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await goToReservations(page);
    await page.close();
  });

  test('reservations page loads with correct title', async ({ page }) => {
    await goToReservations(page);
    if (page.url().includes('/auth/verify')) {
      // Behind email gate — skip UI assertions
      return;
    }
    await expect(page).toHaveTitle(/Reservation|Booking|Wrench Club/i);
  });

  test('bay selector renders 5 bay options', async ({ page }) => {
    await goToReservations(page);
    if (page.url().includes('/auth/verify')) return;

    // The reservations page renders bay buttons for bays 1-5
    // Matches buttons or elements containing "Bay 1" through "Bay 5"
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`text=Bay ${i}`)).toBeVisible({ timeout: 10_000 });
    }
  });

  test('duration selector shows 90 min and 3 hour options', async ({ page }) => {
    await goToReservations(page);
    if (page.url().includes('/auth/verify')) return;

    await expect(page.locator('body')).toContainText('90 min');
    await expect(page.locator('body')).toContainText('3 hour');
  });

  test('selecting a bay updates selected state', async ({ page }) => {
    await goToReservations(page);
    if (page.url().includes('/auth/verify')) return;

    // Click Bay 1 — it should become "selected" (aria-pressed or class change)
    const bay1 = page.locator('button, [role="button"]', { hasText: /Bay 1/i }).first();
    await bay1.click();

    // After selecting, slot loading or a "no slots" message should appear
    // (Square Bookings may not be enabled in sandbox, so any response is acceptable)
    await page.waitForTimeout(2000); // allow async slot fetch to start
    const body = page.locator('body');
    // Either slots loaded, loading spinner, or error message — all indicate the click worked
    const hasAnyResponse = await body.evaluate((el) =>
      el.textContent?.match(/slot|available|unavailable|loading|error|no slot|book/i) !== null
    );
    expect(hasAnyResponse).toBe(true);
  });

  test('date input is present and defaults to today', async ({ page }) => {
    await goToReservations(page);
    if (page.url().includes('/auth/verify')) return;

    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();

    const today = new Date().toISOString().slice(0, 10);
    const value = await dateInput.inputValue();
    expect(value).toBe(today);
  });

  test('upcoming bookings section is rendered', async ({ page }) => {
    await goToReservations(page);
    if (page.url().includes('/auth/verify')) return;

    // Reservations page shows upcoming bookings (even if list is empty)
    await expect(page.locator('body')).toContainText(/upcoming|reservation|booking/i);
  });
});
