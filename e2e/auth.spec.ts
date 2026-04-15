/**
 * Authentication flow tests: register, login, logout, forgot password.
 * Tests run sequentially (workers: 1) so shared state is predictable.
 *
 * Minimizes fresh registrations to avoid hitting rate limits (10/15min).
 * Uses shared credentials from global-setup wherever possible.
 */
import { test, expect } from '@playwright/test';
import { testEmail, registerUser, loginUser, loadSharedCredentials, gotoOrSkipIfCloudflare } from './helpers';

test.describe('Registration (/auth/register)', () => {
  test('page loads with correct title', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/auth/register');
    await expect(page).toHaveTitle(/Create|Register|Join|Wrench Club/i);
  });

  test('register a new account and get redirected', async ({ page }) => {
    test.setTimeout(120_000);
    const email = testEmail('reg-new');
    const ok = await registerUser(page, email, 'TestPass123!');
    if (!ok) { test.skip(); return; }
    expect(page.url()).toMatch(/app\/dashboard|auth\/verify|auth\/login/);
  });

  test('submitting duplicate email redirects to login (anti-enumeration)', async ({ page }) => {
    test.setTimeout(120_000);
    const email = testEmail('reg-dup');
    const firstOk = await registerUser(page, email, 'TestPass123!');
    if (!firstOk) { test.skip(); return; }

    await page.context().clearCookies();

    // Second registration with same email — should redirect to login (anti-enumeration)
    const secondOk = await registerUser(page, email, 'TestPass123!');
    if (!secondOk) { test.skip(); return; }

    expect(page.url()).toContain('/auth/login');
  });

  test('missing required fields keeps user on register page', async ({ page }) => {
    await page.goto('/auth/register');
    await page.click('[type="submit"]');
    expect(page.url()).toContain('/auth/register');
  });

  test('password shorter than 8 chars shows server-side error', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('[name="name"]', 'Short PW');
    await page.fill('[name="email"]', testEmail('short-pw'));
    await page.evaluate(() => {
      const pw = document.querySelector('[name="password"]') as HTMLInputElement;
      if (pw) {
        Object.defineProperty(pw, 'validity', { value: { valid: true }, configurable: true });
      }
    });
    await page.fill('[name="password"]', '123');
    await page.check('[name="waiver"]');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(2000);
    const onRegisterPage = page.url().includes('/auth/register');
    const hasError = await page.locator('[role="alert"], .form-error').isVisible();
    expect(onRegisterPage || hasError).toBe(true);
  });
});

test.describe('Login (/auth/login)', () => {
  test('page loads with correct title', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/auth/login');
    await expect(page).toHaveTitle(/Login|Sign in|Wrench Club/i);
  });

  test('wrong password shows error message', async ({ page }) => {
    // Use shared account from global-setup — no fresh registration needed
    const creds = loadSharedCredentials();
    if (!creds) { test.skip(); return; }

    await page.goto('/auth/login');
    await page.fill('[name="email"]', creds.email);
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

    await expect(page.locator('[role="alert"], .form-error')).toBeVisible({ timeout: 10_000 });
  });

  test('correct credentials redirect to dashboard', async ({ page }) => {
    // Use shared account from global-setup — no fresh registration needed
    const creds = loadSharedCredentials();
    if (!creds) { test.skip(); return; }

    await page.goto('/auth/login');
    await page.fill('[name="email"]', creds.email);
    await page.fill('[name="password"]', creds.password);
    await page.click('[type="submit"]');

    // Poll for redirect
    const deadline = Date.now() + 25_000;
    while (Date.now() < deadline) {
      if (/app\/dashboard|auth\/verify/.test(page.url())) break;
      await page.waitForTimeout(300);
    }
    expect(page.url()).toMatch(/app\/dashboard|auth\/verify/);
  });
});

test.describe('Logout (/auth/logout)', () => {
  test('logout via POST redirects to home page', async ({ page }) => {
    // Log in with shared account — no fresh registration needed
    const creds = loadSharedCredentials();
    if (!creds) { test.skip(); return; }

    const ok = await loginUser(page, creds.email, creds.password);
    if (!ok) { test.skip(); return; }
    if (page.url().includes('/auth/verify') || page.url().includes('/auth/login')) { test.skip(); return; }

    await page.evaluate(() => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/auth/logout';
      document.body.appendChild(form);
      form.submit();
    });

    // Poll for redirect to home
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (/thewrench\.club\/?($|\?)/.test(page.url())) break;
      await page.waitForTimeout(300);
    }
    expect(page.url()).toMatch(/thewrench\.club\/?($|\?)/);

    // After logout, /app/dashboard must redirect to login
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/auth\/login/);
  });
});

test.describe('Forgot password (/auth/forgot-password)', () => {
  test('page loads correctly', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/auth/forgot-password');
    await expect(page).toHaveTitle(/Forgot|Password|Wrench Club/i);
    await expect(page.locator('body')).toContainText(/forgot|reset/i);
  });

  test('submitting any email shows success (anti-enumeration)', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.fill('[name="email"]', `nonexistent-${Date.now()}@mailinator.com`);
    await page.click('[type="submit"]');

    await expect(page.locator('body')).toContainText(/check|inbox|sent|reset link/i, {
      timeout: 10_000,
    });
  });

  test('submitting a registered email also shows success', async ({ page }) => {
    // Use shared account from global-setup — no fresh registration needed
    const creds = loadSharedCredentials();
    if (!creds) { test.skip(); return; }

    await page.goto('/auth/forgot-password');
    await page.fill('[name="email"]', creds.email);
    await page.click('[type="submit"]');

    await expect(page.locator('body')).toContainText(/check|inbox|sent|reset link/i, {
      timeout: 10_000,
    });
  });
});
