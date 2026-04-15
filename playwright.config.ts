import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Wrench Club E2E tests.
 *
 * Tests run against the live site (https://thewrench.club by default).
 * Set TEST_BASE_URL to override.
 *
 * -- Termux/Android local usage --
 * Playwright cannot install its bundled Chromium on Android.
 * Use scripts/playwright-cli.ts which patches process.platform and sets env vars,
 * or set the following before invoking bunx playwright:
 *
 *   export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu22.04-arm64
 *   export PLAYWRIGHT_BROWSERS_PATH=0
 *   export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$(which chromium-browser)
 *
 * The config reads PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH and applies it to each project.
 */
const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? undefined;

/** Common device override to inject system Chromium when available */
const withSystemChromium = (deviceConfig: Record<string, unknown>) => ({
  ...deviceConfig,
  ...(systemChromium ? { executablePath: systemChromium } : {}),
});

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // sequential to avoid auth state conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'https://thewrench.club',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: withSystemChromium({ ...devices['Desktop Chrome'] }),
    },
    {
      name: 'mobile',
      use: withSystemChromium({ ...devices['Pixel 5'] }),
    },
  ],
});
