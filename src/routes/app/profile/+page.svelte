<script lang="ts">
  import { User, Mail, Shield } from 'lucide-svelte';
  import { page } from '$app/stores';

  interface Props {
    data: { user: App.Locals['user'] };
  }

  const { data }: Props = $props();
</script>

<svelte:head>
  <title>Profile — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
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

  <p class="edit-note">
    Profile editing and membership management will be available at launch.
    Contact <a href="mailto:info@thewrench.club" style="color: var(--accent);">info@thewrench.club</a>
    for any changes.
  </p>
</div>

<style>
  .page { padding: 2.5rem; max-width: 600px; }
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
</style>
