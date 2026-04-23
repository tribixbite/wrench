/**
 * Theme preference store — auto (follow system), dark, or light.
 * Source of truth is localStorage; the inline boot script in app.html
 * applies the initial value before first paint, so there is no FOUC.
 */
import { browser } from '$app/environment';

export type ThemeMode = 'auto' | 'dark' | 'light';
const STORAGE_KEY = 'wrench-theme';

export function getThemeMode(): ThemeMode {
  if (!browser) return 'auto';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'light' || stored === 'auto' ? stored : 'auto';
}

/** Compute the theme that should actually render given the chosen mode. */
export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (!browser) return 'dark';
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return mode;
}

export function setThemeMode(mode: ThemeMode): void {
  if (!browser) return;
  localStorage.setItem(STORAGE_KEY, mode);
  document.documentElement.setAttribute('data-theme', resolveTheme(mode));
}

/**
 * Keep the rendered theme in sync with the system when mode is 'auto'.
 * Returns an unsubscriber suitable for onDestroy / effect cleanup.
 */
export function watchSystemPreference(): () => void {
  if (!browser) return () => {};
  const mql = window.matchMedia('(prefers-color-scheme: light)');
  const handler = () => {
    if (getThemeMode() === 'auto') {
      document.documentElement.setAttribute('data-theme', resolveTheme('auto'));
    }
  };
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
