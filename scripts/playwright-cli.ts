/**
 * Playwright CLI wrapper for Termux/Android.
 *
 * Termux reports process.platform === 'android' which causes Playwright's
 * registry to throw "Unsupported platform: android" at module load time,
 * and the hostPlatform detection returns '<unknown>', blocking browser launch.
 *
 * This wrapper:
 * 1. Overrides process.platform to 'linux' before any Playwright module loads
 * 2. Sets PLAYWRIGHT_HOST_PLATFORM_OVERRIDE so hostPlatform resolves correctly
 * 3. Sets PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to the system Chromium
 * 4. Invokes the Playwright program with all forwarded args
 *
 * Usage:
 *   bun scripts/playwright-cli.ts test e2e/api.spec.ts --reporter=list
 */

// Must patch platform before any import of playwright-core
(process as NodeJS.Process & { platform: string }).platform = 'linux';

// Resolve to ubuntu22.04-arm64 so Playwright picks up an aarch64 variant
if (!process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE) {
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'ubuntu22.04-arm64';
}

// System Chromium path (installed via Termux pkg)
if (!process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
  const chromiumPath =
    Bun.which('chromium-browser') ??
    Bun.which('chromium') ??
    Bun.which('google-chrome');
  if (chromiumPath) {
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = chromiumPath;
  }
}

// Use playwright-core's .local-browsers dir (BROWSERS_PATH=0)
// Combined with executablePath in playwright.config.ts, system Chromium is used.
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
}

// Now import and invoke the Playwright program
const { program } = await import('playwright/lib/program');
process.argv = ['bun', 'playwright-cli.ts', ...process.argv.slice(2)];
program.parse(process.argv);
