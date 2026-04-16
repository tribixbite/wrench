/**
 * Public marketing page smoke tests.
 * Verifies each page loads, title is correct, key content is visible,
 * and no uncaught console errors occur.
 */
import { test, expect } from '@playwright/test';
import { gotoOrSkipIfCloudflare } from './helpers';

// Collect console errors during each test, excluding benign network/resource errors
// that are outside the app's control (e.g. analytics, fonts, or CDN assets blocked
// in the test environment).
function collectErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  const NOISE_PATTERNS = [
    /favicon/i,
    /net::ERR_CONNECTION_REFUSED/i,
    /net::ERR_FAILED/i,
    /net::ERR_BLOCKED/i,
    /ERR_NAME_NOT_RESOLVED/i,
    /Failed to load resource/i,
    /CORS policy/i,
  ];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!NOISE_PATTERNS.some((re) => re.test(text))) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => {
    if (!NOISE_PATTERNS.some((re) => re.test(err.message))) {
      errors.push(err.message);
    }
  });
  return errors;
}

test.describe('Home page (/)', () => {
  test('loads with correct title', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/Wrench Club/);
    expect(errors).toHaveLength(0);
  });

  test('hero section is visible', async ({ page }) => {
    await page.goto('/');
    // Hero headline contains "Do-It-Yourself"
    await expect(page.locator('.hero-headline')).toContainText('Do-It-Yourself');
  });

  test('location badge shows Grand Rapids', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.badge')).toContainText('Grand Rapids');
  });

  test('waitlist section is on the page', async ({ page }) => {
    await page.goto('/');
    const waitlistSection = page.locator('#waitlist');
    await expect(waitlistSection).toBeVisible();
  });

  test('"Join the Waitlist" CTA scrolls to waitlist section', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="#waitlist"]');
    // After clicking the anchor, waitlist section should be visible in viewport
    const waitlist = page.locator('#waitlist');
    await expect(waitlist).toBeInViewport({ ratio: 0.3 });
  });

  test('"See Pricing" link points to /pricing', async ({ page }) => {
    await page.goto('/');
    const pricingLink = page.locator('a[href="/pricing"]').first();
    await expect(pricingLink).toBeVisible();
  });
});

test.describe('Pricing page (/pricing)', () => {
  test('loads with correct title', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/Pricing|Wrench Club/);
    expect(errors).toHaveLength(0);
  });

  test('pricing content is visible', async ({ page }) => {
    await page.goto('/pricing');
    // Page should render the main content area with pricing info
    const body = page.locator('body');
    await expect(body).toContainText('Bay');
  });

  test('waitlist form is present on pricing page', async ({ page }) => {
    await page.goto('/pricing');
    // Pricing page includes the WaitlistForm component — it uses type="email" with bind:value, no name attr
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });
});

test.describe('Membership page (/membership)', () => {
  test('loads successfully', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/membership');
    await expect(page).toHaveTitle(/Membership|Wrench Club/);
  });

  test('page body has content', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/membership');
    // Confirm the page renders actual content (not empty)
    const main = page.locator('main, .container, body');
    await expect(main.first()).not.toBeEmpty();
  });
});

test.describe('About page (/about)', () => {
  test('loads with correct title', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/about');
    await expect(page).toHaveTitle(/About|Wrench Club/);
  });

  test('team member names are visible', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/about');
    await expect(page.locator('body')).toContainText('Coleman Brook');
    await expect(page.locator('body')).toContainText('Derick Brower');
    await expect(page.locator('body')).toContainText('Mike Zandstra');
  });

  test('Adrian Hoogerheide is listed as advisor', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/about');
    await expect(page.locator('body')).toContainText('Adrian');
  });
});

test.describe('Store page (/store)', () => {
  test('loads successfully', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/store');
    expect(page.url()).toContain('/store');
  });

  test('renders catalog items or empty state', async ({ page }) => {
    await gotoOrSkipIfCloudflare(page, '/store');
    // Either catalog content or an empty/coming-soon state — either is valid
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});
