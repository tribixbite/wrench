#!/usr/bin/env bun
/**
 * Runs Vite through bun to bypass Termux's android-arm64 platform detection.
 * bun reports process.platform === 'linux', which allows lightningcss and other
 * glibc-linked binaries to load correctly.
 *
 * Usage (via package.json scripts):
 *   bun scripts/vite-cli.ts dev
 *   bun scripts/vite-cli.ts build
 *   bun scripts/vite-cli.ts preview
 */

const cmd = process.argv[2] ?? 'dev';

if (cmd === 'dev') {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: './vite.config.ts',
    // Termux: getifaddrs fails with EACCES — bind only to loopback
    server: { host: 'localhost' }
  });
  try {
    await server.listen();
  } catch (err: unknown) {
    // Retry without host resolution if getifaddrs fails
    if ((err as NodeJS.ErrnoException)?.code === 'ERR_SYSTEM_ERROR') {
      await server.listen();
    } else {
      throw err;
    }
  }
  console.log('  ➜  Local: http://localhost:5173/');
  server.bindCLIShortcuts({ print: true });
} else if (cmd === 'build') {
  const { build } = await import('vite');
  await build({ configFile: './vite.config.ts' });
} else if (cmd === 'preview') {
  const { preview } = await import('vite');
  const server = await preview({ configFile: './vite.config.ts' });
  server.printUrls();
  server.bindCLIShortcuts({ print: true });
} else {
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}
