#!/usr/bin/env bash
# Termux/Android native module compatibility fixes
# Run automatically after bun install via postinstall script

set -e

MODULES="node_modules"

# ── esbuild ────────────────────────────────────────────────────────────────
# Termux reports android-arm64; esbuild ships linux-arm64 binaries.
# Symlink so esbuild can find its binary.
ESBUILD_LINUX="$MODULES/@esbuild/linux-arm64"
ESBUILD_ANDROID="$MODULES/@esbuild/android-arm64"

if [ -d "$ESBUILD_LINUX" ] && [ ! -L "$ESBUILD_ANDROID" ]; then
  echo "postinstall: symlinking @esbuild/linux-arm64 → android-arm64"
  ln -sf linux-arm64 "$ESBUILD_ANDROID"
fi

# ── rollup ─────────────────────────────────────────────────────────────────
# Replace rollup native binaries with the wasm-node build.
# On Termux (android), rollup's native .node binary targets glibc and can't
# load under bionic. @rollup/wasm-node provides a pure WASM alternative.
ROLLUP_WASM="$MODULES/@rollup/wasm-node"
ROLLUP_DIST="$MODULES/rollup/dist"

if [ -d "$ROLLUP_WASM/dist" ] && [ -d "$ROLLUP_DIST" ]; then
  echo "postinstall: replacing rollup dist with @rollup/wasm-node"
  cp "$ROLLUP_WASM/dist/native.js" "$ROLLUP_DIST/native.js"
  cp "$ROLLUP_WASM/dist/rollup.js" "$ROLLUP_DIST/rollup.js"
  cp -r "$ROLLUP_WASM/dist/wasm-node" "$ROLLUP_DIST/wasm-node"
fi

# ── static assets ──────────────────────────────────────────────────────────
# Copy founder/facility photos to static/assets/ for SvelteKit to serve.
# The originals live in assets/ (committed); static/assets/ is gitignored.
if [ -d "assets" ]; then
  echo "postinstall: copying assets/ → static/assets/"
  mkdir -p static/assets
  cp assets/*.jpg assets/*.png assets/*.webp static/assets/ 2>/dev/null || true
fi

echo "postinstall: done"
