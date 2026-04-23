<script lang="ts">
  import { User, Mail, Shield, Sun, Moon, Monitor } from 'lucide-svelte';
  import BackLink from '$lib/components/app/BackLink.svelte';
  import { onMount } from 'svelte';
  import { getThemeMode, setThemeMode, type ThemeMode } from '$lib/stores/theme';

  interface Props {
    data: { user: App.Locals['user'] };
  }

  const { data }: Props = $props();

  let themeMode = $state<ThemeMode>('auto');

  onMount(() => {
    themeMode = getThemeMode();
  });

  function onThemeChange(mode: ThemeMode) {
    themeMode = mode;
    setThemeMode(mode);
  }
</script>

<svelte:head>
  <title>Profile — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
  <BackLink href="/app/dashboard" label="Dashboard" />
  <h1 class="page-title font-display">Your Profile</h1>

  <div class="profile-card card">
    <div class="profile-avatar">
      {data.user?.name?.[0]?.toUpperCase() ?? 'M'}
    </div>
    <div class="profile-info">
      <div class="info-row">
        <User size={16} style="color: var(--text-muted);" />
        <div>
          <p class="info-label">Full Name</p>
          <p class="info-value">{data.user?.name}</p>
        </div>
      </div>
      <div class="info-row">
        <Mail size={16} style="color: var(--text-muted);" />
        <div>
          <p class="info-label">Email</p>
          <p class="info-value">{data.user?.email}</p>
        </div>
      </div>
      <div class="info-row">
        <Shield size={16} style="color: var(--text-muted);" />
        <div>
          <p class="info-label">Role</p>
          <p class="info-value" style="text-transform: capitalize;">{data.user?.role}</p>
        </div>
      </div>
    </div>
  </div>

  <div class="settings-card card">
    <h2 class="settings-title">Appearance</h2>
    <p class="settings-sub">Match the site theme to your preference.</p>
    <div class="theme-options" role="radiogroup" aria-label="Theme preference">
      <label class="theme-option" class:selected={themeMode === 'auto'}>
        <input
          type="radio"
          name="theme"
          value="auto"
          checked={themeMode === 'auto'}
          onchange={() => onThemeChange('auto')}
        />
        <Monitor size={18} />
        <span class="theme-name">System</span>
        <span class="theme-desc">Follow device setting</span>
      </label>
      <label class="theme-option" class:selected={themeMode === 'dark'}>
        <input
          type="radio"
          name="theme"
          value="dark"
          checked={themeMode === 'dark'}
          onchange={() => onThemeChange('dark')}
        />
        <Moon size={18} />
        <span class="theme-name">Dark</span>
        <span class="theme-desc">Default garage look</span>
      </label>
      <label class="theme-option" class:selected={themeMode === 'light'}>
        <input
          type="radio"
          name="theme"
          value="light"
          checked={themeMode === 'light'}
          onchange={() => onThemeChange('light')}
        />
        <Sun size={18} />
        <span class="theme-name">Light</span>
        <span class="theme-desc">Bright bay lights</span>
      </label>
    </div>
  </div>

  <p class="edit-note">
    Editing your name, email, and membership details will be available at launch.
    Contact <a href="mailto:info@thewrench.club" style="color: var(--accent);">info@thewrench.club</a>
    in the meantime.
  </p>
</div>

<style>
  .page { padding: 2.5rem; max-width: 600px; margin: 0 auto; }
  @media (max-width: 768px) { .page { padding: 1.5rem 1.25rem; } }

  .page-title {
    font-size: 2.25rem;
    font-weight: 900;
    color: var(--text-primary);
    margin-bottom: 1.75rem;
  }

  .profile-card {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .profile-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
  }

  .info-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .info-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin: 0 0 0.25rem;
  }

  .info-value {
    font-size: 1rem;
    color: var(--text-primary);
    margin: 0;
    font-weight: 500;
  }

  .edit-note {
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .settings-card {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .settings-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .settings-sub {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin: 0 0 1rem;
  }

  .theme-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    .theme-options { grid-template-columns: 1fr; }
  }

  .theme-option {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    column-gap: 0.625rem;
    row-gap: 0.125rem;
    align-items: center;
    padding: 0.75rem 0.875rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .theme-option :global(svg) {
    grid-row: span 2;
    color: var(--text-secondary);
  }

  .theme-option:hover { border-color: var(--accent); }

  .theme-option.selected {
    background: var(--accent-muted);
    border-color: var(--accent);
  }

  .theme-option.selected :global(svg) { color: var(--accent-text); }

  .theme-option input[type="radio"] {
    /* Keep accessible but visually reclaim the space with the label. */
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .theme-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .theme-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .theme-option.selected .theme-desc { color: var(--accent-text); }
</style>
