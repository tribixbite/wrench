# Wrench Club — Website Spec & Roadmap

## Project Overview

**Wrench Club** is West Michigan's premier DIY auto shop — a membership-based facility in Downtown Grand Rapids where members rent bays with car lifts to work on their own vehicles. The clubhouse includes racing simulators, automotive resources, and community events.

**Current state**: Gen 1 Squarespace site at wrenchclub.com with waitlist signup. Coming in 2026.

**Goal**: Build a modern SvelteKit SSR website that handles marketing, member registration, bay reservations, merch sales, and live bay availability — all integrated with Square POS.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | SvelteKit (SSR, adapter-node or adapter-vercel) | Marketing pages + authenticated app features |
| UI | Svelte 5 + Tailwind v4 + shadcn-svelte | Modern, accessible, copy-paste ownership |
| Data layer | **Square APIs** (primary) | Existing Square POS account — customers, catalog, bookings, orders all live in Square |
| Session store | Turso (LibSQL) or SQLite file — sessions + waitlist only | Minimal DB for auth sessions; Square owns all business data |
| Auth | Lucia v3 (session cookies) | SvelteKit-native, cookie-based, no JWTs |
| Payments/POS | Square Web Payments SDK + Square APIs | Unified with in-store POS |
| Reservations | Square Bookings API + custom UI | Bay scheduling with Square payment integration |
| E-commerce | Square Catalog + Orders API | Merch store synced with in-store POS inventory |
| Email | Resend or Square Marketing API | Transactional emails + mailing list |
| Hosting | Vercel or Fly.io | SSR support, edge functions, easy deploys |
| Real-time | SSE (Server-Sent Events) | Live bay occupancy feed via Square Bookings polling |

### Square-First Data Architecture

Square is the source of truth for all business data. The app DB is intentionally thin:

| Data | Where it lives | Why |
|------|---------------|-----|
| Customers / members | Square Customers API | Synced with in-store POS, single customer record |
| Memberships / billing | Square Subscriptions API | Recurring payments managed by Square |
| Bay reservations | Square Bookings API | Staff can also manage from Square Dashboard |
| Merch catalog | Square Catalog API | Inventory synced with physical POS |
| Orders / payments | Square Orders API | Unified receipts across online + in-store |
| Gift cards | Square Gift Cards API | Sell online, redeem in-store |
| Auth sessions | App DB (Turso/SQLite) | Square has no session/auth concept |
| Waitlist emails | App DB or Square Marketing API | Pre-launch signups |

The app authenticates users locally (Lucia sessions), then uses the stored `squareCustomerId` to call Square APIs on their behalf. No duplicating business data in a custom DB.

## Branding & Design Direction

