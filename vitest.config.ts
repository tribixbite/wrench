/**
 * Vitest configuration for unit tests.
 *
 * We intentionally omit the SvelteKit plugin — unit tests only cover pure
 * TypeScript modules (schemas, server helpers, utils) and do not need Svelte
 * component compilation or SSR machinery.
 *
 * Path aliases:
 *   - $lib  → resolved via resolve.alias
 *   - $env/dynamic/private and $app/* → mocked with vi.mock() in each test file
 */
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      /** Map $lib to src/lib so test imports match the app's tsconfig paths */
      $lib: resolve('./src/lib')
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/server/db.ts', '**/*.d.ts']
    }
  }
});
