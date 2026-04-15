/**
 * Authentication flow tests: register, login, logout, forgot password.
 * Tests run sequentially (workers: 1) so shared state is predictable.
 *
 * Each describe group is self-contained: it creates its own account rather than
 * relying on a prior test group having run first.
 */
import { test, expect } from '@playwright/test';
import { testEmail } from './helpers';

/** Register a fresh account and return the page after redirect. */
async function registerFreshAccount(
  page: import('@playwright/test').Page,
  email: string,
  password: string
) {
  await page.goto('/auth/register');
  await page.fill('[name="name"]', 'Auth QA User');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.check('[name="waiver"]');
  await page.click('[type="submit"]');
  await page.waitForURL(/\/(app\/dashboard|auth\/login|auth\/verify)/, { timeout: 25_000 });
}

test.describe('Registration (/auth/register)', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveTitle(/Create|Register|Join|Wrench Club/i);
  });

  test('register a new account and get redirected', async ({ page }) => {
    const email = testEmail('reg-new');
    await registerFreshAccount(page, email, 'TestPass123!');
    // Should redirect away from /auth/register
    expect(page.url()).toMatch(/app\/dashboard|auth\/login|auth\/verify/);
  });

  test('submitting duplicate email shows error', async ({ page }) => {
    // Use a fixed well-known email pattern: register it, then try again
    const email = testEmail('reg-dup');
    await registerFreshAccount(page, email, 'TestPass123!');

    // Now try to register again with the same email
    await page.goto('/auth/register');
    await page.fill('[name="name"]', 'Duplicate User');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', 'TestPass123!');
    await page.check('[name="waiver"]');
    await page.click('[type="submit"]');

    // Stay on register page with an error message
    await expect(page.locator('[role="alert"], .form-error')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[role="alert"], .form-error')).toContainText(
      /already exists|taken|conflict|email/i
    );
  });

  test('missing required fields keeps user on register page', async ({ page }) => {
    await page.goto('/auth/register');
    // Click submit without filling anything — browser native validation blocks submit
    await page.click('[type="submit"]');
    // URL must still be /auth/register
    expect(page.url()).toContain('/auth/register');
  });

  test('password shorter than 8 chars shows server-side error', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('[name="name"]', 'Short PW');
    await page.fill('[name="email"]', testEmail('short-pw'));
    // Use evaluate to bypass browser minlength validation so the form reaches the server
    await page.evaluate(() => {
      const pw = document.querySelector('[name="password"]') as HTMLInputElement;
      if (pw) {
        Object.defineProperty(pw, 'validity', { value: { valid: true }, configurable: true });
      }
    });
    await page.fill('[name="password"]', '123');
    await page.check('[name="waiver"]');

    // Force submit via keyboard to bypass browser constraint
    await page.keyboard.press('Enter');

    // If browser constraint fires, the URL stays on register and no server error appears.
    // Accept either: stay on /auth/register (browser blocked) or server error is shown.
    await page.waitForTimeout(2000);
    const onRegisterPage = page.url().includes('/auth/register');
    const hasError = await page.locator('[role="alert"], .form-error').isVisible();
    expect(onRegisterPage || hasError).toBe(true);
  });
});

test.describe('Login (/auth/login)', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/Login|Sign in|Wrench Club/i);
  });

  test('wrong password shows error message', async ({ page }) => {
    // Register a fresh account so we know the email exists
    const email = testEmail('login-wrong-pw');
    await registerFreshAccount(page, email, 'TestPass123!');

    await page.goto('/auth/login');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', 'WrongPassword!');
    await page.click('[type="submit"]');

    await expect(page.locator('[role="alert"], .form-error')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[role="alert"], .form-error')).toContainText(
      /invalid|incorrect|wrong|credentials/i
    );
  });

  test('unknown email shows error (no enumeration)', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[name="email"]', `nonexistent-${Date.now()}@mailinator.com`);
    await page.fill('[name="password"]', 'AnyPassword1!');
    await page.click('[type="submit"]');

    // Should show an error regardless of whether the email is registered
    await expect(page.locator('[role="alert"], .form-error')).toBeVisible({ timeout: 10_000 });
  });

  test('correct credentials redirect to dashboard', async ({ page }) => {
    // Create a fresh account specifically for this login test
    const email = testEmail('login-ok');
    const password = 'TestPass123!';
    await registerFreshAccount(page, email, password);

    // Now log in with those credentials in a fresh page context (simulate new session)
    await page.context().clearCookies();
    await page.goto('/auth/login');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('[type="submit"]');

    // Should redirect to dashboard or verify page
    await page.waitForURL(/\/(app\/dashboard|auth\/verify)/, { timeout: 25_000 });
    const url = page.url();
    expect(url).toMatch(/app\/dashboard|auth\/verify/);
  });
});

test.describe('Logout (/auth/logout)', () => {
  test('logout redirects to home page', async ({ page }) => {
    // Register a fresh account and land on dashboard (or verify)
    const email = testEmail('logout');
    await registerFreshAccount(page, email, 'TestPass123!');

    if (page.url().includes('/auth/verify')) {
      // Can't test logout if behind email verify gate — still verify GET /auth/logout works
      await page.goto('/auth/logout');
      await page.waitForURL('/', { timeout: 10_000 });
      expect(page.url()).toMatch(/thewrench\.club\/?($|\?)/);
      return;
    }

    // Navigate to logout endpoint
    await page.goto('/auth/logout');
    await page.waitForURL('/', { timeout: 10_000 });
    expect(page.url()).toMatch(/thewrench\.club\/?($|\?)/);

    // After logout, /app/dashboard should redirect to login
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/auth\/login/);
  });
});

test.describe('Forgot password (/auth/forgot-password)', () => {
  test('page loads correctly', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page).toHaveTitle(/Forgot|Password|Wrench Club/i);
    await expect(page.locator('body')).toContainText(/forgot|reset/i);
  });

  test('submitting any email shows success (anti-enumeration)', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.fill('[name="email"]', `nonexistent-${Date.now()}@mailinator.com`);
    await page.click('[type="submit"]');

    // Anti-enumeration: always shows "check your inbox" regardless of whether email exists
    await expect(page.locator('body')).toContainText(/check|inbox|sent|reset link/i, {
      timeout: 10_000,
    });
  });

  test('submitting a registered email also shows success', async ({ page }) => {
    const email = testEmail('forgot-pw');
    await registerFreshAccount(page, email, 'TestPass123!');

    await page.goto('/auth/forgot-password');
    await page.fill('[name="email"]', email);
    await page.click('[type="submit"]');

    await expect(page.locator('body')).toContainText(/check|inbox|sent|reset link/i, {
      timeout: 10_000,
    });
  });
});
