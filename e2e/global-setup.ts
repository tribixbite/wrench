/**
 * Playwright global setup — registers a shared test account via browser,
 * saves storageState (cookies) for authenticated test suites to reuse.
 *
 * Also writes the shared account credentials to a JSON file so tests
 * that need to log in (e.g., logout test) can reuse the account.
 */
import { chromium, type FullConfig } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';

const STORAGE_STATE_PATH = 'e2e/.auth/state.json';
const CREDENTIALS_PATH = 'e2e/.auth/credentials.json';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'https://thewrench.club';
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? undefined;

  const email = `e2e-shared-${Date.now()}@mailinator.com`;
  const password = 'TestPass123!';

  const testSecret = process.env.TEST_SECRET ?? undefined;
  const extraHTTPHeaders = testSecret ? { 'X-Test-Key': testSecret } : undefined;

  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({ baseURL, extraHTTPHeaders });
  const page = await context.newPage();

  console.log('[global-setup] Registering:', email);

  await page.goto('/auth/register');
  await page.fill('[name="name"]', 'E2E Shared User');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.check('[name="waiver"]');

  // Click submit and wait for the form action response
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/auth/register') && res.request().method() === 'POST',
      { timeout: 120_000 }
    ).catch(() => null),
    page.click('[type="submit"]'),
  ]);

  if (response) {
    console.log('[global-setup] Form response:', response.status());

    // Handle rate limit — wait and retry
    if (response.status() === 429) {
      console.log('[global-setup] Rate limited, waiting 60s...');
      await page.waitForTimeout(60_000);
      await page.click('[type="submit"]');
      await page.waitForResponse(
        (res) => res.url().includes('/auth/register') && res.request().method() === 'POST',
        { timeout: 120_000 }
      ).catch(() => null);
    }
  } else {
    console.log('[global-setup] No form response within 120s');
  }

  // Poll URL for navigation after form response
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const url = page.url();
    if (url.includes('/app/dashboard') || url.includes('/auth/verify') || url.includes('/auth/login')) {
      console.log('[global-setup] Redirected to:', url);
      break;
    }
    await page.waitForTimeout(500);
  }

  // If still on register page, check for errors and retry
  if (page.url().includes('/auth/register')) {
    const errorText = await page.locator('[role="alert"], .form-error').textContent().catch(() => null);
    console.log('[global-setup] Still on register page. Error:', errorText ?? 'none');
  }

  // If we ended up at /auth/login (duplicate email), log in
  if (page.url().includes('/auth/login')) {
    console.log('[global-setup] Logging in...');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('[type="submit"]');
    const loginDeadline = Date.now() + 30_000;
    while (Date.now() < loginDeadline) {
      if (page.url().includes('/app/dashboard') || page.url().includes('/auth/verify')) break;
      await page.waitForTimeout(500);
    }
  }

  console.log('[global-setup] Final URL:', page.url());

  // Save auth state and credentials
  mkdirSync('e2e/.auth', { recursive: true });
  await context.storageState({ path: STORAGE_STATE_PATH });
  writeFileSync(CREDENTIALS_PATH, JSON.stringify({ email, password }));

  await browser.close();
}

export default globalSetup;
