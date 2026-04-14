<script lang="ts">
  import { Users, List, Mail, Calendar, Shield } from 'lucide-svelte';

  interface WaitlistEntry {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date | null;
  }

  interface UserRow {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date | null;
  }

  interface Props {
    data: {
      waitlistEntries: WaitlistEntry[];
      allUsers: UserRow[];
    };
  }

  const { data }: Props = $props();

  function formatDate(d: Date | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  let activeTab = $state<'waitlist' | 'users'>('waitlist');
</script>

<svelte:head>
  <title>Admin — Wrench Club</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="admin">
  <div class="admin-header">
    <div>
      <p class="admin-label">Admin Panel</p>
      <h1 class="admin-title font-display">Club Management</h1>
    </div>
    <div class="stats-row">
      <div class="stat-pill">
        <List size={14} />
        <span>{data.waitlistEntries.length} waitlist</span>
      </div>
      <div class="stat-pill">
        <Users size={14} />
        <span>{data.allUsers.length} members</span>
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'waitlist'}
      onclick={() => (activeTab = 'waitlist')}
    >
      <List size={15} /> Waitlist ({data.waitlistEntries.length})
    </button>
    <button
      class="tab"
      class:active={activeTab === 'users'}
      onclick={() => (activeTab = 'users')}
    >
      <Users size={15} /> Members ({data.allUsers.length})
    </button>
  </div>

  <!-- Waitlist Table -->
  {#if activeTab === 'waitlist'}
    <div class="table-wrap card">
      {#if data.waitlistEntries.length === 0}
        <div class="empty">
          <Mail size={32} style="color: var(--text-muted); margin-bottom: 0.75rem;" />
          <p>No waitlist entries yet.</p>
        </div>
      {:else}
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Name</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {#each data.waitlistEntries as entry, i}
                <tr>
                  <td class="row-num">{i + 1}</td>
                  <td>
                    <a href="mailto:{entry.email}" class="email-link">{entry.email}</a>
                  </td>
                  <td class="name-cell">{entry.name ?? '—'}</td>
                  <td class="date-cell">
                    <Calendar size={12} style="display:inline;margin-right:4px;opacity:0.5;" />
                    {formatDate(entry.createdAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Users Table -->
  {#if activeTab === 'users'}
    <div class="table-wrap card">
      {#if data.allUsers.length === 0}
        <div class="empty">
          <Users size={32} style="color: var(--text-muted); margin-bottom: 0.75rem;" />
          <p>No registered members yet.</p>
        </div>
      {:else}
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {#each data.allUsers as user, i}
                <tr>
                  <td class="row-num">{i + 1}</td>
                  <td class="name-cell">{user.name}</td>
                  <td>
                    <a href="mailto:{user.email}" class="email-link">{user.email}</a>
                  </td>
                  <td>
                    <span class="role-badge" class:admin={user.role === 'admin'}>
                      {#if user.role === 'admin'}<Shield size={11} />{/if}
                      {user.role}
                    </span>
                  </td>
                  <td class="date-cell">
                    <Calendar size={12} style="display:inline;margin-right:4px;opacity:0.5;" />
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .admin {
    padding: 2.5rem;
    max-width: 900px;
  }

  @media (max-width: 768px) {
    .admin { padding: 1.5rem 1.25rem; }
  }

  .admin-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  .admin-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
    margin: 0 0 0.25rem;
  }

  .admin-title {
    font-size: 2rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    margin: 0;
  }

  .stats-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .stat-pill {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    padding: 0.375rem 0.875rem;
    border-radius: 999px;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -1px;
  }

  .tab:hover { color: var(--text-secondary); }

  .tab.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent);
  }

  /* Table */
  .table-wrap {
    padding: 0;
    overflow: hidden;
  }

  .empty {
    padding: 3rem 2rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9375rem;
  }

  .table-scroll {
    overflow-x: auto;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .table th {
    text-align: left;
    padding: 0.875rem 1.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  .table td {
    padding: 0.875rem 1.25rem;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }

  .table tbody tr:last-child td {
    border-bottom: none;
  }

  .table tbody tr:hover td {
    background: var(--bg-elevated);
  }

  .row-num {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    width: 40px;
  }

  .name-cell { color: var(--text-primary); font-weight: 500; }

  .email-link {
    color: var(--accent);
    text-decoration: none;
  }
  .email-link:hover { text-decoration: underline; }

  .date-cell {
    white-space: nowrap;
    font-size: 0.8125rem;
  }

  .role-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-muted);
  }

  .role-badge.admin {
    background: var(--accent-muted);
    border-color: var(--accent-border);
    color: var(--accent);
  }
</style>
