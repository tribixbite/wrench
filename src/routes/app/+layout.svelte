<script lang="ts">
  import { LayoutDashboard, CalendarDays, User, LogOut, Wrench } from 'lucide-svelte';
  import { page } from '$app/stores';

  interface Props {
    data: { user: App.Locals['user'] };
    children: import('svelte').Snippet;
  }

  const { data, children }: Props = $props();

  const navItems = [
    { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/app/reservations', icon: CalendarDays, label: 'Reservations' },
    { href: '/app/profile', icon: User, label: 'Profile' }
  ];
</script>

<div class="app-shell">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-top">
      <a href="/" class="sidebar-logo">
        <img src="/assets/logo.webp" alt="Wrench Club" class="h-7 w-auto" />
      </a>
    </div>

    <nav class="sidebar-nav">
      {#each navItems as item}
        <a
          href={item.href}
          class="sidebar-link"
          class:active={$page.url.pathname === item.href}
          aria-current={$page.url.pathname === item.href ? 'page' : undefined}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class="sidebar-bottom">
      <div class="user-chip">
        <div class="user-avatar">{data.user?.name?.[0]?.toUpperCase() ?? 'M'}</div>
        <div class="user-info">
          <p class="user-name">{data.user?.name}</p>
          <p class="user-role">{data.user?.role}</p>
        </div>
      </div>
      <a href="/auth/logout" class="sidebar-link logout-link">
        <LogOut size={16} />
        <span>Sign Out</span>
      </a>
    </div>
  </aside>

  <!-- Main content -->
  <main class="app-main">
    {@render children()}
  </main>
</div>

<style>
  .app-shell {
    display: flex;
    min-height: 100svh;
    background: var(--bg-primary);
  }

  .sidebar {
    width: 240px;
    flex-shrink: 0;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 40;
  }

  .sidebar-top {
    padding: 1.5rem 1.25rem 1rem;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-logo {
    display: inline-block;
  }

  .sidebar-nav {
    flex: 1;
    padding: 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    overflow-y: auto;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.875rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-secondary);
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }

  .sidebar-link:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  .sidebar-link.active {
    background: var(--accent-muted);
    color: var(--accent);
    border: 1px solid var(--accent-border);
  }

  .sidebar-bottom {
    padding: 1rem 0.75rem;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .user-chip {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.875rem;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    font-size: 0.875rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .user-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0;
    text-transform: capitalize;
  }

  .logout-link {
    color: var(--text-muted);
  }

  .logout-link:hover {
    color: var(--danger);
    background: rgba(239, 68, 68, 0.08);
  }

  .app-main {
    flex: 1;
    margin-left: 240px;
    min-width: 0;
    overflow-x: hidden;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      bottom: unset;
      height: 56px;
      flex-direction: row;
      align-items: center;
      border-right: none;
      border-bottom: 1px solid var(--border);
      padding: 0 1rem;
      gap: 0;
      justify-content: space-between;
    }

    .sidebar-top {
      border-bottom: none;
      padding: 0;
    }

    .sidebar-nav {
      flex-direction: row;
      padding: 0;
      gap: 0;
      overflow-x: auto;
    }

    .sidebar-link span { display: none; }

    .sidebar-bottom {
      border-top: none;
      padding: 0;
      flex-direction: row;
    }

    .user-info, .user-name, .user-role { display: none; }
    .user-chip { padding: 0; gap: 0; }

    .app-main {
      margin-left: 0;
      margin-top: 56px;
    }
  }
</style>