### Colors
- **Primary**: Black / deep charcoal (#0a0a0a)
- **Accent**: Wrench Club pink **#ED0C85** (extracted from logo)
- **Secondary accent**: White/cream for contrast text
- **Inspired by**: Hoist House's clean cream+red palette, but darker and more club-oriented

### Tone
- Automotive enthusiasm, not corporate
- Approachable but credible — these are real gearheads, not a franchise
- Community-first language ("club", "members", "crew")
- Personality through founder bios and their daily drivers

### Typography
- Bold display font for headings (automotive character — not generic sans-serif)
- Clean readable body font
- Monospace or stencil accents for technical details (horsepower, bay specs)

### Photography

**Available assets** (`assets/` directory):

| File | Content | Use |
|------|---------|-----|
| `logo.png` | Logo with transparency (2500x632 RGBA) | Header, favicon source |
| `logo.webp` | Logo WebP (106KB) | Lighter web version |
| `coleman.jpg` | Coleman in WC tee, leaning on BMW M760xi, garage door backdrop | About page bio |
| `bmw.jpg` | Coleman's M760xi solo, facility exterior visible (522 Stocking Ave NW) | About / gallery |
| `derick.jpg` | Derick with his Audi RS6 | About page bio |
| `mike.jpg` | Mike with his Chevy Suburban | About page bio |
| `adrian.jpg` | Adrian with his Ford F350 | About page bio |
| `team-cars.jpg` | All 4 daily drivers lined up at facility entrance — Suburban, RS6, M760xi, F350 | **Hero image candidate** |

- Brand pink: **#ED0C85**
- Facility building: dark grey cinder block, roll-up garage door, awning with "Customer Entrance 522 Stocking Ave NW"

**Still needed:**
- Interior facility shots — bays, lifts, tool carts, clubhouse, racing sims
- Action shots — someone working under a hoist, tool library in use
- Logo SVG (can trace from PNG if needed)
- Real photos only, no stock imagery

---

## Site Map & Page Specs

### Phase 1 — Marketing & Waitlist (Launch)

#### 1. Home (`/`)
**Sections in order:**

1. **Hero**
   - Headline: "West Michigan's Premier Do-It-Yourself Auto Shop"
   - Subhead: "From oil changes to engine swaps. If you can dream it, you can do it at Wrench Club."
   - CTA: **"Join the Waitlist"** (primary, prominent)
   - Secondary CTA: "See Pricing" (text link)
   - Visual: full-bleed facility photo or stylized car imagery
   - Badge: "Coming 2026 · 522 Stocking Ave NW, Grand Rapids, MI"

2. **What is Wrench Club**
   - "A fully-equipped do-it-yourself garage club. Members book a hoist or flat bay with access to their own tool cart and workstation."
   - 4 feature cards:
     - Tool library (specialized tools, air tools, everything needed)
     - Employee-operated hoists (safe setup for every job)
     - No more driveways (work smarter, safer, cleaner)
     - More than a shop (simulators, resources, events, community)

3. **What Can I Use My Membership For?**
   - Grid or icon list:
     - Routine maintenance (oil/fluid changes, tire rotations, suspension, brakes)
     - Vehicle modification
     - Vehicle restoration projects
     - Pre-purchase inspections
     - DIY detailing and washing
     - Members-only events and car community networking

4. **What Makes It a "Club"?**
   - "Built around community, safety, and shared responsibility. Membership-based, not public drop-in."
   - "Everyone who uses our space is properly oriented with equipment, understands safety protocols, and respects the tools and workspace."

5. **Our Structure — Three Pillars**
   - **Affordability**: Membership rates comparable to a gym. Access to facility, clubhouse, scheduling.
   - **Flexibility**: Hoist bays, flat bays, detail bay. Rent by hour, day, week, or month.
   - **Community**: Downtown Grand Rapids clubhouse for like-minded enthusiasts.

6. **Waitlist Signup**
   - Email input + submit
   - "Sign up to receive news and the latest updates"
   - Feeds into Square Marketing or Resend mailing list

7. **Footer**
   - Email: info@wrenchclub.com
   - Facebook: facebook.com/wrenchclubb
   - Location: 522 Stocking Ave NW, Grand Rapids, MI
   - Logo + copyright

#### 2. Pricing (`/pricing`)

**Bay Types & Rates:**

| Bay Type | Description | Rate Structure |
|----------|-------------|----------------|
| Flat Bay | Ground-level workspace | Hourly / daily |
| Hoist Bay | 2-post or drive-on lift (employee operated) | Hourly / daily |
| Detail Bay | Wash/detail station | Hourly / daily |

**Membership tier** (gym-style monthly):
- Includes: facility access, clubhouse, scheduling system, member events
- Bay time billed separately per use (or bundled hours at discount)

> TODO: Get exact pricing from Coleman. Handoff mentions pricing but no specific numbers. Check Square catalog for configured rates.

**CTA**: "Join the Waitlist" (not "Sign Up" yet — launch hasn't happened)

#### 3. Membership (`/membership`)

Benefits breakdown:
- **Clubhouse access**: Racing simulators, lounge, automotive library
- **Tool library**: Full access to specialty, air, and hand tools
- **Parts discounts**: Negotiated rates with local suppliers
- **Events**: Car shows, dyno days, member meetups
- **Bay rental**: Priority booking via scheduling system

#### 4. About Us (`/about`)

**Location section**: Map embed for 522 Stocking Ave NW, Grand Rapids, MI; hours (TBD)

**Founder Bios:**

- **Coleman Brook** — Co-founder
  - Bio: BMW enthusiast, 16+ years of BMW ownership, 7 years at local BMW dealership. Transitioned from house to condo, missed having a garage. Co-conceived Wrench Club over beers with Derick and Mike. Almost 2 years from concept to reality.
  - Daily: 2018 BMW M760xi — 6.6L Twin Turbo V12 — 600hp
  - Photo: [from assets]

- **Derick Brower** — Co-founder
  - Bio: Started DIY repair owning older German vehicles. Dealer quotes drove him to learn. Believes DIY shouldn't be limited to pros or people with equipped garages. Wrench Club lowers the barrier.
  - Daily: 2003 Audi RS6 — 4.2L BiTurbo V8 — 444hp
  - Photo: [from assets]

- **Mike Zandstra** — Co-founder
  - Bio: First word was "car." Founded Wrench Club because everyone deserves to understand their vehicle, and because he ran out of clothes to sacrifice under jack stands. Gravity doesn't care how careful you are.
  - Daily: 1999 Chevy Suburban — 5.7L V8 — 255hp
  - Photo: [from assets]

- **Adrian Hoogerheide** — Advisor/Partner
  - Bio: Lifelong car guy. Owned and operated Auto Fixit Body Shop in Grand Rapids for 20+ years. Brings mechanic and shop owner expertise.
  - Daily: 2019 Ford F350 — 6.7L TurboDiesel V8 — 715hp
  - Photo: [from assets]

**Design note**: Each bio should feature their daily driver specs prominently — it's personality and credibility. Consider a card layout with photo, name, bio, and a "current daily" badge showing car/engine/hp.

#### 5. Shop (`/store`)

Merch catalog powered by Square Catalog API:
- T-Shirts
- Hats
- Gift Cards / Bay Time credits

**Phase 1**: Link out to Square Online store (if already set up) or embed a minimal catalog with Square Web Payments checkout.

**Phase 2**: Full in-app store with cart, checkout, order history.

---

### Phase 2 — Member Portal (Post-Launch)

#### 6. Member Registration (`/auth/register`)
- Name, email, password
- Waiver/liability agreement checkbox
- Creates local auth record (users table) + Square Customer via Customers API
- Stores returned `squareCustomerId` on user record
- Email verification flow
- Redirects to onboarding (safety orientation scheduling)

#### 7. Member Login (`/auth/login`)
- Email + password
- Session cookie via Lucia
- "Forgot password" flow

#### 8. Dashboard (`/app/dashboard`)
- Welcome message, membership status
- Upcoming reservations
- Quick-book a bay
- Bay availability at-a-glance (mini grid)
- Recent orders / invoices

#### 9. Bay Reservations (`/app/reservations`)
- Calendar/schedule view showing bay availability
- Select bay type → select date/time block → confirm → pay via Square
- View/cancel upcoming reservations
- Integration: Square Bookings API for scheduling, Square Payments for billing

#### 10. Live Bay Grid (`/app/bays` or homepage widget)
- Real-time display of bay occupancy vs availability
- SSE connection for live updates
- Visual grid: each bay shows status (available / occupied / reserved)
- Could also be a public widget on the homepage (anonymous, no member details)

#### 11. Member Profile (`/app/profile`)
- Edit name, email, password
- Membership tier and billing info (managed via Square)
- Reservation history
- Order history

---

### Phase 3 — Growth Features

- **Admin panel** (`/app/admin`): Manage members, bays, inventory, view analytics
- **Event calendar**: Public events page, RSVP for members
- **Racing sim leaderboards**: Track sim racing times, display standings
- **Community feed**: Member project showcases, photo gallery
- **Push notifications**: Bay availability alerts, event reminders (PWA)
- **Parts ordering**: Integration with local suppliers for in-app parts ordering

---

## Square Integration Map

| Feature | Square API | Notes |
|---------|-----------|-------|
| Merch store | Catalog API + Orders API | Sync products, create orders |
| Checkout | Web Payments SDK | Embed payment form in SvelteKit |
| Memberships | Subscriptions API | Recurring monthly billing |
| Bay reservations | Bookings API | Time-block + resource scheduling |
| Customer records | Customers API | Created on registration, queried via squareCustomerId |
| Gift cards | Gift Cards API | Sell and redeem bay time credits |
| Webhooks | Square Webhooks | Payment confirmations, subscription events |
| In-store sync | Inventory API | Merch stock synced with physical POS |
| Mailing list | Marketing API (or Resend) | Waitlist signups, member announcements |

**Auth note**: Square is NOT the auth provider. App manages its own auth (Lucia sessions). Square Customer ID is stored on the local user record and used for all Square API calls.

**Webhook endpoint**: `/api/webhooks/square` — receives payment.completed, subscription.created, booking.created events. Validates Square signature. Used for real-time UI updates (bay status, order confirmations) — not for syncing to a local DB since Square is the source of truth.

---

## Competitive Analysis Summary

| Feature | Wrench Club | Hoist House | Redline Garage | My Mechanics Place |
|---------|-------------|-------------|----------------|-------------------|
| Membership model | Monthly + per-use bays | Hourly/daily/weekly + residencies | Membership tiers | Pay-per-use only |
| Online booking | Yes (Square Bookings) | Yes (prominent CTA) | Appointment-based | Reservation link |
| Live availability | Yes (real-time grid) | No | No | No |
| Merch store | Yes (Square integrated) | No | No | No |
| Clubhouse/community | Sims, events, library | Events (dyno days) | "Join the crew" | No |
| Transparent pricing | Yes (on pricing page) | Hidden behind clicks | Vague | Hidden |
| Member portal | Full dashboard | Not visible | Not visible | Not visible |
| Design quality | Modern dark, custom | Clean cream+red | Dark+red, decent | Outdated, compromised |

**Differentiators for Wrench Club site:**
- Transparent pricing (don't hide it like competitors)
- Live bay availability (no competitor does this)
- Integrated member portal (reservations, billing, profile)
- Founder personality (daily drivers, real bios, not corporate)

---

## Database Schema (Drizzle / Turso)

Intentionally thin — Square owns all business data. The app DB only handles auth sessions and pre-launch waitlist.

```typescript
// Auth — local session management (Lucia v3)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),                    // nanoid
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('member'),  // member | admin | staff
  squareCustomerId: text('square_customer_id'),    // links to Square Customers API
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

// Pre-launch only — migrate to Square Marketing API when ready
export const waitlist = sqliteTable('waitlist', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});
```

Everything else — bays, reservations, orders, catalog, subscriptions — lives in Square and is accessed via their APIs. No local copies, no sync jobs, no stale data.

---

## Roadmap

### Phase 1: Marketing & Waitlist (MVP — 2-3 weeks)
- [x] Project scaffold: SvelteKit + Tailwind v4, Bun runtime
- [x] Branding: #ED0C85 hot pink, Barlow Condensed display, Inter body, dark-first CSS vars
- [x] Home page: hero (team-cars.jpg), features, membership uses, pillars, waitlist form
- [x] Pricing page: bay types, membership rate, transparent pricing
- [x] Membership page: benefits breakdown, founder quotes
- [x] About page: location, founder bios with daily driver specs, map embed
- [x] Store page: live Square catalog (bay rentals + membership), merch placeholder
- [x] Waitlist form: email + name → SQLite DB + Resend confirmation email
- [x] SEO: meta tags, LocalBusiness/AutoRepair JSON-LD structured data
- [ ] OG image — static social share preview (og-preview.png)
- [ ] Deploy to Vercel/Fly.io, point wrenchclub.com DNS
- [ ] Mobile responsive audit, Lighthouse performance pass

### Phase 2: Member Portal (4-6 weeks after launch)
- [x] Auth: registration, login, sessions (Lucia v3 + Drizzle SQLite)
- [x] Square Customer creation on registration (squareCustomerId linked)
- [x] Member dashboard: stat cards, live bay grid, location card
- [x] Live bay grid: SSE endpoint, BayGrid.svelte with status colors + skeleton
- [x] Transactional emails: Resend — waitlist confirmation + registration welcome
- [ ] Email verification flow on registration
- [ ] Bay reservations: calendar UI → Square Bookings API → payment
  - Blocked: Square Bookings must be enabled in Developer portal for the sandbox app
- [ ] In-app merch store: Square Catalog → cart → Square Web Payments checkout → webhooks

### Phase 3: Growth (ongoing)
- [x] Admin panel: waitlist viewer + member list at /app/admin/ (admin role only)
- [ ] Event calendar with RSVP
- [ ] Racing sim leaderboards
- [ ] Community project gallery
- [ ] PWA: service worker, offline support, push notifications
- [ ] Parts ordering integration

---

## Open Questions

1. **Exact pricing** — What are the hourly/daily rates per bay type? Monthly membership fee? (May already be configured in Square — check catalog)
2. **Number of bays** — How many hoist, flat, and detail bays? Needed for bay grid UI and Square Bookings resource setup.
3. **Hours of operation** — For display and reservation time-slot generation.
4. ~~**Physical address**~~ — **522 Stocking Ave NW, Grand Rapids, MI** (visible on facility awning in photos)
5. **Square Bookings fit** — Does their API support "reserve resource X for time block Y"? Need to prototype. Fallback: custom reservation UI with Square Payments only.
6. **Waiver/liability** — Digital signature required at registration? DocuSign integration or simple checkbox?
7. **Facility photos** — Founder+car photos available via Google Photos. Still need: facility/bay shots, tool library, clubhouse/sims, hero imagery.
8. **Domain/hosting** — Keep wrenchclub.com? Vercel vs Fly.io vs other preference?
9. **Gift card / bay credit redemption flow** — How does a member apply bay time credits during checkout?
