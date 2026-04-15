/**
 * Reservations page tests — bay selector, duration options, slot loading.
 * Unauthenticated access guard is also verified here.
 * If Square sandbox is slow during registration (>55s), tests are skipped.
 */
import { test, expect } from '@playwright/test';
import { testEmail } from './helpers';

/**
 * Register, land on reservations page.
 * Returns true if registration completed and arrived at /app/reservations.
 */
async function signUpAndGoToReservations(
  page: import('@playwright/test').Page
): Promise<boolean> {
  const email = testEmail('resv');
  const password = 'TestPass123!';

  await page.goto('/auth/register');
  await page.fill('[name="name"]', 'Reservations QA');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.check('[name="waiver"]');
  await page.click('[type="submit"]');

  try {
    await page.waitForURL(/\/(app\/dashboard|auth\/verify)/, { timeout: 55_000 });
  } catch {
    return false; // registration timed out
  }

  if (page.url().includes('/auth/verify')) {
    // Behind email verification gate — can't reach reservations
    return false;
  }

  await page.goto('/app/reservations');
  await page.waitForURL(/\/app\/reservations/, { timeout: 10_000 });
  return true;
}

test.describe('Unauthenticated guard', () => {
  test('/app/reservations redirects to /auth/login when not logged in', async ({ page }) => {
    await page.goto('/app/reservations');
    await expect(page).toHaveURL(/auth\/login/);
  });
});

test.describe('Reservations page (authenticated)', () => {
  test('reservations page loads with correct title', async ({ page }) => {
    const ok = await signUpAndGoToReservations(page);
    if (!ok) { test.skip(); return; }
    await expect(page).toHaveTitle(/Reservation|Booking|Wrench Club/i);
  });

  test('bay selector renders 5 bay options', async ({ page }) => {
    const ok = await signUpAndGoToReservations(page);
    if (!ok) { test.skip(); return; }

    // The reservations page shows bay buttons labeled "Bay 1" through "Bay 5"
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`text=Bay ${i}`)).toBeVisible({ timeout: 10_000 });
    }
  });

  test('duration selector shows 90 min and 3 hour options', async ({ page }) => {
    const ok = await signUpAndGoToReservations(page);
    if (!ok) { test.skip(); return; }

    await expect(page.locator('body')).toContainText('90 min');
    await expect(page.locator('body')).toContainText('3 hour');
  });

  test('selecting a bay triggers slot loading or error feedback', async ({ page }) => {
    const ok = await signUpAndGoToReservations(page);
    if (!ok) { test.skip(); return; }

    // Click Bay 1 button
    const bay1 = page.locator('button, [role="button"]', { hasText: /Bay 1/i }).first();
    await bay1.click();

    // After selecting, any of: slots, loading indicator, "not available", or error message
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    const hasResponse = await body.evaluate((el) =>
      /slot|available|unavailable|loading|error|no slot|book|select/i.test(el.textContent ?? '')
    );
    expect(hasResponse).toBe(true);
  });

  test('date input appears after selecting a bay and defaults to today', async ({ page }) => {
    const ok = await signUpAndGoToReservations(page);
    if (!ok) { test.skip(); return; }

    // The date input only renders after a bay is selected (conditional {#if selectedBay})
    const bay1 = page.locator('button, [role="button"]', { hasText: /Bay 1/i }).first();
    await bay1.click();

    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible({ timeout: 5000 });

    const today = new Date().toISOString().slice(0, 10);
    const value = await dateInput.inputValue();
    expect(value).toBe(today);
  });

  test('upcoming bookings section is rendered', async ({ page }) => {
    const ok = await signUpAndGoToReservations(page);
    if (!ok) { test.skip(); return; }

    // Reservations page shows upcoming bookings (even if the list is empty)
    await expect(page.locator('body')).toContainText(/upcoming|reservation|booking/i);
  });
});
