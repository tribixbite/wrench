<script lang="ts">
  import { page } from '$app/stores';
  import { Menu, X, Wrench } from 'lucide-svelte';

  interface Props {
    user?: { name: string; email: string; role: string } | null;
  }

  const { user = null }: Props = $props();

  let mobileOpen = $state(false);
  let scrolled = $state(false);

  const navLinks = [
    { href: '/pricing', label: 'Pricing' },
    { href: '/membership', label: 'Membership' },
    { href: '/about', label: 'About' },
    { href: '/store', label: 'Shop' }
  ];

  $effect(() => {
    const onScroll = () => { scrolled = window.scrollY > 20; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  function closeMobile() { mobileOpen = false; }
</script>

<header
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
  class:scrolled
>
  <div class="container mx-auto px-6 flex items-center justify-between h-16">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 shrink-0" onclick={closeMobile}>
      <img
        src="/assets/logo.webp"
        alt="Wrench Club"
        class="h-7 w-auto"
        loading="eager"
      />
    </a>

    <!-- Desktop Nav -->
    <nav class="hidden md:flex items-center gap-6" aria-label="Main navigation">
      {#each navLinks as link}
        <a
          href={link.href}
          class="nav-link text-sm font-medium transition-colors"
          class:active={$page.url.pathname === link.href}
        >
          {link.label}
        </a>
      {/each}
    </nav>

    <!-- Desktop CTA -->
    <div class="hidden md:flex items-center gap-3">
      {#if user}
        <a href="/app/dashboard" class="nav-link text-sm font-medium">Dashboard</a>
        <form method="POST" action="/auth/logout" style="display:contents">
          <button type="submit" class="btn btn-ghost text-sm py-2 px-4">Sign Out</button>
        </form>
      {:else}
        <a href="/auth/login" class="nav-link text-sm font-medium">Member Login</a>
        <a href="#waitlist" class="btn btn-primary py-2 px-5 text-sm" onclick={closeMobile}>
          Join Waitlist
        </a>
      {/if}
    </div>

    <!-- Mobile Hamburger -->
    <button
      class="md:hidden p-2 rounded-md text-[--text-secondary] hover:text-[--text-primary] transition-colors"
      onclick={() => (mobileOpen = !mobileOpen)}
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileOpen}
    >
      {#if mobileOpen}
        <X size={22} />
      {:else}
        <Menu size={22} />
      {/if}
    </button>
  </div>

  <!-- Mobile Menu -->
  {#if mobileOpen}
    <div class="md:hidden mobile-menu border-t border-[--border]">
      <nav class="container mx-auto px-6 py-4 flex flex-col gap-1">
        {#each navLinks as link}
          <a
            href={link.href}
            class="mobile-nav-link py-3 text-base font-medium border-b border-[--border] last:border-0"
            onclick={closeMobile}
          >
            {link.label}
          </a>
        {/each}
        <div class="pt-4 flex flex-col gap-3">
          {#if user}
            <a href="/app/dashboard" class="btn btn-ghost w-full" onclick={closeMobile}>
              Dashboard
            </a>
          {:else}
            <a href="/auth/login" class="btn btn-ghost w-full" onclick={closeMobile}>
              Member Login
            </a>
            <a href="#waitlist" class="btn btn-primary w-full" onclick={closeMobile}>
              Join Waitlist
            </a>
          {/if}
        </div>
      </nav>
    </div>
  {/if}
</header>

<style>
  header {
    background: transparent;
  }

  header.scrolled {
    background: rgba(10, 10, 10, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  }

  .nav-link {
    color: var(--text-secondary);
    text-decoration: none;
    position: relative;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--accent);
    transition: width 0.2s ease;
  }

  .nav-link:hover {
    color: var(--text-primary);
  }

  .nav-link:hover::after,
  .nav-link.active::after {
    width: 100%;
  }

  .nav-link.active {
    color: var(--text-primary);
  }

  .mobile-menu {
    background: rgba(10, 10, 10, 0.97);
    backdrop-filter: blur(12px);
  }

  .mobile-nav-link {
    color: var(--text-secondary);
    text-decoration: none;
    display: block;
    transition: color 0.15s;
  }

  .mobile-nav-link:hover {
    color: var(--text-primary);
  }
</style>
