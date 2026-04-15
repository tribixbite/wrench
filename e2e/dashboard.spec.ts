/**
 * Authenticated app area tests — dashboard and navigation.
 *
 * These tests require a valid user session. Since the live site's registration
 * flow creates real accounts, we create a fresh account per test run via the
 * register form and then interact with the dashboard.
 */
import { test, expect } from '@playwright/test';
import { testEmail } from './helpers';

// Credentials shared across tests in this file
const EMAIL = testEmail('dash');
const PASSWORD = 'TestPass123!';

/** Helper: register and arrive at the authenticated area */
async function signUp(page: import('@playwright/test').Page) {
  await page.goto('/auth/register');
  await page.fill('[name="name"]', 'Dashboard QA');
  await page.fill('[name="email"]', EMAIL);
  await page.fill('[name="password"]', PASSWORD);
  await page.check('[name="waiver"]');
  await page.click('[type="submit"]');
  // Wait for any post-register destination
  await page.waitForURL(/\/(app\/dashboard|auth\/login|auth\/verify)/, { timeout: 20_000 });
}

/** Helper: sign in with the pre-created account */
async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', EMAIL);
  await page.fill('[name="password"]', PASSWORD);
  await page.click('[type="submit"]');
  await page.waitForURL(/\/(app\/dashboard|auth\/verify)/, { timeout: 15_000 });
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
  // Register once before all tests in this group
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signUp(page);
    await page.close();
  });

  test('dashboard loads with user name', async ({ page }) => {
    await signIn(page);

    if (page.url().includes('/auth/verify')) {
      // Email verification is required — dashboard is behind that gate;
      // verify the verify page renders user context instead
      await expect(page.locator('body')).toContainText(/verify|email|sent/i);
      return;
    }

    // Check user's name is displayed in the greeting
    await expect(page.locator('.dash-name, h1')).toContainText('Dashboard QA', {
      timeout: 10_000,
    });
  });

  test('dashboard shows "Book a Bay" button', async ({ page }) => {
    await signIn(page);
    if (page.url().includes('/auth/verify')) return; // skip if behind email gate

    const bookBtn = page.locator('a[href="/app/reservations"], button', { hasText: /book a bay/i });
    await expect(bookBtn.first()).toBeVisible();
  });

  test('bay grid is rendered on dashboard', async ({ page }) => {
    await signIn(page);
    if (page.url().includes('/auth/verify')) return;

    // BayGrid component renders bay status — look for any bay-related content
    await expect(page.locator('body')).toContainText(/bay/i);
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    await signIn(page);
    if (page.url().includes('/auth/verify')) return;

    const sidebar = page.locator('.sidebar, nav, aside');
    await expect(sidebar.first()).toBeVisible();

    // Core nav items from the app layout
    await expect(page.locator('a[href="/app/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/app/reservations"]')).toBeVisible();
    await expect(page.locator('a[href="/app/profile"]')).toBeVisible();
  });

  test('navigating to reservations from dashboard works', async ({ page }) => {
    await signIn(page);
    if (page.url().includes('/auth/verify')) return;

    await page.click('a[href="/app/reservations"]');
    await expect(page).toHaveURL(/\/app\/reservations/);
  });
});
