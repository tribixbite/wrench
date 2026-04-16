import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $lib: 'src/lib'
    },
    /* Inline component CSS below this byte threshold as <style> tags
       instead of render-blocking <link> tags. Eliminates ~300ms on mobile. */
    inlineStyleThreshold: 30000
  }
};

export default config;
