<script lang="ts">
  import { page } from '$app/stores';
  import { Menu, X, ChevronRight, Gauge } from 'lucide-svelte';
  import { fly, slide } from 'svelte/transition';

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
        src="/logo.webp"
        alt="Wrench Club"
        class="h-7 w-auto"
        width="250"
        height="63"
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
      class="md:hidden hamburger-btn"
      onclick={() => (mobileOpen = !mobileOpen)}
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileOpen}
      class:open={mobileOpen}
    >
      {#if mobileOpen}
        <X size={22} />
      {:else}
        <Menu size={22} />
      {/if}
    </button>
  </div>

  <!-- Mobile Menu — animated -->
  {#if mobileOpen}
    <div
      class="md:hidden mobile-menu"
      transition:slide={{ duration: 280 }}
    >
      <!-- Pink racing stripe across top -->
      <div class="racing-stripe"></div>

      <nav class="container mx-auto px-6 py-3 flex flex-col">
        {#each navLinks as link, i}
          <a
            href={link.href}
            class="mobile-nav-link"
            class:active={$page.url.pathname === link.href}
            onclick={closeMobile}
            in:fly={{ x: -60, duration: 250, delay: 60 + i * 70 }}
          >
            <span class="link-content">
              <ChevronRight size={14} class="link-chevron" />
              <span class="link-label">{link.label}</span>
            </span>
            <!-- Separator line with drive-across animation -->
            <div class="separator">
              <div class="separator-line"></div>
              <div class="separator-drive" style="animation-delay: {120 + i * 70}ms"></div>
            </div>
          </a>
        {/each}

        <!-- CTA section -->
        <div
          class="cta-section"
          in:fly={{ y: 16, duration: 250, delay: 380 }}
        >
          {#if user}
            <a href="/app/dashboard" class="mobile-cta-btn cta-dashboard" onclick={closeMobile}>
              <Gauge size={16} />
              Dashboard
            </a>
          {:else}
            <a href="/auth/login" class="mobile-cta-btn cta-login" onclick={closeMobile}>
              Member Login
            </a>
            <a href="#waitlist" class="mobile-cta-btn cta-waitlist" onclick={closeMobile}>
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
    /* Force GPU compositing layer — fixes backdrop-filter pixel artifacts on mobile */
    transform: translateZ(0);
    will-change: backdrop-filter;
  }

  /* ── Desktop nav ──────────────────────────────────────── */
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

  .nav-link:hover { color: var(--text-primary); }

  .nav-link:hover::after,
  .nav-link.active::after { width: 100%; }

  .nav-link.active { color: var(--text-primary); }

  /* ── Hamburger ──────────────────────────────────────── */
  .hamburger-btn {
    padding: 0.5rem;
    border-radius: 0.375rem;
    color: var(--text-secondary);
    transition: all 0.2s;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  .hamburger-btn:hover { color: var(--text-primary); }

  .hamburger-btn.open {
    color: var(--accent-text);
  }

  /* ── Mobile menu ──────────────────────────────────────── */
  .mobile-menu {
    background: rgba(10, 10, 10, 0.98);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--border);
    overflow: hidden;
  }

  /* Pink racing stripe — drives across the top of the menu */
  .racing-stripe {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), var(--accent), transparent);
    animation: stripe-drive 0.6s ease-out forwards;
    transform-origin: left;
  }

  @keyframes stripe-drive {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  /* ── Nav links ──────────────────────────────────────── */
  .mobile-nav-link {
    text-decoration: none;
    display: block;
    padding: 0;
  }

  .link-content {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.875rem 0.25rem;
    transition: all 0.2s;
  }

  :global(.link-chevron) {
    color: var(--accent);
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .link-label {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-secondary);
    transition: all 0.2s;
    font-family: 'Barlow Condensed', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .mobile-nav-link:hover .link-label,
  .mobile-nav-link.active .link-label {
    color: var(--text-primary);
  }

  .mobile-nav-link:hover :global(.link-chevron),
  .mobile-nav-link.active :global(.link-chevron) {
    opacity: 1;
    transform: translateX(0);
  }

  .mobile-nav-link.active .link-label {
    color: var(--accent-text);
  }

  /* ── Separator with drive-across animation ─────────── */
  .separator {
    position: relative;
    height: 1px;
    overflow: hidden;
  }

  .separator-line {
    position: absolute;
    inset: 0;
    background: var(--border);
  }

  .separator-drive {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--accent) 15%,
      var(--accent) 45%,
      rgba(237, 12, 133, 0.3) 70%,
      transparent 100%
    );
    transform: translateX(-100%);
    animation: drive-across 0.5s ease-out forwards;
  }

  @keyframes drive-across {
    from { transform: translateX(-100%); }
    to   { transform: translateX(100%); }
  }

  /* ── CTA section ──────────────────────────────────── */
  .cta-section {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding-top: 1rem;
    margin-top: 0.5rem;
  }

  .mobile-cta-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
    text-align: center;
  }

  .cta-login {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
  }

  .cta-login:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }

  .cta-dashboard {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
  }

  .cta-dashboard:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }

  .cta-waitlist {
    background: #d80b7a; /* Matches btn-primary — 4.94:1 with white (WCAG AA) */
    border: 1px solid #d80b7a;
    color: white;
    position: relative;
    overflow: hidden;
  }

  /* Shimmer sweep on the waitlist button */
  .cta-waitlist::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent
    );
    animation: btn-shimmer 2s ease-in-out 0.5s infinite;
  }

  @keyframes btn-shimmer {
    0%, 100% { left: -100%; }
    50%      { left: 140%; }
  }

  .cta-waitlist:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 20px rgba(237, 12, 133, 0.35);
  }
</style>
