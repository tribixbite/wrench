/**
 * Authenticated app area tests — dashboard and navigation.
 * Uses shared auth state from global-setup (no per-test registration).
 */
import { test, expect } from '@playwright/test';
import { gotoOrSkipIfCloudflare } from './helpers';

const AUTH_STATE = 'e2e/.auth/state.json';

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
  test.use({ storageState: AUTH_STATE });

  test('dashboard loads with user name', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/dashboard');
    await expect(page.locator('.dash-name, h1')).toContainText(/E2E|Dashboard|Shared/i, {
      timeout: 10_000,
    });
  });

  test('dashboard shows "Book a Bay" button', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/dashboard');
    const bookBtn = page.locator('a[href="/app/reservations"], button', { hasText: /book a bay/i });
    await expect(bookBtn.first()).toBeVisible();
  });

  test('bay grid is rendered on dashboard', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/dashboard');
    await expect(page.locator('body')).toContainText(/bay/i);
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/dashboard');
    await expect(page.locator('a[href="/app/dashboard"]').first()).toBeVisible();
    await expect(page.locator('a[href="/app/reservations"]').first()).toBeVisible();
    await expect(page.locator('a[href="/app/profile"]').first()).toBeVisible();
  });

  test('navigating to reservations from dashboard works', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/app/dashboard');
    await page.click('a[href="/app/reservations"]');
    await expect(page).toHaveURL(/\/app\/reservations/);
  });
});
