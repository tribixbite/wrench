<script lang="ts">
  import { Facebook, Mail, MapPin, ExternalLink } from 'lucide-svelte';
  import { env } from '$env/dynamic/public';

  const supportEmail = env.PUBLIC_SUPPORT_EMAIL || 'info@thewrench.club';
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/membership', label: 'Membership' },
    { href: '/about', label: 'About' },
    { href: '/store', label: 'Shop' }
  ];
</script>

<footer>
  <div class="footer-top">
    <div class="container mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
      <!-- Brand -->
      <div class="col-span-1">
        <a href="/">
          <img src="/logo.webp" alt="Wrench Club" class="h-8 w-auto mb-4" width="500" height="126" />
        </a>
        <p class="text-sm leading-relaxed" style="color: var(--text-secondary)">
          West Michigan's premier do-it-yourself auto shop. Members-only clubhouse,
          service bay rentals, and a community built for gearheads.
        </p>
        <p class="text-xs mt-4 font-medium" style="color: var(--accent-text)">Coming 2026</p>
      </div>

      <!-- Quick Links -->
      <div>
        <h3 class="text-xs font-semibold uppercase tracking-widest mb-5" style="color: var(--text-muted)">
          Quick Links
        </h3>
        <nav class="flex flex-col gap-2.5">
          {#each navLinks as link}
            <a
              href={link.href}
              class="text-sm hover:text-white transition-colors"
              style="color: var(--text-secondary)"
            >
              {link.label}
            </a>
          {/each}
          <a
            href="/auth/login"
            class="text-sm hover:text-white transition-colors"
            style="color: var(--text-secondary)"
          >
            Member Login
          </a>
        </nav>
      </div>

      <!-- Contact -->
      <div>
        <h3 class="text-xs font-semibold uppercase tracking-widest mb-5" style="color: var(--text-muted)">
          Find Us
        </h3>
        <div class="flex flex-col gap-4">
          <a
            href="https://maps.google.com/?q=522+Stocking+Ave+NW+Grand+Rapids+MI"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-start gap-3 text-sm group"
            style="color: var(--text-secondary)"
          >
            <MapPin size={16} class="mt-0.5 shrink-0 group-hover:text-[--accent] transition-colors" style="color: var(--text-muted)" />
            <span class="group-hover:text-white transition-colors">
              522 Stocking Ave NW<br />
              Grand Rapids, MI
            </span>
          </a>

          <a
            href="mailto:{supportEmail}"
            class="flex items-center gap-3 text-sm group"
            style="color: var(--text-secondary)"
          >
            <Mail size={16} class="shrink-0" style="color: var(--text-muted)" />
            <span class="group-hover:text-white transition-colors">{supportEmail}</span>
          </a>

          <a
            href="https://facebook.com/wrenchclubb"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 text-sm group"
            style="color: var(--text-secondary)"
          >
            <Facebook size={16} class="shrink-0" style="color: var(--text-muted)" />
            <span class="group-hover:text-white transition-colors">facebook.com/wrenchclubb</span>
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom bar -->
  <div class="footer-bottom">
    <div class="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p class="text-xs" style="color: var(--text-muted)">
        © {currentYear} Wrench Club, LLC. All rights reserved.
      </p>
      <p class="text-xs" style="color: var(--text-muted)">
        Built for gearheads, by gearheads — Grand Rapids, MI
      </p>
    </div>
  </div>

  <!-- Credit line -->
  <div class="footer-credit">
    <p class="text-xs text-center py-3" style="color: var(--text-muted)">
      🔧 in Grand Rapids by
      <a
        href="https://tribixbite.com/wrench"
        target="_blank"
        rel="noopener noreferrer"
        class="credit-link"
      >tribixbite</a>
    </p>
  </div>
</footer>

<style>
  footer {
    background: #0d0d0d;
    border-top: 1px solid var(--border);
  }

  .footer-bottom {
    border-top: 1px solid var(--border);
  }

  .footer-credit {
    border-top: 1px solid var(--border);
  }

  .credit-link {
    color: var(--text-secondary);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--text-muted) 40%, transparent);
    text-underline-offset: 2px;
    transition: color 0.15s, text-decoration-color 0.15s;
  }

  .credit-link:hover {
    color: var(--accent-text);
    text-decoration-color: currentColor;
  }
</style>
