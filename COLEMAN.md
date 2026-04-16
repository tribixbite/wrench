# Wrench Club — Project Status for Coleman

**Site**: https://thewrench.club
**Repo**: github.com/tribixbite/wrench (private)
**Last updated**: April 16, 2026

---

## What's Built

### Public Marketing (5 pages)
| Page | URL | Status |
|------|-----|--------|
| Landing | https://thewrench.club | Hero, features, waitlist form, footer |
| Pricing | https://thewrench.club/pricing | Bay types, rates (TBD placeholders), membership tiers |
| Membership | https://thewrench.club/membership | Benefits, philosophy, founder quotes |
| About | https://thewrench.club/about | Founder bios (all 4), facility location, map |
| Shop | https://thewrench.club/store | Live Square catalog (bay prices + merch placeholders) |

### Auth System (fully functional)
| Page | URL | Status |
|------|-----|--------|
| Register | /auth/register | Name, email, password, waiver checkbox |
| Login | /auth/login | Email/password, "forgot password" link |
| Forgot Password | /auth/forgot-password | Sends reset link (1hr expiry) |
| Password Reset | /auth/reset/[token] | New password form, token validation |
| Email Verification | /auth/verify/[token] | Verifies email address |
| Logout | POST /auth/logout | Clears session |

- Rate limiting on all auth endpoints (10 attempts per IP / 15 min)
- Square Customer record created automatically at registration
- Session-based auth (Lucia v3, cookie-based, no JWTs)
- Email verification with resend capability

### Member Portal (4 pages, login required)
| Page | URL | Status |
|------|-----|--------|
| Dashboard | /app/dashboard | Stats, live bay grid (SSE), booking CTA, location card |
| Reservations | /app/reservations | Bay filter (1-5), duration (90min/$40, 3hr/$60), date picker, time slot grid, booking confirmation |
| Profile | /app/profile | View name, email, role (editing at launch) |
| Admin | /app/admin | Waitlist table + members table (admin-only, role-guarded) |

### API Endpoints (10 routes)
| Endpoint | Purpose | Status |
|----------|---------|--------|
| POST /api/waitlist | Add email to waitlist (dedupes, sends confirmation) | Live |
| POST /api/bookings/availability | Search Square for open time slots | Live |
| POST /api/bookings/create | Create a bay booking in Square | Live |
| GET /api/bookings/list | User's upcoming reservations | Live |
| GET /api/catalog | Merch + bay items from Square catalog | Live |
| GET /api/bays/stream | SSE live bay status (30s polling) | Mock data |
| POST /api/webhooks/square | Receives Square webhook events (HMAC validated) | Live |
| POST /api/resend-verification | Re-send email verification link | Live |
| GET /api/docs | Interactive API docs (Swagger UI) | Live |
| GET /api/docs/openapi.json | OpenAPI 3.1 spec | Live |

### Square Integration
- **Customers API** — auto-creates customer record at registration
- **Bookings API** — search availability + create bookings (5 bays, 90min or 3hr blocks)
- **Catalog API** — fetches merch/bay items for store page with live pricing
- **Webhooks** — 149 event types subscribed, HMAC signature validation live, handlers scaffolded for payment/subscription/booking events
- **Sandbox environment** — all APIs using sandbox credentials; switch to production before launch

### Infrastructure
- **Hosting**: Railway (Metal tier) with persistent SQLite volume
- **CDN**: Cloudflare (DNS + caching + bot protection)
- **Domain**: thewrench.club (Cloudflare DNS)
- **CI/CD**: GitHub Actions → Railway auto-deploy on push to main
- **DB**: SQLite via Drizzle ORM (auth sessions + waitlist only — Square owns all business data)
- **OG Embed**: Animated WebP with pulsing wrench logo (Discord/social verified working)

### Testing
- **104 e2e tests passing** (Playwright): auth flows, waitlist, public pages, dashboard, reservations, 39 API endpoint tests
- Covers: auth guards, rate limiting, webhook signature validation, SSE streaming, catalog structure, booking validation, all error cases
- CI runs on every push via GitHub Actions

### Design
- Dark-first theme with #ED0C85 hot pink brand color
- Mobile-responsive, touch-friendly UI
- Animated mobile menu (racing stripe, staggered fly-in, drive-across separators)
- Custom 404 page ("Wrong Bay")
- SEO: Open Graph, Twitter Cards, JSON-LD structured data (AutoRepair schema)
- All imagery from founder-provided photos (no stock)

---

## Questions for Coleman

### Must answer before launch

1. **Bay types and mapping** — The booking system has 5 bays in Square Bookings (Bay 1-5), and the dashboard shows 7 bays (3 flat, 3 hoist, 1 detail). We need to know:
   - How many bays does the facility actually have?
   - Which bay numbers correspond to which type (flat/hoist/detail)?
   - This determines the labels users see when booking ("Bay 1" vs "Flat Bay 1")

2. **Exact pricing** — What are the final rates?
   - Hoist bay: $/hr or per block?
   - Flat bay: same?
   - Detail bay: same?
   - Monthly membership fee?
   - Currently showing $40/90min and $60/3hr from Square sandbox — confirm or adjust
   - The /pricing page says "TBD" while /store shows live Square catalog prices — should /pricing show real numbers?

3. **Hours of operation** — For display on the site and for time slot generation. What hours will the shop be open?

4. **Waiver / liability** — The register form has a simple checkbox ("I agree to the liability waiver"). Do you want:
   - A full waiver document displayed inline?
   - A link to a PDF waiver?
   - A DocuSign / digital signature integration?
   - Just the checkbox is fine?

5. **Facility photos** — We have the founder+car photos and team-cars group shot. Still need:
   - Interior bay shots (lifts, tools)
   - Tool library / clubhouse
   - Racing simulators
   - These would replace the current hero background and fill out the About page

6. **Gift card / bay credit flow** — How should members redeem gift cards or bay time credits during booking? Apply at checkout? Auto-deduct from balance?

### Nice to have

7. **Domain** — Currently on thewrench.club. Do you also own wrenchclub.com? Want to redirect it?

8. **Square production credentials** — Everything is running on Square sandbox. When ready to go live:
   - Production access token (from Square Developer Dashboard)
   - Production location ID
   - These replace the sandbox values already configured

---

## What's Next (Roadmap)

### Before launch
- [ ] Get answers to questions above (especially bay types + pricing)
- [ ] Switch from Square sandbox to production credentials
- [ ] Update /pricing page with real numbers (currently "TBD")
- [ ] Add facility photos to hero + about page
- [ ] Verify Resend email delivery is working in production
- [ ] Map bay numbers to bay types in booking UI labels

### Phase 2 (post-launch)
- [ ] Live bay status from real Square bookings (SSE currently uses mock data — all show "available")
- [ ] Square webhook event handlers (booking/payment/subscription updates currently acknowledged but no-op)
- [ ] Payment processing integrated into booking flow
- [ ] Profile editing (name, email, password)
- [ ] Subscription/membership management via Square Subscriptions API

### Phase 3 (growth)
- [ ] Member events calendar with RSVP
- [ ] Dyno day registration
- [ ] Parts discount supplier integration
- [ ] Racing sim leaderboards
- [ ] Community project gallery / feed
- [ ] Push notifications (PWA)

---

## Tech Stack (for reference)
SvelteKit 5 (SSR) · TypeScript · Tailwind CSS v4 · Svelte 5 runes · Square APIs · Lucia v3 auth · SQLite/Drizzle · Railway · Cloudflare · Playwright e2e · GitHub Actions CI
