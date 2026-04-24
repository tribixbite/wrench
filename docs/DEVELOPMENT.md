# Wrench Club — Development & Fork/Template Setup

Forking this repo to build something similar for another business? Or just
want a clean local dev environment against your own Square sandbox instead of
piggybacking on ours? This is the full provisioning walkthrough.

If you're on the Wrench Club team and just need to `bun run dev`, the
[README quickstart](../README.md#quickstart-wrench-club-team) is shorter.

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A Square account — use a Sandbox account for development:
  https://developer.squareup.com/console/en/sandbox-test-accounts
- A Resend account with a verified sending domain *(optional for local dev —
  the `send()` function silently no-ops if `RESEND_API_KEY` is unset)*
- GitHub account (if you want to deploy via Railway)

## 1. Get the code running

```bash
git clone https://github.com/tribixbite/wrench.git
cd wrench
bun install
cp .env.example .env
```

Open `.env` and fill in the bare minimum to boot:

```
ORIGIN=http://localhost:5173
PUBLIC_SITE_URL=http://localhost:5173
SESSION_SECRET=pick-any-32-char-random-string
DATABASE_URL=file:./wrench.db
```

Start it:

```bash
bun run dev
```

http://localhost:5173 should load — marketing pages work without any Square
setup. Auth works but can't create Square customers yet (non-fatal — it
logs and proceeds).

## 2. Square Sandbox setup

### 2a. Create an app

https://developer.squareup.com/apps → **Create app** → name it. You now have
an **Application ID** (starts with `sandbox-sq0idb-`) and an **Access
Token** (starts with `EAAAl…`) in the **Sandbox** tab.

Grab the Sandbox **Location ID** from https://developer.squareup.com/console/en/locations
— it's the top row.

Add these to `.env`:

```
SQUARE_ENVIRONMENT=sandbox
SANDBOX_APP_ID=sandbox-sq0idb-...
SANDBOX_SECRET=EAAAl...
SQUARE_SANDBOX_LOCATION_ID=L...
```

### 2b. Provision bays + catalog

Two scripts in `scripts/` handle the Square-side setup. Pick one based on
whether your sandbox already has team members:

**Fresh sandbox** (no pre-existing bay team members):

```bash
bun run scripts/square-rebuild-bookings.ts
```

This creates:
- 3 `APPOINTMENTS_SERVICE` catalog items (Flat Bay, Hoist Bay, Detail Bay)
- 8 variations each (1-8 hour, $25/$30/$35 per hour linear pricing)
- 6 team members tagged as bay resources
- Writes `scripts/square-bookings.json` with all the new IDs

**Your sandbox already has some team members you want to reuse**:

Edit `scripts/square-setup-sandbox-bookings.ts` — update the `baySpecs`
array at the top with your existing team member IDs. Then run:

```bash
bun run scripts/square-setup-sandbox-bookings.ts
```

### 2c. Enable "Bookable online" (manual — no API exists for this)

Square's API has no write endpoint for team-member booking profiles as of
API version 2026-01-22. You have to toggle this in the Dashboard.

1. Open https://app.squareupsandbox.com/dashboard/team
2. Click each bay team member
3. **Services** tab → restrict to the matching bay type (Flat bays → Flat
   Bay only, Hoist → Hoist only, etc.)
4. **Overview** → Appointments → toggle **"Bookable online"** to **on** (not
   the generic "Bookable" — specifically "Bookable online")
5. Save

Verify the toggle worked:

```bash
bun run scripts/square-probe.ts
```

You should see `isBookable=true` for each bay.

### 2d. (Optional) Run the end-to-end Square tests

```bash
bun run scripts/square-booking-tests.ts
```

Creates 3 real test bookings tagged `WC-CLAUDE-TEST`, verifies conflict
detection, cancels them when done. Safe to run against sandbox — no real
charges. Never run against production.

### 2e. Update the bay constants in the app

Look at the manifest the setup script wrote (`scripts/square-bookings.json`
or `.sandbox.json`) and copy the IDs into `src/lib/server/square.ts` —
specifically `BAYS`, `BAY_VARIATIONS`. If you're using the sandbox setup
script, the sandbox values are already wired there; you only need to edit
them if your team-member layout differs from the default 2-hoist-2-flat-1-detail.

## 3. Resend (email)

Skip this if you're fine with email silently no-opping in dev.

1. Sign up at https://resend.com
2. Add and verify a sending domain — use a subdomain like
   `send.yourdomain.com` rather than the apex, so DKIM records don't
   collide with any existing email provider
3. Create an API key
4. Add to `.env`:

```
RESEND_API_KEY=re_XXXXXXXXX
EMAIL_FROM=Your Brand <hello@send.yourdomain.com>
```

Verify with a waitlist signup — you should receive the confirmation email.

## 4. Deploy to Railway

Two environments — staging and production — from the same repo.

