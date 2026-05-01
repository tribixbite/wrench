# Wrench Club — Day-to-day Operations

For staff and founders. Covers the common tasks that go through the Square
Dashboard or the app's admin UI — no code knowledge needed.

- **Production site**: https://wrenchclub.com
- **Staging site**: https://thewrench.club *(safe to test against — runs on Square sandbox, no real charges)*
- **Square Dashboard**: https://squareup.com/dashboard *(production)* · https://app.squareupsandbox.com/dashboard *(sandbox)*
- **Railway (hosting)**: https://railway.app *(env vars, deploy history, logs)*
- **Resend (email)**: https://resend.com/emails *(inbox for outgoing waitlist / verification / reset emails)*

---

## Table of Contents

1. [Add a new merch item](#add-a-new-merch-item)
2. [Adjust inventory for a merch item](#adjust-inventory-for-a-merch-item)
3. [View today's bookings](#view-todays-bookings)
4. [Refund a booking / payment](#refund-a-booking--payment)
5. [Cancel a booking on behalf of a member](#cancel-a-booking-on-behalf-of-a-member)
6. [Temporarily take a bay offline](#temporarily-take-a-bay-offline)
7. [Hide or un-hide the Detail Bay](#hide-or-un-hide-the-detail-bay)
8. [View the waitlist](#view-the-waitlist)
9. [View / manage members](#view--manage-members)
10. [Read error logs](#read-error-logs)
11. [Rotate an API key](#rotate-an-api-key)
12. [When something breaks](#when-something-breaks)

---

## Add a new merch item

Merchandise on the **/store** page is driven live by Square Catalog — anything
you add in the Square Dashboard appears on the site within a minute, no deploy
needed.

1. Square Dashboard → **Items & services → Items** → **Create an item**
2. Set **Item name**, **Description**, upload an **image**
3. Under **Category**, choose **Merchandise** (not "Bays" or "Services" — those
   are reserved for bay rentals)
4. Add **Variations** for size/color/etc., each with its own price and SKU
5. Under **Stock**, enter initial quantity if you want inventory tracked
6. **Save**

Check https://wrenchclub.com/store within a minute — the item should appear.

Notes:
- Out-of-stock variations auto-hide from the store
- Leave `productType` as the default (`REGULAR`) — don't use
  `APPOINTMENTS_SERVICE`, that's only for bay rentals

## Adjust inventory for a merch item

Square Dashboard → **Items → Inventory → Update stock** → search the item →
enter new quantity. Change reflects on /store within ~60s.

## View today's bookings

Square Dashboard → **Appointments → Calendar** → filter by location (**Wrench
Club**) and date. Shows bay assignments, member names, and payment status.

Members can also see their own upcoming bookings at
https://wrenchclub.com/app/reservations while logged in.

## Refund a booking / payment

Two paths depending on whether the booking is being cancelled too.

**Path A — refund within app** (if the member is cancelling >24h ahead):
Member clicks **Cancel** on their booking in
https://wrenchclub.com/app/reservations. The app calls Square's Refund API and
the money returns to their original card automatically. Staff does nothing.

**Path B — refund manually** (damage charge reversal, goodwill gesture, or
inside the 24h cutoff):

1. Square Dashboard → **Transactions** → find the payment by date/amount
2. Click the payment → **Issue refund**
3. Enter full or partial amount → **Confirm**
4. Refund processes same-day; member sees it on their card in 3-5 business days

If the booking's customer note starts with `[order:X|payment:Y]`, the IDs
inside are the Square Order and Payment objects for that specific booking —
useful if you need to cross-reference.

## Cancel a booking on behalf of a member

Square Dashboard → **Appointments → Calendar** → click the booking → **Cancel
appointment**. This does NOT auto-refund. Follow up with Path B above if the
member paid.

For member-initiated cancellations, direct them to the app — it handles the
refund automatically when within the 24h window.

## Temporarily take a bay offline

Use this when a bay is down for maintenance, cleaning, or a staff-only event.
The bay disappears from the online booking calendar without any code changes.

1. Square Dashboard → **Appointments → Staff** (NOT "Team → Team members")
2. Click the bay's team member (e.g. **Hoist Bay 1**)
3. Toggle **Bookable online** to **off**
4. **Save**

To bring it back online, reverse the toggle. Changes take effect immediately.

> ⚠️ Flip **"Bookable online"** — NOT the generic "Bookable" toggle. Only the
> former controls the online calendar.

## Hide or un-hide the Detail Bay

The Detail Bay is currently hidden everywhere on the public site pending
zoning approval for car-wash use. Square catalog + team member stay active
behind the scenes.

**To bring it back (after zoning clears):**

1. Railway → wrench-club project → **production** environment → **Variables**
2. Find `PUBLIC_HIDE_DETAIL_BAY` → delete it (or set value to anything other
   than `true`)
3. Railway will redeploy automatically (~2 min)
4. Repeat for the **staging** environment if you want it visible there too

The Detail Bay reappears on /pricing, the bay-type picker, marketing copy,
and the waitlist email template the moment the redeploy finishes.

## Grant someone admin

Edit `AUTH_ADMIN_EMAILS` on Railway → production → Variables. Comma-separated
list of emails — anyone in there gets `role='admin'` on signup AND on their
next authenticated request, so existing 'member' accounts upgrade
automatically the moment they hit any page.

```
AUTH_ADMIN_EMAILS=info@wrenchclub.com,willstone@gmail.com
```

To revoke admin: remove the email from `AUTH_ADMIN_EMAILS` AND manually
downgrade their `users.role` row in the DB — the auto-promote logic upgrades
but doesn't downgrade (so a removed entry doesn't accidentally demote a
seeded admin).

## View the waitlist

1. Log into https://wrenchclub.com/app/admin as an admin account
2. The **Waitlist** tab shows all signups with name, email, timestamp
3. Export is not built yet — if you need a CSV, tell the dev team and we'll
   add an export button

## View / manage members

Same admin page: https://wrenchclub.com/app/admin → **Members** tab.

To change a member's role (member → admin / staff), you'll currently need
direct DB access — not in the UI yet. Ask the dev team.

To view a member's Square customer profile (for payment history, cards on
file, subscriptions): Square Dashboard → **Customers** → search by email.

## Read error logs

1. Railway → wrench-club project → pick an environment (**production** or
   **staging**) → **Deployments** tab → click the latest deployment
2. **Logs** tab shows last ~1000 lines of stdout/stderr from the app
3. Filter by keyword (e.g. `ERROR`, `[email] Resend error:`, `[bookings/`)

Resend-specific email failures show as `[email] Resend error: 400 …` with the
rejection reason. Square API failures typically show the whole error body.

## Rotate an API key

If a key leaks (or just for hygiene):

**Square**: Square Dashboard → **Developer → Applications** → pick the app →
**Production / Sandbox credentials** → **Revoke** current token → **Create
new access token** → copy. Then Railway → Variables → update
`PROD_ACCESS_TOKEN` (or `SANDBOX_SECRET`) → save. Auto-redeploys.

**Resend**: https://resend.com/api-keys → **Create API key** → give it
permission "full access" → copy. Railway → Variables → `RESEND_API_KEY` →
save. Auto-redeploys. Then delete the old key on Resend.

**Session secret**: Railway → Variables → `SESSION_SECRET` → generate a new
random string (32+ chars) → save. ⚠️ **This logs out every active session.**

## View site analytics

Traffic and visitor data live in our self-hosted **Umami** instance — a
sibling service in the same Railway project. Cookie-less, GDPR-friendly,
no consent banner needed.

1. Open the Umami URL set in Railway as the umami service's domain
   (currently `https://umami-production-f110.up.railway.app/`)
2. Log in (admin account credentials are in the team password vault — **NOT
   the default `admin`/`umami`**, that was rotated on first login)
3. The **Wrench Club** website dashboard shows pageviews, sessions, top
   pages, referrers, devices, countries, and bounce rate

**To stop sending analytics** (e.g. GDPR request, debugging): Railway →
production → Variables → blank out `PUBLIC_UMAMI_SRC` or
`PUBLIC_UMAMI_WEBSITE_ID` → redeploy. The `<script>` tag stops rendering
when either var is empty.

## When something breaks

| Symptom | First check |
|---|---|
| Site returns 502 / 503 | Railway → Deployments — did the latest deploy fail? Check logs. |
| "This bay is no longer free at that time" on a bay a member just picked | Normal — someone else grabbed the slot between their pick and checkout. Member should pick another slot. |
| Member says they never got their verification / reset email | Resend dashboard → **Emails** — search by recipient. If not listed, `RESEND_API_KEY` might be wrong on Railway. If listed but bounced, check domain/DNS. |
| Bay shows "available" but member gets "team member not found" | The bay's "Bookable online" toggle got turned off. Re-enable per [Temporarily take a bay offline](#temporarily-take-a-bay-offline). |
| Payment goes through but booking doesn't create | Check Railway logs for `[bookings/create]` — our code auto-refunds a charge if the booking create fails after payment. If auto-refund also fails, the log contains the payment ID to refund manually. |
| CI tests failing on GitHub | Usually Cloudflare bot protection intermittently blocking CI runners — most tests skip in that case. If it's a real failure, Railway deploy state is the usual cause. |

When in doubt, ping the dev team with the timestamp of the incident and the
member's email. Railway log retention is ~30 days.
