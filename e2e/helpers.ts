import type { Page, APIRequestContext } from '@playwright/test';
import { test } from '@playwright/test';
import { readFileSync } from 'fs';

/**
 * Returns a unique test email address to avoid conflicts across test runs.
 * Uses mailinator.com which is publicly readable — no inbox setup required.
 */
export function testEmail(prefix = 'qa'): string {
  return `${prefix}-${Date.now()}@mailinator.com`;
}

/**
 * Poll the page URL until it matches one of the expected patterns.
 * SvelteKit's use:enhance does client-side navigation that Playwright's
 * waitForURL doesn't consistently detect.
 */
async function pollForURL(page: Page, pattern: RegExp, timeoutMs = 60_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pattern.test(page.url())) return true;
    await page.waitForTimeout(300);
  }
  return false;
}

/**
 * Register a new test user via the /auth/register form.
 * Uses URL polling instead of waitForURL for SvelteKit compatibility.
 * Returns true if registration succeeded, false if timed out.
 */
export async function registerUser(
  page: Page,
  email: string,
  password = 'TestPass123!'
): Promise<boolean> {
  await page.goto('/auth/register');
  await page.fill('[name="name"]', 'QA Test User');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.check('[name="waiver"]');
  await page.click('[type="submit"]');

  // Poll — SvelteKit enhance does client-side navigation
  return pollForURL(page, /\/(app\/dashboard|auth\/verify|auth\/login)/, 60_000);
}

/**
 * Log in an existing user via the /auth/login form.
 * Returns true if login redirected to dashboard/verify.
 */
export async function loginUser(
  page: Page,
  email: string,
  password = 'TestPass123!'
): Promise<boolean> {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('[type="submit"]');

  return pollForURL(page, /\/(app\/dashboard|auth\/verify)/, 30_000);
}

/**
 * Load the shared test account credentials saved by global-setup.
 * Returns null if the file doesn't exist (global setup failed).
 */
export function loadSharedCredentials(): { email: string; password: string } | null {
  try {
    const data = readFileSync('e2e/.auth/credentials.json', 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Navigate to a URL and skip the test if Cloudflare intercepts the request.
 * Cloudflare bot protection intermittently blocks CI runner IPs with 502/403.
 */
export async function gotoOrSkipIfCloudflare(page: Page, path: string) {
  const resp = await page.goto(path);
  const status = resp?.status() ?? 200;
  // Cloudflare can return 403, 502, 503, or 520-530 range error codes
  if (status === 403 || status === 502 || status === 503 || (status >= 520 && status <= 530)) {
    const body = await page.locator('body').textContent();
    if (body?.toLowerCase().includes('cloudflare')) {
      test.skip(true, `Cloudflare blocked ${path} (HTTP ${status})`);
    }
  }
}

/**
 * Skip the test if an API response looks like a Cloudflare block.
 * Use for request-level (non-page) API calls in CI where Cloudflare
 * intermittently returns 502/403/503 instead of the actual response.
 */
export function skipIfCloudflareResponse(status: number, body: string, label: string) {
  if (status === 403 || status === 502 || status === 503 || (status >= 520 && status <= 530)) {
    if (body.toLowerCase().includes('cloudflare') || body.toLowerCase().includes('error code')) {
      test.skip(true, `Cloudflare blocked ${label} (HTTP ${status})`);
    }
  }
}

/**
 * Call the waitlist API directly (no browser) and return the parsed response.
 */
export async function postWaitlist(
  request: APIRequestContext,
  payload: { email: string; name?: string }
) {
  const baseURL = process.env.TEST_BASE_URL ?? 'https://thewrench.club';
  return request.post(`${baseURL}/api/waitlist`, {
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });
}