### 4a. Production environment

1. Railway → New Project → Deploy from GitHub repo → pick your fork
2. Settings → Environment — rename the default environment to `production`
3. Variables — set these (with your real production Square values):

```
SQUARE_ENVIRONMENT=production
PROD_ACCESS_TOKEN=EAAAl... (from Square Production account, not sandbox)
PROD_APP_ID=sq0idp-...
SQUARE_LOCATION_ID=L... (your production location)
SQUARE_WEBHOOK_SECRET=(generate in Square Dashboard → Webhooks)

RESEND_API_KEY=re_... (production key)
EMAIL_FROM=Your Brand <hello@send.yourdomain.com>

ORIGIN=https://yourdomain.com
PUBLIC_SITE_URL=https://yourdomain.com
PUBLIC_SUPPORT_EMAIL=info@yourdomain.com

SESSION_SECRET=(generate a fresh random 32+ char string)
DATABASE_URL=file:/app/db/wrench.db  # Railway persistent volume
```

4. Settings → Networking → **Custom Domain** → add your production domain →
   Railway gives you a CNAME target → point Cloudflare at it (CNAME
   flattening at apex works on Cloudflare free tier)
5. First deploy happens automatically on next push to `main`

### 4b. Staging environment

In the same Railway project:

1. Environments → **New Environment** → name it `staging`
2. Duplicate variables from `production`, then change:

```
SQUARE_ENVIRONMENT=sandbox
SANDBOX_SECRET=EAAAl... (sandbox token)
SANDBOX_APP_ID=sandbox-sq0idb-...
SQUARE_SANDBOX_LOCATION_ID=L...

ORIGIN=https://staging.yourdomain.com
PUBLIC_SITE_URL=https://staging.yourdomain.com
```

You don't need a separate RESEND_API_KEY, but if you want cleaner email
separation, use a different Resend API key (or even a different verified
domain).

3. Networking → bind a staging domain (or use the Railway-provided
   `*.up.railway.app` URL)

### 4c. Webhook endpoint

If you want Square to push real-time events (bookings updated, payments
captured, subscriptions renewed):

1. Square Dashboard → Developer → **Webhooks** → **Add subscription**
2. Notification URL: `https://yourdomain.com/api/webhooks/square`
3. Copy the **Signature Key** → paste into Railway as `SQUARE_WEBHOOK_SECRET`
4. Pick event types you care about (start with `booking.updated`,
   `payment.updated`, `subscription.updated`)

The endpoint is wired to HMAC-validate every request; if the signature
doesn't match, it returns 401 without processing.

## 5. Feature flags

| Var | Purpose |
|---|---|
| `PUBLIC_HIDE_DETAIL_BAY=true` | Hide every mention of the Detail Bay (UI, SEO, emails) — useful if zoning or licensing is pending for that type |
| `AUTH_ALLOWLIST=a@b.com,c@d.com` | Pre-launch lockdown: only listed emails can register/login. Empty = open registration. |

## 6. Running tests

```bash
# Unit (Vitest)
bun run test

# End-to-end (Playwright) — targets TEST_BASE_URL (default staging)
bunx playwright test

# Against local dev server instead:
TEST_BASE_URL=http://localhost:5173 bunx playwright test

# One spec only:
bunx playwright test auth
```

CI config is in [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml).
It waits for Railway to finish deploying before running tests against
staging, so you don't have to worry about a push-time race.

## 7. Termux quirks

If you're developing on Termux (Android), two things bite:

- **`bun run check` crashes** esbuild workers with a platform-specific IPC
  error that makes every `.svelte` file look broken. Use `bunx tsc --noEmit
  --skipLibCheck` for TS checking. Template/syntax issues surface via
  `bun run build`.
- **`/tmp/` isn't writable** on Termux — use `$TMPDIR` (resolves to
  `$PREFIX/tmp`). Node's `os.tmpdir()` returns the right thing, but any
  script that hardcodes `/tmp/` will fail with EACCES.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `[email] RESEND_API_KEY not set` log on every signup | Expected in dev without Resend configured — emails silently no-op. Set `RESEND_API_KEY` to enable. |
| Bookings search returns "Search did not find a team member" | "Bookable online" isn't toggled on — see step 2c. |
| Register hangs for 120s in tests | Square customer create is slow/stuck. Handler has an 8s timeout that should proceed past it, but if your sandbox is being rate-limited, the real test runs may still be affected. |
| `INVALID_EMAIL_ADDRESS` from Square when creating team members | Don't use `.test` or `.local` TLDs — Square rejects them. Use a real domain you control (even if the mailbox doesn't exist). |
| `env.PUBLIC_FOO is undefined` on the server | You imported from `$env/dynamic/private`. `PUBLIC_*` vars are filtered out of `/private` — use `$env/dynamic/public` instead, or both namespaces. See `src/lib/server/email.ts` for the pattern. |
