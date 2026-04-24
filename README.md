# Wrench Club

Website and member portal for [Wrench Club](https://wrenchclub.com) — a
membership-based DIY auto shop at 522 Stocking Ave NW, Grand Rapids, MI.
Members rent hoist and flat bays by the hour, with a community clubhouse,
tool library, and events.

Built as a SvelteKit SSR app with Square as the source of truth for all
business data (customers, bookings, catalog, orders, payments). The local
database exists only for auth sessions and the pre-launch waitlist.

- **Production**: https://wrenchclub.com
- **Staging** *(Square sandbox — safe to break)*: https://thewrench.club
- **Status**: Phase 1 & Phase 2 shipped — marketing site, auth, member portal
  with live bay reservations + payment-integrated booking. Phase 3 (event
  calendar, racing-sim leaderboards, PWA) is a roadmap item.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | SvelteKit (SSR, `@sveltejs/adapter-node`) |
| UI | Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`) |
| Styling | Tailwind CSS v4 (CSS-first, no config file) + shadcn-svelte primitives |
| Language | TypeScript |
| Runtime | [Bun](https://bun.sh) (dev + build); Node runs the built server |
| Auth | [Lucia v3](https://lucia-auth.com) session cookies |
| Local DB | SQLite via Drizzle ORM — sessions + waitlist only |
| Payments + business data | [Square APIs](https://developer.squareup.com) (Customers, Bookings, Catalog, Orders, Payments, Cards, Subscriptions) |
| Transactional email | [Resend](https://resend.com) |
| Hosting | [Railway](https://railway.app) (Metal tier, persistent volume) |
| DNS + CDN | Cloudflare (proxied) |
| Tests | Playwright (e2e), Vitest (unit) |

## Features

**Public marketing** — `/`, `/pricing`, `/membership`, `/about`, `/store`.
Prerendered landing page. Live Square catalog drives the store.

**Auth** — `/auth/register`, `/auth/login`, `/auth/forgot-password`,
`/auth/reset/[token]`, `/auth/verify/[token]`, `/auth/logout`. Argon2id
password hashing. Rate-limited.

**Member portal** (`/app/*`):
- `/app/dashboard` — upcoming bookings + stats, live bay grid
- `/app/reservations` — bay booking: bay-type picker, hour selector, date,
  availability search, payment step (Square Web Payments SDK iframe), create,
  cancel-with-refund
- `/app/profile` — identity card + theme toggle (auto / dark / light)
- `/app/admin` — waitlist + members tables (admin-only)

**Payment-integrated booking** — atomic Order → Payment → Booking chain.
`searchAvailability` pre-check before `bookings.create` closes the window
where Square would allow double-booking. Auto-refund if booking creation
fails after payment succeeds. 24-hour cancellation refunds the original
charge.

**Feature flags**:
- `PUBLIC_HIDE_DETAIL_BAY=true` — hides every mention of the Detail Bay while
  car-wash zoning is pending (UI, SEO copy, JSON-LD, email templates)
- `AUTH_ALLOWLIST=a@b.com,c@d.com` — pre-launch lock on who can register/log in

**Transactional email** via Resend: waitlist confirmation, registration
welcome, password reset, email verification.

**Observability**: structured errors surface via `extractErrorMessage()`
helper; Square webhooks validated by HMAC signature; rate-limited auth
endpoints; session-invalidation on allowlist changes.

## Quick start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0 (install: `curl -fsSL https://bun.sh/install | bash`)
- A Square Sandbox account (free — https://developer.squareup.com)
- A Resend account with a verified sending domain *(optional — emails silently
  no-op without `RESEND_API_KEY`)*

### Local setup

```bash
git clone https://github.com/tribixbite/wrench.git
cd wrench
bun install
cp .env.example .env
# Edit .env and fill in your Square sandbox credentials + session secret
bun run dev
```

Open http://localhost:5173. Register an account, log in, browse.

### Environment variables

Copy `.env.example` and set these (all documented in the file):

| Var | Purpose |
|---|---|
| `PUBLIC_SITE_URL` | Canonical origin (SEO, emails). Defaults to `https://thewrench.club` for safety. |
| `PUBLIC_SUPPORT_EMAIL` | Shown in footer + email footers |
| `ORIGIN` | Server-side absolute URL used to build auth links |
| `SESSION_SECRET` | Random 32+ char string; signs session cookies |
| `DATABASE_URL` | `file:./wrench.db` for local dev; Railway volume path in prod |
| `SQUARE_ENVIRONMENT` | `sandbox` or `production` (defaults to `production` if unset) |
| `SANDBOX_SECRET` | Square Sandbox access token (`EAAAl…`) |
| `SANDBOX_APP_ID` | Square Sandbox App ID (`sandbox-sq0idb-…`) |
| `SQUARE_SANDBOX_LOCATION_ID` | Square Sandbox location ID |
| `PROD_ACCESS_TOKEN` | Square Production access token (prod only) |
| `PROD_APP_ID` | Square Production App ID (prod only) |
| `SQUARE_LOCATION_ID` | Square Production location ID (prod only) |
| `SQUARE_WEBHOOK_SECRET` | HMAC signing secret for `/api/webhooks/square` |
| `RESEND_API_KEY` | Transactional email key |
| `EMAIL_FROM` | `Wrench Club <hello@send.example.com>` — sender must be verified in Resend |
| `AUTH_ALLOWLIST` | Comma-separated emails; empty = open registration |
| `PUBLIC_HIDE_DETAIL_BAY` | `true` to suppress Detail Bay everywhere |

Public vars (`PUBLIC_*`) are read on both server and client via
`$env/dynamic/public`; everything else is server-only via
`$env/dynamic/private`. See [`src/lib/features.ts`](src/lib/features.ts) for
the flag pattern.

### Available scripts

```bash
bun run dev          # Dev server with HMR at localhost:5173
bun run build        # Production build (Node server bundle)
bun run preview      # Serve the production build locally
bun run check        # svelte-check (on most platforms — see note below)
bun run test         # Vitest unit suite
bunx playwright test # Full Playwright e2e suite (targets TEST_BASE_URL)
```

> **Termux users**: `bun run check` crashes esbuild workers with an
> environment-specific IPC error. Use `bunx tsc --noEmit --skipLibCheck`
> instead. See `CLAUDE.md` for the full list of platform quirks.

### Square one-time setup

The bay-booking system requires specific catalog items, team members, and
Dashboard toggles. One-shot scripts in `scripts/` handle catalog + team
member creation; a manual Dashboard step is still required for the
"Bookable online" toggle (Square has no API for this).

```bash
# Production Square account
SQUARE_ENVIRONMENT=production bun run scripts/square-rebuild-bookings.ts

# Sandbox — 5 pre-existing TMs, we reuse them
SQUARE_ENVIRONMENT=sandbox bun run scripts/square-setup-sandbox-bookings.ts
```

After either, open Square Dashboard → Appointments → Staff → for each bay
team member flip **"Bookable online"** (not the generic "Bookable" toggle)
and save. Verify with `GET /v2/bookings/team-member-booking-profiles` or by
running a test booking via `bun run scripts/square-booking-tests.ts`.

## Architecture notes

### Why Square is the database

Customers, subscriptions, bookings, catalog, orders, gift cards — all live
in Square. The local DB is intentionally thin (sessions + waitlist). This
trades some query flexibility for zero duplication and Coleman-editable
data: he adds a new merch SKU in the Square Dashboard and it shows up on
`/store` within a minute. No deploy required.

### Booking flow (`src/routes/api/bookings/create/+server.ts`)

1. Validate input (bay, hours, date, card source)
2. `searchAvailability` pre-check — Square has no conflict detection at
   `bookings.create`, so this is our last line of defence
3. `orders.create` with the `catalogObjectId` → Square auto-prices from the
   catalog variation
4. Optional `cards.create` if `saveCard: true`
5. `payments.create({ autocomplete: true })` against the order
6. `bookings.create` with a `customerNote` tagged `[order:X|payment:Y]`
   (the only link between a booking and its payment, since Square's Booking
   object doesn't carry an orderId)
7. If step 6 fails after step 5 succeeded: auto-issue a refund

### Cancellation (`src/routes/api/bookings/cancel/+server.ts`)

1. Re-fetch the booking, verify `customerId === user.squareCustomerId`
2. Enforce 24h cutoff
3. `bookings.cancel` via Square
4. Parse the `[order:X|payment:Y]` tag to locate the payment
5. `refunds.refundPayment` for the captured amount

### Feature flags at boundaries

`src/lib/features.ts` reads `PUBLIC_*` flags once and exports typed
constants. Every surface that mentions a flagged feature (BAYS array, SEO
meta, JSON-LD structured data, email templates, reservation picker)
imports from there. Toggle on Railway → everything updates on the next
deploy.

### Project structure

```
src/
  app.html                    # SSR HTML shell
  hooks.server.ts             # DB init, rate limiting, session validation, allowlist gate
  lib/
    features.ts               # PUBLIC_HIDE_DETAIL_BAY etc.
    server/
      square.ts               # BAYS, variation IDs, Square client — env-switched
      auth.ts, auth-allowlist.ts
      email.ts                # Resend templates
      schema.ts, db.ts        # Drizzle ORM
      openapi.ts              # Auto-generated API spec
    components/
      layout/                 # Header, Footer, SEO, StructuredData
      marketing/              # WaitlistForm
      app/                    # PaymentStep, BayGrid, BackLink
  routes/
    +page.svelte              # Landing
    pricing/, membership/, about/, store/
    auth/{register,login,forgot-password,reset/[token],verify/[token],logout}/
    app/{dashboard,reservations,profile,admin}/
    api/
      waitlist/
      bookings/{availability,create,cancel,list}/
      payments/cards/
      webhooks/square/
      bays/stream/            # SSE for live bay status (currently mock)
      catalog/, resend-verification/
scripts/
  square-rebuild-bookings.ts        # Creates prod catalog + team members
  square-setup-sandbox-bookings.ts  # Uses pre-existing sandbox TMs
  square-booking-tests.ts           # End-to-end Square API tests
  square-probe.ts                   # Read-only catalog inspector
  square-bookings.json              # Prod ID manifest
  square-bookings.sandbox.json      # Sandbox ID manifest
e2e/                                # Playwright suites
docs/
  OPERATIONS.md                     # Day-to-day guide for staff/founders
```

## Testing

Playwright e2e tests run against the deployed staging site by default
(`TEST_BASE_URL=https://thewrench.club`). The suite covers auth, waitlist,
public pages, dashboard, reservations, and API smoke tests.

```bash
bunx playwright test              # Full suite
bunx playwright test auth         # One spec file
bunx playwright test --headed     # Watch browser
```

CI runs the same suite on every push via `.github/workflows/e2e.yml`. Tests
that hit the live site are wrapped in a `gotoOrSkipIfCloudflare` helper —
Cloudflare occasionally returns 502 against CI runner IPs and we don't want
that noise in the dashboard.

## Deployment

Railway auto-deploys on every push to `main`. Two environments share the
same GitHub repo:

- **production** → `wrenchclub.com` (prod Square, Resend `send.wrenchclub.com`)
- **staging** → `thewrench.club` (sandbox Square, `thewrench.club` Resend)

Env vars are set per-environment in the Railway dashboard. See
[`docs/OPERATIONS.md`](docs/OPERATIONS.md) for specific tasks.

## Contributing

This is the codebase for a specific business; outside contributions aren't
expected. That said, if you spot a security issue or obvious bug, open an
issue — PRs are welcome but please open an issue first to discuss scope.

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built by [tribixbite](https://github.com/tribixbite) for the Wrench Club
founding team — Coleman Brook, Derick Brower, Mike Zandstra, and Adrian
Hoogerheide.
