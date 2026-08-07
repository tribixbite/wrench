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

  console.log('[global-setup] Registering via API:', email);

  // Registration now requires Square payment — use the API directly with the
  // TEST_SECRET bypass so CI doesn't need a real card.
  const registerRes = await context.request.post(`${baseURL}/api/membership/register`, {
    headers: {
      'Content-Type': 'application/json',
      ...(testSecret ? { 'X-Test-Key': testSecret } : {})
    },
    data: {
      firstName: 'E2E',
      lastName: 'User',
      email,
      password,
      cardNonce: 'bypass'
    }
  });

  console.log('[global-setup] Register response:', registerRes.status());

  if (!registerRes.ok()) {
    const body = await registerRes.text().catch(() => '');
    console.log('[global-setup] Register failed:', body);
    // Save empty state — authenticated tests will be skipped via loadSharedCredentials()
    mkdirSync('e2e/.auth', { recursive: true });
    await context.storageState({ path: STORAGE_STATE_PATH });
    writeFileSync(CREDENTIALS_PATH, JSON.stringify({ email, password }));
    await browser.close();
    return;
  }

  // Session cookie is now set on the context — navigate to dashboard to confirm
  await page.goto('/app/dashboard');
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const url = page.url();
    if (url.includes('/app/dashboard') || url.includes('/auth/verify')) {
      console.log('[global-setup] Authenticated at:', url);
      break;
    }
    await page.waitForTimeout(500);
  }
  console.log('[global-setup] Final URL:', page.url());

  console.log('[global-setup] Final URL:', page.url());

  // Save auth state and credentials
  mkdirSync('e2e/.auth', { recursive: true });
  await context.storageState({ path: STORAGE_STATE_PATH });
  writeFileSync(CREDENTIALS_PATH, JSON.stringify({ email, password }));

  await browser.close();
}

export default globalSetup;
