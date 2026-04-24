# Wrench Club

**A gym membership for car enthusiasts.**

Wrench Club is a members-only DIY auto shop in Grand Rapids, Michigan — the
first of its kind in West Michigan. Members book a hoist or flat bay by the
hour, roll up their sleeves, and use a professionally-outfitted space without
having to buy a garage. Oil changes, engine swaps, restoration projects,
weekend wheel rotations — whatever you're working on, there's a bay and a
tool for it.

This repo is the website and member portal powering
[wrenchclub.com](https://wrenchclub.com) — waitlist, bay reservations,
payment-integrated booking, member portal, admin tools.

---

- **Live site**: [wrenchclub.com](https://wrenchclub.com)
- **Staging** *(safe to break — runs on Square sandbox, no real charges)*:
  [thewrench.club](https://thewrench.club)

## What the app does

**For prospective members** — the marketing site: who we are, what's in the
facility, what it costs, and a waitlist form so they're first in line when
booking opens.

**For members** — log in, see today's availability across every bay, pick a
type (Flat / Hoist), pick hours, pay, book. Upcoming bookings show in the
dashboard, cancellable within 24h for a full refund.

**For the team** — admin panel with waitlist and member tables. Square is the
data source of truth: merch added in the Square Dashboard appears on the
store within a minute, no deploy needed. Railway + Resend + Cloudflare
handle the plumbing.

## Under the hood

SvelteKit SSR app. Svelte 5 runes. Tailwind v4. TypeScript throughout. Bun
for dev and build, Node for runtime. [Lucia v3](https://lucia-auth.com)
session cookies against a lean SQLite/Drizzle schema (sessions + waitlist
only — all business data lives in Square). [Square
APIs](https://developer.squareup.com) for customers, bookings, catalog,
orders, payments, cards, subscriptions.
[Resend](https://resend.com) for transactional email. Deployed on
[Railway](https://railway.app), fronted by Cloudflare.

## Highlights worth calling out

- **Atomic Order → Payment → Booking** — Square has no conflict detection at
  `bookings.create`, so the flow pre-checks `searchAvailability`, auto-refunds
  if the booking fails after payment succeeds, and tags each booking's
  `customerNote` with the payment ID so cancel-with-refund can find it.
- **Feature flags at every boundary** — e.g. `PUBLIC_HIDE_DETAIL_BAY=true`
  cascades through UI, SEO meta, JSON-LD structured data, and email
  templates in one env-var flip (and back).
- **Env-switched bay roster** — `BAYS` and `BAY_VARIATIONS` swap between
  production (6 bays) and Square sandbox (5 bays) automatically based on
  `SQUARE_ENVIRONMENT`, so staging can run end-to-end against sandbox
  without touching real customer data.
- **Pre-launch allowlist** — `AUTH_ALLOWLIST` locks registration/login to
  specific emails during soft launch; hooks invalidate any non-allowed
  session on the next request.
- **Dark-first, WCAG-AA aware** — custom tokens tuned for real contrast
  ratios; Lighthouse 95+ on accessibility, 100 on SEO.

---

## Quickstart (Wrench Club team)

You've got a fresh checkout, you want to run the app locally against
staging's Square sandbox. Ask in Slack / DM for the current `.env` values —
you don't need to set up Square yourself; we already did.

```bash
git clone https://github.com/tribixbite/wrench.git
cd wrench
bun install
cp .env.example .env
# Paste the values someone shares with you into .env
bun run dev
```

Open http://localhost:5173. You're in.

### Common commands

```bash
bun run dev           # Dev server with HMR (localhost:5173)
bun run build         # Production build
bun run preview       # Preview the production build locally
bunx playwright test  # Run the e2e suite against staging
```

### Need to do something specific?

- **Day-to-day tasks** (adding merch, refunds, taking a bay offline, toggling
  Detail Bay visibility, reading logs): see [`docs/OPERATIONS.md`](docs/OPERATIONS.md).
- **Forking/templating this for another business**: see
  [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — full walkthrough of
  provisioning your own Square app, wiring Resend, setting up Railway.

## Project layout

```
src/
  hooks.server.ts             # Session, rate limiting, allowlist gate
  lib/
    features.ts               # PUBLIC_* feature flags
    server/                   # Square client, auth, email, DB
    components/{layout,marketing,app}/
  routes/
    +page.svelte              # Landing
    pricing/, membership/, about/, store/
    auth/{register,login,forgot-password,reset,verify,logout}/
    app/{dashboard,reservations,profile,admin}/
    api/                      # JSON endpoints + Square webhooks
scripts/                      # Square one-time setup + probes
e2e/                          # Playwright suites
docs/
  OPERATIONS.md               # Staff-facing runbook
  DEVELOPMENT.md              # Fork/template setup
```

## Deploy

Railway auto-deploys every push to `main`. Two environments share the same
repo:

- **production** → `wrenchclub.com` (prod Square, prod Resend)
- **staging** → `thewrench.club` (Square sandbox, sandbox Resend)

Env vars are managed in the Railway dashboard, per environment.

## Tests

Playwright e2e tests run against the deployed **staging** site by default
(`TEST_BASE_URL=https://thewrench.club`). CI runs the suite on every push via
[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml), with a
wait-for-deploy step so tests don't race Railway.

```bash
bunx playwright test                   # full suite against staging
bunx playwright test auth              # one spec file
bunx playwright test --headed          # watch the browser
TEST_BASE_URL=http://localhost:5173 bunx playwright test  # against local dev
```

## Contributing

Built for a specific business; outside contributions aren't expected. But
security reports, obvious bug fixes, and thoughtful PRs are welcome — please
open an issue to discuss before submitting a PR.

## License

MIT — see [LICENSE](LICENSE).

---

Built for the Wrench Club in Grand Rapids, MI.
