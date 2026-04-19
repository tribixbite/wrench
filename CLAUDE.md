# Wrench Club — Website

## Project Overview
SvelteKit SSR website for Wrench Club, a membership-based DIY auto shop at 522 Stocking Ave NW, Grand Rapids, MI. Handles marketing/waitlist (Phase 1), member portal with bay reservations (Phase 2), and growth features (Phase 3). Square POS is the primary data layer for all business entities.

Full spec and roadmap: `SPEC.md`

## Tech Stack
- **Runtime**: Bun (dev + build), Node for any native module edge cases
- **Framework**: SvelteKit (SSR), Svelte 5 runes ($state, $derived, $props, $effect)
- **Styling**: Tailwind CSS v4 (CSS-first, `@import "tailwindcss"` — no config file)
- **Components**: shadcn-svelte + Bits UI (headless primitives)
- **Language**: TypeScript throughout
- **Data layer**: Square APIs (Customers, Catalog, Bookings, Orders, Subscriptions)
- **Auth**: Lucia v3 (session cookies via SvelteKit hooks)
- **Session DB**: Turso (LibSQL) via Drizzle ORM — sessions + waitlist only
- **Hosting**: TBD (Vercel or Fly.io)

## Branding
- **Brand color**: #ED0C85 (hot pink)
- **Theme**: Dark-first, `[data-theme="light"]` override
- **Logo**: `assets/logo.png` (2500x632 RGBA), `assets/logo.webp`
- **Tone**: Automotive enthusiasm, community-first, not corporate

## Square Integration
Square is the source of truth for all business data. The app DB is intentionally thin (auth sessions only). All business entities — customers, subscriptions, bookings, catalog, orders, gift cards — live in Square and are queried via their APIs.

- **Auth note**: Square is NOT the auth provider. App uses Lucia sessions. `squareCustomerId` on the local user record links to Square Customers API.
- **Webhook endpoint**: `/api/webhooks/square` — validates Square signature, drives real-time UI updates
- **Credentials**: Square POS account exists (see handoff.txt for login). Set up Square Developer sandbox for dev/test.

## Key Files
- `SPEC.md` — full requirements, page specs, roadmap, open questions
- `assets/` — logo (PNG + WebP), founder photos, team-cars hero image
- `handoff.txt` — original founder handoff document

## Photo Assets
| File | Subject |
|------|---------|
| `assets/coleman.jpg` | Coleman Brook + BMW M760xi |
| `assets/derick.jpg` | Derick Brower + Audi RS6 |
| `assets/mike.jpg` | Mike Zandstra + Chevy Suburban |
| `assets/adrian.jpg` | Adrian Hoogerheide + Ford F350 |
| `assets/bmw.jpg` | M760xi solo at facility |
| `assets/team-cars.jpg` | All 4 cars at facility entrance (hero candidate) |
| `assets/logo.png` | Logo with transparency |

## Commands
```bash
bun run dev        # SvelteKit dev server
bun run build      # Production build
bun run check      # svelte-check (typecheck)
bun run preview    # Preview production build
```

## Architecture
- Public marketing pages at root (`/`, `/pricing`, `/membership`, `/about`, `/store`)
- Auth routes at `/auth/` (login, register, logout)
- Authenticated member routes at `/app/` (dashboard, reservations, profile, bays)
- Admin routes at `/app/admin/`
- API routes at `/api/` (Square webhooks, SSE for live bay status)
- Server load functions fetch from Square APIs — no client-side API keys
- Form actions for mutations (progressive enhancement, works without JS)

## Skills
- `svelte-app` — generic SvelteKit SSR app build directive (auth, payments, real-time)
- `svelte-landing-page` — Astro + Svelte islands for static marketing sites (NOT this project)
- `svelte-filter-spa` — SvelteKit SPA for data filter apps (NOT this project)

## Don't
- Don't duplicate Square data in a local DB — query APIs directly
- Don't expose Square API keys to the client — all Square calls go through server routes
- Don't use legacy Svelte syntax (`$:`, `export let`)
- Don't use `tailwind.config.js` — Tailwind v4 is CSS-only
- Don't use stock photography — all imagery from founder-provided photos
- Don't invent content — use copy from wrenchclub.com and handoff.txt
- Don't call `square.bookings.create()` without a fresh `searchAvailability` pre-check — Square has no conflict detection at create time. See `src/routes/api/bookings/create/+server.ts` for the pattern.
- Don't break the `[order:X|payment:Y]` customer-note tag format — it's the only link between a booking and its payment for refund-on-cancel. Change it in both `bookings/create` and `bookings/cancel` together.
