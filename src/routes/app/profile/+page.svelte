<script lang="ts">
  import { User, Mail, Shield, Sun, Moon, Monitor, Car, Trash2, Plus, Pencil, X, Eye, EyeOff } from 'lucide-svelte';
  import BackLink from '$lib/components/app/BackLink.svelte';
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { env } from '$env/dynamic/public';
  import { getThemeMode, setThemeMode, type ThemeMode } from '$lib/stores/theme';

  const supportEmail = env.PUBLIC_SUPPORT_EMAIL || 'info@thewrench.club';

  interface VehicleRow { id: string; year: string; make: string; model: string; }

  interface Props {
    data: { user: App.Locals['user']; vehicles: VehicleRow[] };
    form: {
      error?: string; success?: boolean;
      nameError?: string; nameSuccess?: boolean;
      emailError?: string; emailSuccess?: boolean;
      passwordError?: string; passwordSuccess?: boolean;
    } | null;
  }

  const { data, form }: Props = $props();

  let themeMode = $state<ThemeMode>('auto');
  let showAddVehicle = $state(false);
  let addLoading = $state(false);

  type EditSection = 'name' | 'email' | 'password' | null;
  let editing = $state<EditSection>(null);
  let showCurrentPw = $state(false);
  let showNewPw = $state(false);

  $effect(() => {
    if (form?.nameSuccess || form?.emailSuccess || form?.passwordSuccess) editing = null;
  });

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

      <!-- Name -->
      <div class="info-row">
        <User size={16} style="color: var(--text-muted); flex-shrink:0;" />
        <div class="info-body">
          <p class="info-label">Full Name</p>
          {#if editing === 'name'}
            <form method="POST" action="?/updateName" use:enhance class="edit-form">
              {#if form?.nameError}<p class="field-error">{form.nameError}</p>{/if}
              <div class="edit-row">
                <input name="firstName" class="input input-sm" placeholder="First" value={data.user?.name?.split(' ')[0] ?? ''} required />
                <input name="lastName" class="input input-sm" placeholder="Last" value={data.user?.name?.split(' ').slice(1).join(' ') ?? ''} required />
              </div>
              <div class="edit-actions">
                <button type="submit" class="btn btn-primary btn-sm">Save</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick={() => (editing = null)}>Cancel</button>
              </div>
            </form>
          {:else}
            <div class="info-value-row">
              <p class="info-value">{data.user?.name}</p>
              <button class="edit-btn" onclick={() => (editing = 'name')} aria-label="Edit name"><Pencil size={13} /></button>
            </div>
            {#if form?.nameSuccess}<p class="field-success">Name updated.</p>{/if}
          {/if}
        </div>
      </div>

      <!-- Email -->
      <div class="info-row">
        <Mail size={16} style="color: var(--text-muted); flex-shrink:0;" />
        <div class="info-body">
          <p class="info-label">Email</p>
          {#if editing === 'email'}
            <form method="POST" action="?/updateEmail" use:enhance class="edit-form">
              {#if form?.emailError}<p class="field-error">{form.emailError}</p>{/if}
              <input name="email" type="email" class="input input-sm" value={data.user?.email ?? ''} required />
              <div class="edit-actions">
                <button type="submit" class="btn btn-primary btn-sm">Save</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick={() => (editing = null)}>Cancel</button>
              </div>
            </form>
          {:else}
            <div class="info-value-row">
              <p class="info-value">{data.user?.email}</p>
              <button class="edit-btn" onclick={() => (editing = 'email')} aria-label="Edit email"><Pencil size={13} /></button>
            </div>
            {#if form?.emailSuccess}<p class="field-success">Email updated.</p>{/if}
          {/if}
        </div>
      </div>

      <!-- Password -->
      <div class="info-row">
        <Shield size={16} style="color: var(--text-muted); flex-shrink:0;" />
        <div class="info-body">
          <p class="info-label">Password</p>
          {#if editing === 'password'}
            <form method="POST" action="?/updatePassword" use:enhance class="edit-form">
              {#if form?.passwordError}<p class="field-error">{form.passwordError}</p>{/if}
              <div class="pw-field">
                <input name="currentPassword" type={showCurrentPw ? 'text' : 'password'} class="input input-sm" placeholder="Current password" required />
                <button type="button" class="pw-toggle" onclick={() => (showCurrentPw = !showCurrentPw)}>{#if showCurrentPw}<EyeOff size={14} />{:else}<Eye size={14} />{/if}</button>
              </div>
              <div class="pw-field">
                <input name="newPassword" type={showNewPw ? 'text' : 'password'} class="input input-sm" placeholder="New password (min 8 chars)" minlength="8" required />
                <button type="button" class="pw-toggle" onclick={() => (showNewPw = !showNewPw)}>{#if showNewPw}<EyeOff size={14} />{:else}<Eye size={14} />{/if}</button>
              </div>
              <input name="confirmPassword" type="password" class="input input-sm" placeholder="Confirm new password" required />
              <div class="edit-actions">
                <button type="submit" class="btn btn-primary btn-sm">Update Password</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick={() => (editing = null)}>Cancel</button>
              </div>
            </form>
          {:else}
            <div class="info-value-row">
              <p class="info-value">••••••••</p>
              <button class="edit-btn" onclick={() => (editing = 'password')} aria-label="Change password"><Pencil size={13} /></button>
            </div>
            {#if form?.passwordSuccess}<p class="field-success">Password updated.</p>{/if}
          {/if}
        </div>
      </div>

      <!-- Role (read-only) -->
      <div class="info-row">
        <Shield size={16} style="color: var(--text-muted); flex-shrink:0;" />
        <div class="info-body">
          <p class="info-label">Role</p>
          <p class="info-value" style="text-transform: capitalize;">{data.user?.role}</p>
        </div>
      </div>

    </div>
  </div>

  <!-- My Vehicles -->
  <div class="settings-card card">
    <div class="vehicles-header">
      <div>
        <h2 class="settings-title">My Vehicles</h2>
        <p class="settings-sub">Vehicles you bring to Wrench Club.</p>
      </div>
      <button class="btn btn-outline btn-sm" onclick={() => (showAddVehicle = !showAddVehicle)}>
        <Plus size={14} /> Add Vehicle
      </button>
    </div>

    {#if form?.error}
      <div class="form-error" role="alert">{form.error}</div>
    {/if}

    {#if showAddVehicle}
      <form
        method="POST"
        action="?/addVehicle"
        class="add-vehicle-form"
        use:enhance={() => {
          addLoading = true;
          return ({ update }) => { addLoading = false; showAddVehicle = false; update(); };
        }}
      >
        <div class="vehicle-fields">
          <input name="year" type="text" class="input" placeholder="Year" maxlength="4" required />
          <input name="make" type="text" class="input" placeholder="Make" required />
          <input name="model" type="text" class="input" placeholder="Model" required />
        </div>
        <div class="add-vehicle-actions">
          <button type="submit" class="btn btn-primary btn-sm" disabled={addLoading}>
            {addLoading ? 'Saving…' : 'Save Vehicle'}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => (showAddVehicle = false)}>
            Cancel
          </button>
        </div>
      </form>
    {/if}

    {#if data.vehicles.length === 0 && !showAddVehicle}
      <div class="vehicles-empty">
        <Car size={28} style="color: var(--text-muted); margin-bottom: 0.5rem;" />
        <p>No vehicles added yet.</p>
      </div>
    {:else}
      <ul class="vehicle-list">
        {#each data.vehicles as v (v.id)}
          <li class="vehicle-row">
            <Car size={15} style="color: var(--accent); flex-shrink: 0;" />
            <span class="vehicle-label">{v.year} {v.make} {v.model}</span>
            <form method="POST" action="?/deleteVehicle" use:enhance>
              <input type="hidden" name="id" value={v.id} />
              <button type="submit" class="delete-btn" aria-label="Remove {v.year} {v.make} {v.model}">
                <Trash2 size={14} />
              </button>
            </form>
          </li>
        {/each}
      </ul>
    {/if}
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

  .vehicles-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .btn-sm {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.4rem 0.875rem;
    font-size: 0.8125rem;
  }

  .form-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.5rem;
    padding: 0.625rem 0.875rem;
    color: #fca5a5;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .add-vehicle-form {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .vehicle-fields {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  @media (max-width: 480px) {
    .vehicle-fields { grid-template-columns: 1fr; }
  }

  .add-vehicle-actions {
    display: flex;
    gap: 0.5rem;
  }

  .vehicles-empty {
    padding: 1.5rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.875rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .vehicle-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .vehicle-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }

  .vehicle-label {
    flex: 1;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .delete-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  /* ---- Profile inline-edit styles ---- */
  .info-body { flex: 1; min-width: 0; }

  .info-value-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .edit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .edit-btn:hover { background: var(--bg-elevated); color: var(--accent); }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .edit-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  @media (max-width: 480px) { .edit-row { grid-template-columns: 1fr; } }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .pw-field {
    position: relative;
    display: flex;
    align-items: center;
  }

  .pw-field .input { flex: 1; padding-right: 2.25rem; }

  .pw-toggle {
    position: absolute;
    right: 0.5rem;
    display: inline-flex;
    align-items: center;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
  }

  .pw-toggle:hover { color: var(--text-primary); }

  .field-error {
    font-size: 0.8125rem;
    color: #f87171;
    margin: 0;
    line-height: 1.4;
  }

  .field-success {
    font-size: 0.8125rem;
    color: #4ade80;
    margin: 0;
    line-height: 1.4;
  }

  .input-sm { font-size: 0.875rem; padding: 0.375rem 0.625rem; }
</style>
