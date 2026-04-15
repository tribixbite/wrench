import type { Page, APIRequestContext } from '@playwright/test';
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
