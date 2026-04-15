import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Wrench Club E2E tests.
 *
 * Tests run against the live site (https://thewrench.club by default).
 * Set TEST_BASE_URL to override.
 *
 * Uses a global setup to register one shared account and save cookies.
 * Authenticated tests reuse that session — no per-test registration needed.
 */
const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? undefined;
const testSecret = process.env.TEST_SECRET ?? undefined;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'https://thewrench.club',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    ...(systemChromium ? { launchOptions: { executablePath: systemChromium } } : {}),
    ...(testSecret ? { extraHTTPHeaders: { 'X-Test-Key': testSecret } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
