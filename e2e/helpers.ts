import type { Page, APIRequestContext } from '@playwright/test';

/**
 * Returns a unique test email address to avoid conflicts across test runs.
 * Uses mailinator.com which is publicly readable — no inbox setup required.
 */
export function testEmail(prefix = 'qa'): string {
  return `${prefix}-${Date.now()}@mailinator.com`;
}

/**
 * Register a new test user via the /auth/register form.
 * Returns the credentials used so the caller can log in again later.
 */
export async function registerUser(
  page: Page,
  email: string,
  password = 'TestPass123!'
): Promise<{ email: string; password: string }> {
  await page.goto('/auth/register');
  await page.fill('[name="name"]', 'QA Test User');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('[type="submit"]');
  // Registration redirects to dashboard on success; login on pre-launch notice path
  await page.waitForURL(/\/(app\/dashboard|auth\/login)/, { timeout: 15_000 });
  return { email, password };
}

/**
 * Log in an existing user via the /auth/login form.
 * Waits for the redirect to /app/dashboard.
 */
export async function loginUser(
  page: Page,
  email: string,
  password = 'TestPass123!'
): Promise<void> {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('[type="submit"]');
  await page.waitForURL('/app/dashboard', { timeout: 15_000 });
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
