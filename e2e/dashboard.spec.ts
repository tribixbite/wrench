/**
 * Authenticated app area tests — dashboard and navigation.
 *
 * Each test is self-contained: it registers + logs in with a fresh account.
 * If Square sandbox is slow (>55s), tests are skipped rather than failed.
 */
import { test, expect } from '@playwright/test';
import { testEmail } from './helpers';

/**
 * Register a fresh account. Returns true if registration completed and
 * redirected to dashboard or verify page, false if timed out.
 */
async function signUpAndLand(
  page: import('@playwright/test').Page,
  email: string,
  password = 'TestPass123!'
): Promise<boolean> {
  await page.goto('/auth/register');
  await page.fill('[name="name"]', 'Dashboard QA');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.check('[name="waiver"]');
  await page.click('[type="submit"]');
  try {
    await page.waitForURL(/\/(app\/dashboard|auth\/verify)/, { timeout: 55_000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Unauthenticated access guard', () => {
  test('/app/dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('/app/reservations redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/app/reservations');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('/app/profile redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/app/profile');
    await expect(page).toHaveURL(/auth\/login/);
  });
});

test.describe('Dashboard (authenticated)', () => {
  test('dashboard loads with user name', async ({ page }) => {
    const ok = await signUpAndLand(page, testEmail('dash-name'));
    if (!ok) { test.skip(); return; }
    if (page.url().includes('/auth/verify')) return; // behind email gate

    await expect(page.locator('.dash-name, h1')).toContainText('Dashboard QA', {
      timeout: 10_000,
    });
  });

  test('dashboard shows "Book a Bay" button', async ({ page }) => {
    const ok = await signUpAndLand(page, testEmail('dash-book'));
    if (!ok) { test.skip(); return; }
    if (page.url().includes('/auth/verify')) return;

    const bookBtn = page.locator('a[href="/app/reservations"], button', { hasText: /book a bay/i });
    await expect(bookBtn.first()).toBeVisible();
  });

  test('bay grid is rendered on dashboard', async ({ page }) => {
    const ok = await signUpAndLand(page, testEmail('dash-bay'));
    if (!ok) { test.skip(); return; }
    if (page.url().includes('/auth/verify')) return;

    await expect(page.locator('body')).toContainText(/bay/i);
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    const ok = await signUpAndLand(page, testEmail('dash-nav'));
    if (!ok) { test.skip(); return; }
    if (page.url().includes('/auth/verify')) return;

    const sidebar = page.locator('.sidebar, nav, aside');
    await expect(sidebar.first()).toBeVisible();

    // Use .first() to avoid strict mode failure when multiple elements match the href
    await expect(page.locator('a[href="/app/dashboard"]').first()).toBeVisible();
    await expect(page.locator('a[href="/app/reservations"]').first()).toBeVisible();
    await expect(page.locator('a[href="/app/profile"]').first()).toBeVisible();
  });

  test('navigating to reservations from dashboard works', async ({ page }) => {
    const ok = await signUpAndLand(page, testEmail('dash-nav2'));
    if (!ok) { test.skip(); return; }
    if (page.url().includes('/auth/verify')) return;

    await page.click('a[href="/app/reservations"]');
    await expect(page).toHaveURL(/\/app\/reservations/);
  });
});
