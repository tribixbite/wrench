#!/usr/bin/env bash
# Native module compatibility fixes + static asset copy.
# Termux-specific fixes are skipped on standard Linux (Railway, Vercel, etc.)
# Run automatically after bun install via postinstall script.

set -e

MODULES="node_modules"

# Detect Termux / Android environment
IS_ANDROID=false
if [ "$(uname -o 2>/dev/null)" = "Android" ] || [ -d "/data/data/com.termux" ]; then
  IS_ANDROID=true
fi

if [ "$IS_ANDROID" = "true" ]; then
  # ── esbuild ──────────────────────────────────────────────────────────────
  # Termux reports android-arm64; esbuild ships linux-arm64 binaries.
  ESBUILD_LINUX="$MODULES/@esbuild/linux-arm64"
  ESBUILD_ANDROID="$MODULES/@esbuild/android-arm64"

  if [ -d "$ESBUILD_LINUX" ] && [ ! -L "$ESBUILD_ANDROID" ]; then
    echo "postinstall: symlinking @esbuild/linux-arm64 → android-arm64"
    ln -sf linux-arm64 "$ESBUILD_ANDROID"
  fi

  # ── rollup ────────────────────────────────────────────────────────────────
  # On Termux (Android bionic), rollup's native .node binary targets glibc
  # and can't load. @rollup/wasm-node provides a pure WASM alternative.
  ROLLUP_WASM="$MODULES/@rollup/wasm-node"
  ROLLUP_DIST="$MODULES/rollup/dist"

  if [ -d "$ROLLUP_WASM/dist" ] && [ -d "$ROLLUP_DIST" ]; then
    echo "postinstall: replacing rollup dist with @rollup/wasm-node"
    cp "$ROLLUP_WASM/dist/native.js" "$ROLLUP_DIST/native.js"
    cp "$ROLLUP_WASM/dist/rollup.js" "$ROLLUP_DIST/rollup.js"
    cp -r "$ROLLUP_WASM/dist/wasm-node" "$ROLLUP_DIST/wasm-node"
  fi
fi

# ── static assets ──────────────────────────────────────────────────────────
# Copy founder/facility photos to static/assets/ for SvelteKit to serve.
# The originals live in assets/ (committed); static/assets/ is gitignored.
if [ -d "assets" ]; then
  echo "postinstall: copying assets/ → static/assets/"
  mkdir -p static/assets
  cp assets/*.jpg assets/*.png assets/*.webp static/assets/ 2>/dev/null || true
fi

if [ -d "assets/merch" ]; then
  echo "postinstall: copying assets/merch/ → static/assets/merch/"
  mkdir -p static/assets/merch
  cp assets/merch/*.webp static/assets/merch/ 2>/dev/null || true
fi

echo "postinstall: done"
