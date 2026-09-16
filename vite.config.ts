import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // Prevent Vite from restarting when .env changes on Windows + Bun.
      // The EFAULT/ENOENT bug only triggers when the SvelteKit plugin tries
      // to delete .svelte-kit/types during a mid-run restart. Env var changes
      // require a manual server restart anyway.
      ignored: ['**/.env', '**/.env.*', '**/.svelte-kit/**']
    }
  }
});
