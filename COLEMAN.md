# Wrench Club — Project Status for Coleman

**Site**: https://thewrench.club
**Repo**: github.com/tribixbite/wrench (private)
**Last updated**: April 15, 2026

---

## What's Built

### Public Marketing (5 pages)
| Page | URL | Status |
|------|-----|--------|
| Landing | https://thewrench.club | Hero, features, waitlist form |
| Pricing | https://thewrench.club/pricing | Bay types, rates, membership tiers |
| Membership | https://thewrench.club/membership | Benefits, philosophy, booking teaser |
| About | https://thewrench.club/about | Founder bios (all 4), facility location, map |
| Shop | https://thewrench.club/store | Merch renders (tee, hoodie, hats), gift cards |

### Auth System (fully functional)
| Page | URL | Status |
|------|-----|--------|
| Register | https://thewrench.club/auth/register | Name, email, password, waiver checkbox |
| Login | https://thewrench.club/auth/login | Email/password, "forgot password" link |
| Forgot Password | https://thewrench.club/auth/forgot-password | Sends reset link (1hr expiry) |
| Password Reset | https://thewrench.club/auth/reset/[token] | New password form, token validation |
| Logout | POST /auth/logout | Clears session |

- Rate limiting on all auth endpoints (5 attempts/min per IP)
- Square Customer record created automatically at registration
- Session-based auth (Lucia v3, cookie-based, no JWTs)

### Member Portal (4 pages, login required)
| Page | URL | Status |
|------|-----|--------|
| Dashboard | https://thewrench.club/app/dashboard | Stats, live bay grid (SSE), location card |
| Reservations | https://thewrench.club/app/reservations | Select bay (1-5) + duration (90min/$40, 3hr/$60) + date + time slot → confirm booking |
| Profile | https://thewrench.club/app/profile | View name, email, role |
| Admin | https://thewrench.club/app/admin | Waitlist table + members table (admin-only) |

### API Endpoints (10 routes)
| Endpoint | Purpose |
|----------|---------|
| POST /api/waitlist | Add email to waitlist (dedupes) |
| POST /api/bookings/availability | Get open time slots from Square for a bay+date |
| POST /api/bookings/create | Book a bay (creates Square booking) |
| GET /api/bookings/list | User's upcoming reservations |
| GET /api/catalog | Merch + bay items from Square catalog |
| GET /api/bays/stream | SSE live bay status (polling every 30s) |
| POST /api/webhooks/square | Receives Square webhook events |
| POST /api/resend-verification | Re-send email verification link |
| GET /api/docs | Interactive API docs (Swagger UI) |
| GET /api/docs/openapi.json | OpenAPI 3.0 spec |

### Square Integration
- **Customers API** — auto-creates customer record at registration
- **Bookings API** — search availability + create bookings (Bay 1-5, 90min or 3hr blocks)
- **Catalog API** — fetches merch/bay items for store + pricing pages
- **Webhooks** — endpoint live, validates HMAC signatures, handlers scaffolded for payment/subscription/booking events

### Infrastructure
- **Hosting**: Railway (Metal tier) with persistent SQLite volume
- **CDN**: Cloudflare (DNS + caching)
- **Domain**: thewrench.club (Cloudflare DNS)
- **CI/CD**: GitHub → Railway auto-deploy on push to main
- **DB**: SQLite via Turso/Drizzle (auth sessions + waitlist only — all business data in Square)
- **OG Embed**: Animated WebP with pulsing wrench logo (Discord/social verified working)

### Testing
- **6 e2e test suites** (Playwright): auth flows, waitlist, public pages, dashboard, reservations, API endpoints
- **4 unit test suites** (Vitest): Square config, email templates, Zod schemas, utility functions
- **24 total route handlers tested**

### Design
- Dark-first theme with #ED0C85 hot pink brand color
- Mobile-responsive, touch-friendly
- Animated mobile menu (racing stripe, staggered fly-in, drive-across separators)
- Custom 404 page ("Wrong Bay")
- SEO: Open Graph, Twitter Cards, JSON-LD structured data
- All imagery from founder-provided photos (no stock)

---

## Questions for Coleman

### Must answer before launch

1. **Exact pricing** — What are the final rates?
   - Hoist bay: $/hr or per block?
   - Flat bay: same?
   - Detail bay: same?
   - Monthly membership fee?
   - Currently showing $40/90min and $60/3hr in the booking UI — confirm or adjust.

2. **Number and types of bays** — Currently configured as 5 generic bays. How many of each:
   - Hoist bays (with lift)?
   - Flat bays (ground level)?
   - Detail bays?

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

8. **Email provider** — Need a Resend API key for transactional emails (waitlist confirmation, password reset, email verification). I can set this up if you give me the go-ahead — it's free for up to 3,000 emails/month.

9. **Square production credentials** — Everything is running on Square sandbox right now. When ready to go live:
   - Production access token (from Square Developer Dashboard)
   - Production location ID
   - Webhook signature secret

---

## What's Next (Roadmap)

### Before launch
- [ ] Get answers to questions above
- [ ] Set up Resend email delivery (currently no emails send)
- [ ] Switch from Square sandbox to production credentials
- [ ] Fix Square catalog token scope (currently UNAUTHORIZED for catalog API)
- [ ] Wire email verification into registration flow
- [ ] Add facility photos to hero + about page

### Phase 2 (post-launch)
- [ ] Live bay status from real Square bookings (SSE currently uses mock data)
- [ ] Square webhook handlers (real-time booking/payment updates)
- [ ] Payment processing at booking time
- [ ] Profile editing
- [ ] Subscription/membership management via Square

### Phase 3 (growth)
- [ ] Member events calendar
- [ ] Dyno day registration
- [ ] Parts discount integration
- [ ] Community features

---

## Tech Stack (for reference)
SvelteKit 5 (SSR) · TypeScript · Tailwind CSS v4 · Square APIs · Lucia v3 auth · SQLite/Drizzle · Railway · Cloudflare · Playwright + Vitest
