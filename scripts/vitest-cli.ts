#!/usr/bin/env bun
/**
 * Runs vitest through bun to bypass Termux's android-arm64 platform detection.
 * bun reports process.platform === 'linux', which lets esbuild native binaries
 * load without hitting the android-arm64 binary version mismatch.
 *
 * This script programmatically calls startVitest() so it runs in the same bun
 * process rather than spawning node.
 *
 * Usage (via package.json scripts):
 *   bun scripts/vitest-cli.ts run
 *   bun scripts/vitest-cli.ts run --reporter=verbose
 *   bun scripts/vitest-cli.ts run --coverage
 *   bun scripts/vitest-cli.ts watch
 */

const rawArgs = process.argv.slice(2);
const mode = rawArgs[0] === 'watch' ? 'watch' : 'run';

// All args after 'run'/'watch' are forwarded to vitest as CLI options
const cliArgs = rawArgs.slice(1);

const { parseCLI, startVitest } = await import('vitest/node');

// parseCLI expects ['vitest', 'run', ...options]
const { options } = parseCLI(['vitest', mode, ...cliArgs]);

const vitest = await startVitest(mode, [], options);

if (!vitest) process.exit(1);

await vitest.close();

// Exit with the number of failing tests (0 = all pass)
const failed = vitest.state.getFiles().filter((f) => f.result?.state === 'fail').length;
process.exit(failed > 0 ? 1 : 0);
