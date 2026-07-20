# RELEASE_AUDIT.md — Letting Go Zen Studio

**Audit type:** Full production-release, security, payment and infrastructure audit
**Date:** 2026-07-14
**Auditor:** Claude (automated, evidence-based)
**Method:** Line-by-line source read + local production build + read-only live smoke test. No app code, data, or external service was modified. No real charge was created.
**Commit audited:** `f7e12ce` (branch `main`, working tree clean)

---

## 1. EXECUTIVE VERDICT

| Decision | Answer |
|---|---|
| **A — Code release** | **NO** |
| **B — Live Stripe connection** | **NO** (do not connect live keys until blockers are fixed) |
| **C — Real customer payments** | **NO** |

- **Overall risk level:** HIGH
- **Blockers:** 5
- **Critical:** 3
- **High:** 6

**Why.** The build is clean, TypeScript passes, no secrets are committed, and the core price-validation and webhook-signature designs are genuinely sound. But the payment/fulfilment layer is **not safe under duplication or manipulation**, which is exactly the standard that matters when real money is involved:

1. **Sklep digital orders fulfil twice for every single payment.** The webhook processes *both* `payment_intent.succeeded` and `charge.succeeded`, and the sklep branch runs on both — so one card payment sends two download emails, two Joanna notifications, and writes two order rows. There is no idempotency key anywhere.
2. **A crafted URL lets a customer pay a cheap service's price but book an expensive service's calendar.** The Cal.com slug and the priced service name are independent, unvalidated URL parameters.
3. **Row Level Security is unproven** and the Supabase anon key is public — if RLS is off, consent records (health-adjacent + signatures + IP), orders, and contact submissions are world-readable.
4. **The production domain is not connected**; sitemap/robots/canonical all point at `www.lettinggozenstudio.com` while the app runs on a `vercel.app` URL.
5. **Legal pages are real but not solicitor-reviewed**, and Resend still sends from the sandbox `onboarding@resend.dev`, which will not deliver reliably to customers in production.

None of these is exotic; each will fire in normal operation. They are all fixable, mostly with small changes.

---

## 2. WHAT WAS ACTUALLY VERIFIED

**Commands run (all read-only):**
- `git status --short`, `git branch --show-current`, `git log`, `git rev-list --all` secret scan → **Verified**: tree clean, no `.env` ever committed, no secret token patterns in any historical commit.
- `node --version` → v24.15.0, `npm --version` → 11.17.0.
- `npx tsc --noEmit` → **exit 0** (no type errors).
- `npm run build` (`next build`) → **exit 0**, 26 routes compiled, 12 static pages generated.
- `npm audit` / `npm audit --omit=dev` → 25 vulns (4 critical, 6 high, 15 moderate); interpreted below.
- `next start` + `curl` smoke test of 21 routes and 6 API abuse cases → recorded in §10.
- Translation key parity check (`pl.json` vs `en.json`) → **672 = 672 keys, zero drift**.

**Files fully read:** all 7 API routes; `lib/stripe.ts`, `lib/sanity-server.ts`, `lib/supabase.ts`, `lib/supabase-admin.ts`, `lib/supabase-storage.ts`, `lib/email.ts`, `lib/calcom.ts`, `lib/CartContext.tsx`, `lib/CurrencyContext.tsx`; `middleware.ts`, `next.config.mjs`, both layouts + studio layout; `zgoda-rezerwacja`, `rezerwacja`, `koszyk` pages; `sklepClient.tsx` (payment path); `service.ts` + `sklepProduct.ts` schemas; `sanity/lib/*`, `i18n/request.ts`; `sitemap.ts`, `robots.ts`, homepage JSON-LD; `.env.local` (names only, values redacted).

**Flows traced end-to-end:** booking (consent → token → payment → webhook confirm → gate → Cal.com → consume); cart; sklep digital purchase → download email; contact form.

## 3. WHAT COULD NOT BE VERIFIED (needs dashboards / live tests)

- **Supabase RLS state** on every table (no migrations/SQL in repo).
- **Supabase Storage bucket privacy** (`sklep-products`) — code calls `createSignedUrl`, which implies private, but the bucket's public flag is a dashboard setting.
- **Stripe account**: ownership, identity/KYC, payout bank, statement descriptor, enabled payment methods, live webhook endpoint, Radar.
- **Resend**: domain verification, SPF/DKIM/DMARC, sender reputation.
- **Cal.com**: whether events are payment-gated at the provider, event ownership, calendar connection, timezone.
- **Vercel**: env-var separation (test vs live), production branch, domain binding, function logs.
- **DNS**: apex/www, HTTPS cert, current propagation.
- Whether the live Stripe account is actually Joanna's.

---

## 4. ARCHITECTURE MAP (actual, verified)

```
                         Browser (Next.js 15.5 App Router, React 19)
                                       │
        ┌──────────────────────────────┼───────────────────────────────┐
        │ next-intl middleware (pl/en, NEXT_LOCALE cookie)              │
        └──────────────────────────────┼───────────────────────────────┘
                                       │
   ┌────────── SERVER (Vercel functions / RSC) ──────────────────────────┐
   │                                                                      │
   │  Pages (RSC) ── read published content ──► Sanity (useCdn:true, no  │
   │                                            token, public dataset)    │
   │                                                                      │
   │  /api/checkout/session   ─ price by NAME ─► Sanity (useCdn:false) ── │
   │  /api/checkout/sklep      ─ price+file by ID ─► Sanity ─────────────►│──► Stripe PaymentIntent (secret key)
   │  /api/booking-consent     ─ price by NAME ─► Sanity                  │
   │        │                                                             │
   │        ├─► Supabase (SERVICE ROLE) booking_tokens (pending)          │
   │        ├─► Supabase (SERVICE ROLE) booking_consents (PII+signature+IP)│
   │        └─► Resend (sandbox onboarding@resend.dev) → Joanna           │
   │                                                                      │
   │  /api/verify-booking-token  ─ SERVICE ROLE read  booking_tokens      │
   │  /api/consume-booking-token ─ SERVICE ROLE update booking_tokens     │
   │  /api/contact               ─ SERVICE ROLE insert contact_submissions│
   │                                                                      │
   │  /api/webhooks/stripe  ◄── signed events ── Stripe                   │
   │        ├─ verifies signature (STRIPE_WEBHOOK_SECRET) ✓               │
   │        ├─ sklep: signed URL (Storage) + 2× Resend + insert sklep_orders
   │        └─ session: insert orders + advance booking_tokens→confirmed  │
   └──────────────────────────────────────────────────────────────────────┘
                                       │
   Client after pay ──► /rezerwacja polls verify-token ──► Cal.com embed (public calendar)
```

**Duplicate / obsolete implementations found:**
- `app/[locale]/booking-pending/page.tsx` — orphaned (no inbound links; confirmed by grep). Still built and publicly reachable (returns 200).
- `app/[locale]/koszyk/page.tsx` — retains dead booking code (`pendingBooking`, `?booked=true`, `getPendingBookingFromSearchParams`) from the pre-bypass flow. Live booking never routes through it, but the code path still *works* and can add a booking item to the cart from URL params.
- `lib/calcom.ts` — hardcoded slug fallback map, intended to be deleted once Sanity slugs are complete.
- Two Sanity clients with `useCdn:true` (`sanity/lib/sanity.ts`, `sanity/lib/client.ts`) + one server client `useCdn:false` (`lib/sanity-server.ts`). Intentional but worth consolidating.
- `styled-components` in `package.json` — **not imported anywhere** (unused dependency).

---

## 5. RELEASE BLOCKERS

| ID | Sev | Area | Finding | Evidence | Required fix | Blocks release | Blocks Stripe |
|----|-----|------|---------|----------|--------------|:---:|:---:|
| **B1** | BLOCKER | Stripe/fulfilment | Sklep order fulfils **twice per payment**: the webhook handles both `payment_intent.succeeded` and `charge.succeeded`, and the `orderType==='sklep'` branch runs on both. One card payment → 2 download emails, 2 Joanna emails, 2 `sklep_orders` rows. | `app/api/webhooks/stripe/route.ts:36-38` (both events), `:82-130` (sklep branch runs for either) | Handle exactly one event type for fulfilment, OR gate on a stored Stripe event/PaymentIntent ID with a DB unique constraint. | ✅ | ✅ |
| **B2** | BLOCKER | Stripe/webhook | **No idempotency.** Stripe retries deliver the same event repeatedly. Fulfilment does check-nothing→insert with no unique constraint, so retries duplicate orders/emails and re-confirm tokens. | `route.ts:109-119` (plain insert), `:134-147` (plain insert), no `stripe_event_id` stored anywhere | Add a `stripe_events` table (or unique index on `stripe_session_id`/PaymentIntent ID) and short-circuit if the event was already processed. Must be a **DB constraint**, not an app-level check. | ✅ | ✅ |
| **B3** | BLOCKER / CRITICAL | Booking price integrity | A crafted consent URL can **pay a cheap service's price and unlock an expensive service's calendar.** `service` (Cal.com slug, drives the calendar) and `serviceName` (drives the price) are independent, unvalidated params. Price = `getServicePriceByName(serviceName)`; calendar = `token.service_id` (the slug). Nothing checks they belong to the same service. | `zgoda-rezerwacja/page.tsx:252-254`; `api/booking-consent/route.ts:65-72,129-156`; `rezerwacja/page.tsx:278` uses `calSlug` from token `service_id` | Server must derive the Cal.com slug **from the priced Sanity service**, not from a separate client param. Validate slug ↔ service server-side. | ✅ | ✅ |
| **B4** | BLOCKER | Supabase/RLS | **RLS unproven.** The anon key is `NEXT_PUBLIC_` (shipped to browser). If RLS is disabled on `booking_consents` (health answers, typed signature, IP, UA), `orders`, `sklep_orders`, `contact_submissions`, `booking_tokens`, anyone with the public key + project URL can read/modify all rows via PostgREST — regardless of what the app does. | `lib/supabase.ts:7-10` (anon key public); no migrations/policies in repo | Verify in Supabase dashboard that RLS is **enabled** on every table with **no public select/insert/update/delete policy**; service-role bypasses RLS so the app keeps working. | ✅ | ⚠️ (data-exposure, not payment) |
| **B5** | BLOCKER | Domain / config | Production domain not connected. `sitemap.ts`, `robots.ts`, `[locale]/layout.tsx` metadata, and JSON-LD all hardcode `https://www.lettinggozenstudio.com`, but the live deploy is a `vercel.app` URL (per `.env.local` comment). Canonicals, OG URLs, sitemap, and the Stripe live webhook URL cannot be finalised until the real domain is bound. | `app/sitemap.ts:4`, `app/robots.ts:10`, `app/[locale]/layout.tsx:35`, `.env.local` comment `...vercel.app/studio` | Bind the final domain in Vercel first; then create the live Stripe webhook, Apple Pay domain, and Resend sender against it. | ✅ | ✅ (webhook URL) |

---

## 6. FULL FINDINGS

### 6.1 Repository & build
- **INFO** — Build clean: `tsc --noEmit` exit 0, `next build` exit 0. `next.config.mjs:13` sets `eslint.ignoreDuringBuilds:true`, so lint errors are **not** gating the build (acceptable, but lint is effectively off in CI).
- **MEDIUM** — **Duplicate `<html>`/`<body>`.** `app/layout.tsx:11-12`, `app/[locale]/layout.tsx:168-169`, and `app/studio/layout.tsx:11-12` each render `<html><body>`. The `[locale]` layout nests inside the root layout → invalid nested `html/body`. Build passes and pages render, but this risks hydration warnings and is non-conformant. Consolidate to a single `html/body`.
- **LOW** — Orphaned `booking-pending` page and dead `koszyk` booking code (see §4). Reachable but unused; remove to shrink attack surface and confusion.
- **LOW** — `styled-components` dependency unused; drop it.
- **LOW** — Missing asset: `app/globals.css:45` references `/images/bg-texture.jpg`, which is **not** in `public/images/` (confirmed). Produces a 404 and the "flat purple band" the AGENTS.md notes; the fixed-layer fix can't work without the file.
- **LOW** — `app/globals.css:1` `@import`s Google Fonts (Marcellus/Montserrat) **and** `[locale]/layout.tsx:17-27` loads Cinzel/Raleway via `next/font`. The CSS `--font-cinzel/--font-raleway` tokens are overridden to Marcellus/Montserrat, so Cinzel/Raleway are downloaded but unused — wasted bytes + render-blocking external font import.

### 6.2 Dependencies
- **HIGH (dev-tooling reachability)** — `npm audit`: 4 critical / 6 high. The critical/high items are almost all inside the **Sanity CLI toolchain** (`@sanity/cli`→`decompress`, `next-sanity`→`@sanity/preview-url-secret`, `@architect/*`, `glob` CLI, `form-data`). These run at build/CLI time, not in the served request path, so runtime exposure is limited. **Exception:** `undici <=6.26.0` (HTTP header injection, response-queue poisoning, DoS) is a transitive runtime HTTP client and is the one to prioritise; `npm audit fix` (non-breaking) resolves it.
- **MEDIUM** — The full fixes for the Sanity chain require `next-sanity@13` / `sanity@6` **major** upgrades (breaking). Do these deliberately in a branch with a full booking+shop regression test, not via `audit fix --force` before launch.
- **INFO** — `@types/react`/`@types/react-dom` pinned to 18 while React is 19; harmless today but a latent type-drift risk.
- **INFO** — Lockfile present and consistent; no git-URL / tarball / local-path deps; no unexpected postinstall scripts beyond the Sanity/esbuild norm.

### 6.3 Secrets & environment variables
- **Verified GOOD** — No secret ever committed. `git rev-list --all` scan for `sk_(live|test)_`, `pk_`, `whsec_`, `re_`, JWT (`eyJ…`), `service_role` across **all** history returned nothing; no `.env*` file appears in history; `.gitignore` covers `.env*` and `.env*.local`.
- **Verified GOOD — module boundary.** Secret-bearing modules (`lib/stripe.ts`, `lib/supabase-admin.ts`, `lib/sanity-server.ts`, `lib/supabase-storage.ts`, `lib/email.ts`) are imported **only** by API routes / other server modules (grep-confirmed). No `NEXT_PUBLIC_` prefix on any server secret. `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SANITY_API_TOKEN` are all server-only.

  **Env inventory (names only):**

  | Var | Scope | Used in | Notes |
  |---|---|---|---|
  | `NEXT_PUBLIC_SANITY_PROJECT_ID` / `_DATASET` | public | sanity clients | fine (public dataset) |
  | `NEXT_PUBLIC_SANITY_API_VERSION` | public | `sanity/env.ts` | optional |
  | `SANITY_API_TOKEN` | secret | import scripts only | **not used by app runtime** (pages fetch published content tokenless) — good |
  | `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | public | `lib/supabase.ts` | anon client not imported client-side; RLS still critical (B4) |
  | `SUPABASE_SERVICE_ROLE_KEY` | secret | admin client + 3 routes | server-only ✓ |
  | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | public | 3 client pages | ✓ |
  | `STRIPE_SECRET_KEY` | secret | `lib/stripe.ts` | ✓ |
  | `STRIPE_WEBHOOK_SECRET` | secret | webhook | ✓ |
  | `LOCAL_STRIPE_WEBHOOK_SECRET` | secret | (unused in code) | local CLI note only; ensure prod uses the dashboard endpoint secret, not this |
  | `RESEND_API_KEY` | secret | email | ✓ |
  | `CONTACT_EMAIL` | server | consent/email | ✓ |
  | `NEXT_PUBLIC_SITE_URL` | public | (declared, unused) | code hardcodes the domain instead — see B5 |

- **LOW** — `.env.local` exists in the working directory (correctly git-ignored, never committed). Fine locally; just never let it reach the repo.
- **MEDIUM (operational)** — Test vs live separation is entirely a Vercel/dashboard discipline; nothing in code distinguishes them. `lib/stripe.ts` will silently use whatever `STRIPE_SECRET_KEY` is set. Add a startup assertion or at least a deployment checklist (see §13) so a test key can't run in production or vice-versa.

### 6.4 Stripe
- **Verified GOOD** — **Server-authoritative pricing.** `checkout/session` accepts only `{name}` and looks up price via `getServicePriceByName` (`route.ts:37-63`); `checkout/sklep` accepts only `productId` and looks up price+file via `getSklepProductById` (`route.ts:27-39`); `booking-consent` looks up price by name (`route.ts:129`). Client prices are ignored. `sanity-server.ts` uses `useCdn:false` and filters `isActive==true`. Inactive/unknown → checkout rejected. Confirmed via smoke test (`{"items":[]}` → 400 "No items in cart").
- **Verified GOOD** — **Webhook signature enforced.** `route.ts:11-34`: raw body via `req.text()`, requires `stripe-signature`, calls `constructEvent` with the secret. Smoke test: no sig → 400; bad sig → 400. Fulfilment is webhook-driven, **not** success-redirect-driven (the redirect only lands on a polling page).
- **BLOCKER B1** — double-fulfilment on `charge.succeeded` + `payment_intent.succeeded` (above).
- **BLOCKER B2** — no idempotency (above).
- **BLOCKER B3** — booking slug/price decoupling (above).
- **HIGH** — **`orders.customer_email` is often `'unknown'`.** Session/booking orders read `pi.receipt_email` (`route.ts:50`), which is null unless a receipt email is set on the PaymentIntent — and it isn't. So paid session/booking orders are stored with `customer_email:'unknown'` (`route.ts:138`). The consent row has the email, but the `orders` row (the payment record) can't be reconciled to a customer by itself. Set `receipt_email`/`customer_email` on PaymentIntent creation, or pull from `booking_consents`/charge billing details.
- **HIGH** — **Order record is not reconciliation-complete.** `orders` stores no PaymentIntent-vs-session distinction beyond `stripe_session_id` (actually the PI id), no Stripe event id, no immutable product identity beyond the name list in metadata, no fulfilment_status separate from `status:'paid'`. Duplicate/refund/dispute handling can't be reasoned about later.
- **MEDIUM** — **Client-controlled currency.** Both checkout routes take `currency` from the request body and pass it to Stripe (`session/route.ts:74`, `sklep/route.ts:50`) while computing the amount as GBP or PLN only. The UI now only offers GBP/PLN (`CurrencyContext.tsx:10` — the documented EUR/USD bug is **resolved**), but a hand-crafted request with `currency:"eur"` would charge the GBP *number* in euros. Whitelist currency server-side to `['gbp','pln']` and reject others.
- **MEDIUM** — **No refund/dispute/`payment_intent.payment_failed` handling.** Not fatal (Stripe dashboard covers refunds), but there's no `orders` state update on refund/chargeback, so internal records drift from Stripe.
- **LOW** — **No idempotency key on PaymentIntent creation.** Rapid double-clicks can create multiple PaymentIntents (only one is confirmed, so no double charge, but it litters Stripe). The buttons disable on submit, mitigating this.
- **INFO** — `allow_redirects:'never'` on all three flows disables BLIK/Przelewy24 (redirect-based). So **no delayed/async payment methods are live** — which conveniently removes the "success before payment settles" race for now. Only card + Apple/Google Pay. If BLIK/P24 are enabled later, `charge.succeeded`/async events and premature-fulfilment must be re-audited.
- **INFO** — API version pinned `2026-05-27.dahlia` (`lib/stripe.ts:8`) — intentional and current.

### 6.5 Supabase
- **BLOCKER B4** — RLS unproven; anon key public (above).
- **Verified GOOD** — Service-role key is server-only; anon client (`lib/supabase.ts`) is **not** imported by any client component (grep-confirmed), so no sensitive browser reads today.
- **HIGH** — **No DB-level idempotency/uniqueness** on `orders.stripe_session_id`, `sklep_orders.stripe_session_id`, or a Stripe event id. This is the storage half of B1/B2 — even after deduping event types, a Stripe retry still double-inserts without a unique index.
- **MEDIUM** — **`booking_tokens` single-use is app-enforced, not atomic.** `consume-booking-token` updates `WHERE status='payment_confirmed'` (`route.ts:22-26`); the webhook confirm updates `WHERE status='pending'` (`route.ts:165-172`). These conditional updates are reasonably safe, but there's no unique/lock guaranteeing a token can't be re-confirmed if resurrected. Token TTL (2h) and expiry check (`verify:39`) are good.
- **MEDIUM** — **Sensitive data breadth in `booking_consents`:** full name, email, phone, typed signature, 7 health/consent booleans, IP, user-agent. This is health-adjacent + a signature. RLS + access minimisation + a retention policy are mandatory before storing real customers (ties to B4 and §6.15).
- **LOW** — Storage bucket assumed private (`supabase-storage.ts` uses `createSignedUrl` with 24h TTL, service-role only). Verify the bucket's public flag is **off** in the dashboard; signed URLs are only meaningful on a private bucket. Signed URLs are emailed (fine) but also `console.log`'d indirectly? — checked: not logged. Good.

### 6.6 Sanity
- **Verified GOOD** — Public pages fetch **published** content with **no token** (`sanity/lib/sanity.ts:11-16`, `useCdn:true`), so no write token reaches the browser. `SANITY_API_TOKEN` is used only by one-off import scripts. GROQ queries are **parameterised** (`$namePl`, `$productId`, `$category`) — no injection. Product IDs (`_id`) are stable.
- **Verified GOOD** — Price fields are `required().positive()` in both schemas (`service.ts:68`, `sklepProduct.ts:104`). `getSklepProductById`/`getServicePriceByName` filter `isActive==true`, so **inactive/draft products cannot be purchased** and drafts aren't served (published perspective).
- **MEDIUM** — **Joanna can publish a service that breaks booking.** `calComSlug` is a free-text field with no validation that it matches a real Cal.com event. An empty/typo'd slug yields `lettinggozenstudio/` (all events) or a broken calendar. Combined with B3, the slug is security-relevant, not just cosmetic.
- **LOW** — `pricePLN` is optional; when absent the app falls back to `gbpToPln` at a hardcoded 5.2 (`sanity-server.ts:45`). Acceptable, but FX drift means displayed vs charged PLN can diverge over time. Consider requiring `pricePLN` or documenting the fixed rate.
- **LOW** — No `nameEn` requirement; English pages fall back to Polish names (intentional for product names, but verify UI labels aren't affected).

### 6.7 Resend / email
- **HIGH** — **Sandbox sender in production.** All three send paths use `from:'onboarding@resend.dev'` (`email.ts:21,87`, `booking-consent/route.ts:203`). Resend's sandbox address only reliably delivers to the account owner and is not for production customer mail — customer download links and consent emails will land in spam or bounce. Verify a real sending domain and switch the `from:` before any real sale.
- **HIGH** — **Paid-but-no-file / email-fail coupling (sklep).** In the webhook, `generateDownloadUrl` + `sendDownloadEmail` + Joanna notify happen **before** the `sklep_orders` insert (`route.ts:94-119`), all inside one try. If email throws, the route returns 500 → Stripe retries → (with B1/B2) re-sends. If email succeeds but insert fails, there's no record the customer was fulfilled. There is **no** durable "paid, awaiting delivery" state and no retry queue. A customer can pay and receive nothing with no operational trace.
- **MEDIUM** — **HTML injection into Joanna's inbox.** `booking-consent/route.ts:206-236` interpolates `serviceName`, `customerFullName`, `customerEmail`, `customerPhone`, `typedSignature` into the email HTML unescaped. Not header injection (values are in the body), but a malicious signature/name can inject markup/links into the notification Joanna reads. Escape before interpolation.
- **MEDIUM** — Booking consent email is sent **at consent time, before payment** (`route.ts:202`). Abandoned checkouts still email Joanna "new consent" and leave a pending token. Move the confirmation to the webhook.
- **LOW** — Email content is Polish-only regardless of buyer locale (`email.ts`, consent route). English buyers get Polish emails.
- **LOW** — Support address inconsistency: emails/legal use `lettinggozenstudio@gmail.com`; homepage JSON-LD uses `joanna@lettinggozenstudio.com`. Pick one.

### 6.8 Booking (Cal.com)
- **CRITICAL** — **Payment gating is website-only; the Cal.com calendar is publicly bookable.** The token gate controls the on-site embed, but `cal.com/lettinggozenstudio/<slug>` is a public URL. Anyone who knows/guesses a slug (they're deterministic — see `lib/calcom.ts`) can book a session directly on Cal.com **without paying**. The site cannot enforce payment on the provider unless Cal.com itself requires payment or the events are private. **Verify in Cal.com that events are either payment-gated or unlisted/private; otherwise the entire pay-first model is bypassable.**
- **BLOCKER B3** — cheap-price-unlocks-expensive-service (above), which is the booking layer's price-integrity hole.
- **MEDIUM** — `Cal calLink={CAL_USERNAME}/${calSlug}}` (`rezerwacja/page.tsx:278`) uses `calSlug` from the token's `service_id`, which originated from an unvalidated URL param (B3). No allow-list of slugs.
- **LOW** — No recovery path if the webhook confirms but the customer closes the tab before booking: the token sits `payment_confirmed` for 2h then expires; after that a paid customer cannot book and there's no admin re-issue flow. The `failedText` message tells them to email Joanna (good), but reconciliation is manual.
- **INFO** — Timezone/DST handled by Cal.com (no manual offsets in code) — good.

### 6.9 APIs & general security
- **Verified** (smoke test): malformed JSON to `/api/checkout/session` → 500 with generic `"Failed to create payment intent"` (no stack/secret leak); fake token → 404 `not_found`; webhook missing/blank sig → 400. Error bodies don't leak internals.
- **MEDIUM** — **No rate limiting anywhere.** `/api/contact`, `/api/booking-consent`, both checkout routes, and `verify-booking-token` are unauthenticated and unthrottled. `booking-consent` writes two DB rows + sends an email per call → cheap spam/DoS + inbox flooding + junk pending tokens. Add rate limiting (Vercel/edge or Upstash) and a bot check on contact + consent.
- **MEDIUM** — **No input length caps.** Contact `message`, consent `typedSignature`/names accept unbounded strings straight into Supabase. Add max lengths.
- **LOW** — `/api/contact` has no spam/bot protection (no honeypot/CAPTCHA). Given low traffic, a honeypot + rate limit is proportionate; CAPTCHA not required yet.
- **INFO** — No SSRF/LFI/path-traversal surface: file names come from Sanity (server), not the client; `next/image` remotePatterns restricted to `cdn.sanity.io`.

### 6.10 Frontend / Next.js
- **Verified GOOD** — Server/client boundary clean; no secret serialised into props; anon Supabase not used client-side; `next/image` host restricted.
- **MEDIUM** — see §6.1 duplicate `html/body`.
- **LOW** — `koszyk` reads booking params from `window.location.search` and can `addItem` from URL (`koszyk/page.tsx:227-241`) — leftover, harmless (price re-validated server-side at checkout) but dead.
- **INFO** — Cart/currency state is in-memory React context (resets on reload); no sensitive data in localStorage/sessionStorage. Good.

### 6.11 Security headers & transport
- **MEDIUM** — **No security headers.** Smoke test of `/pl` response showed only `X-Powered-By: Next.js` and **no** HSTS, CSP, X-Frame-Options/frame-ancestors, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy. Vercel gives HTTPS, but `/studio` (embedded Sanity) has no clickjacking protection and there's no CSP. Add a `headers()` block in `next.config.mjs` with a Stripe/Sanity/Cal.com-aware CSP, `frame-ancestors 'self'`, HSTS, `nosniff`, and a strict Referrer-Policy. Remove `X-Powered-By`.

### 6.12 i18n & currency
- **Verified GOOD** — `pl.json` and `en.json` have **identical 672-key structures** (zero drift). Locale routing validates locale (`i18n/request.ts` → `notFound()` on invalid; smoke test `/pl/nonexistent` → 404). Both `/pl` and `/en` render 200 across all pages.
- **LOW** — Some hardcoded bilingual strings remain in `sklepClient.tsx` and category empty-states (per AGENTS.md; the shop/nav-search labels are inline). Cosmetic; won't break, but bypasses next-intl.
- **INFO** — Currency now GBP/PLN only (EUR/USD removed) — the historical mis-charge bug is gone.

### 6.13 Accessibility
- **MEDIUM (aggregate)** — Not exhaustively tested, but code-level concerns: the Cal embed and modal focus management aren't verified; consent checkboxes use `<label>` wrappers (good); form fields have `<label htmlFor>` (good, in `zgoda-rezerwacja`). Payment error text is color-only (`#ff6b6b`) without an ARIA role/announcement. Recommend a keyboard + screen-reader pass on the booking/checkout modals and adding `role="alert"` to error regions. Not a release blocker.

### 6.14 Performance
- **LOW** — `/studio` route is 1.51 MB JS (expected for Sanity Studio; it's admin-only and `noindex`).
- **LOW** — Redundant font loading (§6.1) adds a render-blocking external `@import`.
- **MEDIUM (reliability)** — The **webhook does heavy synchronous work** (Storage signed-URL + 2 Resend calls + DB insert) before responding to Stripe (`route.ts:94-119`). Under a slow Resend/Storage this risks Stripe's timeout → Stripe retries → (with no idempotency) duplicate fulfilment. Acknowledge fast + move fulfilment to a durable queue, or at least make it idempotent (B2).

### 6.15 SEO
- **MEDIUM** — Sitemap/robots/canonical hardcode `www.lettinggozenstudio.com` (B5) — until the domain is live these point nowhere and the `vercel.app` deploy risks being indexed. Add `noindex` on non-production hosts.
- **MEDIUM** — **JSON-LD business email mismatch** (`joanna@…` vs `lettinggozenstudio@gmail.com`) and JSON-LD phone/address should be confirmed against Joanna's real details.
- **INFO** — Metadata, OG, hreflang alternates, and LocalBusiness schema are otherwise well-formed. `robots` disallows `/studio/` and `/api/`. Sitemap correctly excludes cart/booking/consent.

### 6.16 Privacy & legal
- **HIGH** — **Legal pages are real content but not confirmed solicitor-reviewed.** `legal.terms/serviceTerms/consent/privacy` exist in messages with substantive content (business identity "42 Leslie Road, Aberdeen AB24 4EF", self-employed, contact email). They are **not placeholders** (no TODO/lorem). But taking real payments + storing health-adjacent consent + signatures requires a professional privacy/terms review, a defined retention period, and a documented data-subject-access/erasure process — none of which is evidenced.
- **MEDIUM** — **Health-claim wording is mostly careful** — the site explicitly states "Nie diagnozuję ani nie leczę" ("I do not diagnose or treat"), and consent requires acknowledging the service "is not medical treatment." This is the right posture for Stripe's restricted-business rules. Still, have Joanna/legal confirm no individual service description implies cure/diagnosis of a named condition, and that Stripe accepts the business category.
- **MEDIUM** — Cookie usage: `NEXT_LOCALE` (functional) — likely fine without a banner under UK PECR, but confirm no analytics cookies are added later without disclosure.

### 6.17 Vercel & deployment
- Cannot inspect from repo. Checklist in §11. Key risks: env test/live separation, production branch = `main`, domain binding (B5), function logs not leaking secrets/PII (the code `console.log`s `orderType` + customer email at `route.ts:79,86` — **PII in logs**, MEDIUM: scrub before production).

### 6.18 Domain & DNS
- Unverified; full checklist in §11. B5 gates this.

---

## 7. STRIPE SECURITY VERDICT

| Question | Answer |
|---|---|
| Is pricing server-authoritative? | **Yes** — for the *amount charged*. Verified. But the *service booked* is not tied to the amount (B3). |
| Is the webhook genuine and verified? | **Yes.** Signature enforced, raw body, secret checked. Verified by test. |
| Is fulfilment webhook-driven? | **Yes.** Success redirect only lands on a polling page; entitlements come from the signed webhook. |
| Is webhook processing idempotent? | **No.** No event-id/unique constraint. Sklep fulfils twice per payment even without retries (B1); retries duplicate everything (B2). |
| Are delayed payments handled? | **N/A today** — `allow_redirects:'never'` disables BLIK/P24; only card + wallets. Re-audit if enabled. |
| Can payment be bypassed? | **On-site, no.** **At the provider, likely yes** — the Cal.com calendar is publicly bookable outside the paywall (CRITICAL, §6.8). Verify Cal.com gating. |
| Can a cheaper product unlock a more expensive service? | **Yes (B3).** Independent slug/name URL params. |
| Can live and test be mixed? | **Possible** — nothing in code prevents it; purely dashboard discipline. |
| Can Joanna's live account be connected safely **now**? | **No.** Fix B1–B3, confirm Cal.com gating, then connect. |

## 8. SUPABASE SECURITY VERDICT

| Question | Answer |
|---|---|
| Is the service-role key server-only? | **Yes.** Verified — imported only by API/server modules. |
| Is RLS proven? | **No.** No migrations/policies in repo; must verify in dashboard (B4). |
| Are sensitive tables protected? | **Unproven.** Anon key is public; if RLS is off, `booking_consents`/`orders`/etc. are exposed. |
| Are DB constraints sufficient? | **No.** No unique index on Stripe ids; idempotency relies on app logic only. |
| Is paid storage private? | **Probably** (code uses signed URLs), but the bucket public-flag must be confirmed in dashboard. |
| Are signed URLs safe? | **Yes** — 24h TTL, service-role generated, not logged. |
| Is webhook idempotency enforced in the DB? | **No.** Add a unique constraint / `stripe_events` table. |

## 9. SANITY VERDICT

| Question | Answer |
|---|---|
| Are CMS tokens safe? | **Yes.** No token in the browser; public pages read published content tokenless; write token only in import scripts. |
| Can Joanna publish invalid/dangerous products? | **Partially.** Price is `required().positive()`; digital `fileName` is required. But `calComSlug` is unvalidated free text → broken/misrouted bookings (compounds B3). |
| Are prices & product states validated? | **Yes** server-side (`isActive==true`, positive price, parameterised GROQ). |
| Can draft/inactive products be purchased? | **No.** Filtered out server-side. |
| Can Sanity data be manipulated into unsafe checkout? | **Not via GROQ injection** (parameterised). The risk is the human-entered `calComSlug` + the B3 param decoupling, not Sanity itself. |

---

## 10. FUNCTIONAL TEST MATRIX

| Journey | Result | Evidence | Risk | Follow-up |
|---|---|---|---|---|
| All 19 PL/EN pages render | **Pass** | curl 200 on all (§2) | — | — |
| Unknown route 404 | **Pass** | `/pl/nonexistent` → 404 | — | — |
| sitemap.xml / robots.txt | **Pass (content)** | 200; but wrong host (B5) | Med | Bind domain |
| Checkout empty cart | **Pass** | → 400 "No items in cart" | — | — |
| Checkout malformed JSON | **Pass** | → 500 generic, no leak | — | — |
| Verify forged token | **Pass** | → 404 `not_found` | — | — |
| Webhook missing signature | **Pass** | → 400 | — | — |
| Webhook forged signature | **Pass** | → 400 "signature failed" | — | — |
| Server-side price (cart/sklep/booking) | **Pass (code)** | price by name/id from Sanity | — | — |
| Duplicate webhook → single fulfilment | **Fail (code)** | no idempotency; sklep double (B1/B2) | **Blocker** | Fix B1/B2 |
| Cheap price → expensive booking | **Fail (code)** | slug/name decoupled (B3) | **Blocker** | Fix B3 |
| Booking without paying (on-site) | **Pass** | gate requires `payment_confirmed` | — | — |
| Booking without paying (Cal.com direct) | **Unverified / likely Fail** | public calendar (§6.8) | **Critical** | Verify Cal.com gating |
| Sklep paid but email fails | **Fail (code)** | 500→retry→dupe; no delivery trace | High | Durable fulfilment state |
| Contact form spam/flood | **Fail (code)** | no rate limit/bot check | Med | Rate limit |
| Live charge end-to-end | **Not run** | no real charge created (by policy) | — | Run controlled test in live (§13) |
| Currency GBP/PLN consistency | **Pass** | GBP/PLN only; server computes amount | Med (client currency trusted) | Whitelist currency |

---

## 11. EXTERNAL DASHBOARD CHECKLIST

**Stripe** — [ ] Joanna is legal owner; [ ] identity/KYC complete; [ ] business type/name/trading name/address correct; [ ] payout bank = Joanna; [ ] statement descriptor recognisable; [ ] website URL = final domain; [ ] card + Apple/Google Pay enabled; [ ] Apple Pay domain registered (after domain live); [ ] **live** webhook endpoint on final HTTPS domain subscribed to the events the code handles; [ ] live webhook secret in Vercel prod only; [ ] no test keys in prod / live keys in preview; [ ] Radar reviewed; [ ] dispute email monitored; [ ] restricted-business (wellness/health) accepted.

**Vercel** — [ ] repo/branch = `main`; [ ] env vars split test(preview/dev) vs live(prod); [ ] final domain bound + HTTPS; [ ] apex↔www redirect; [ ] function logs reviewed for PII/secrets; [ ] rollback available.

**Supabase** — [ ] **RLS enabled on every table** with no public policies (B4); [ ] `sklep-products` bucket is **private**; [ ] unique constraint on Stripe ids added (B2); [ ] retention/erasure process for `booking_consents`; [ ] backups understood.

**Sanity** — [ ] project ownership = Joanna; [ ] member roles minimal; [ ] `SANITY_API_TOKEN` scope minimal (or unused in prod); [ ] production dataset selected; [ ] CORS origins limited to the real domain; [ ] content export/backup.

**Resend** — [ ] real sending domain verified; [ ] SPF/DKIM/DMARC set; [ ] `from:` switched off `onboarding@resend.dev`; [ ] bounce/complaint handling; [ ] API key scope.

**Cal.com** — [ ] account/event ownership; [ ] **events payment-gated or private** (§6.8); [ ] each Sanity `calComSlug` matches a real event; [ ] calendar connected; [ ] timezone/availability/notice/cancellation set; [ ] Google Meet only for online services; [ ] correct location for in-person.

**DNS/Domain** — [ ] apex + www records; [ ] HTTPS cert; [ ] canonical host decided; [ ] old vercel.app deindexed; [ ] Search Console + sitemap submitted after go-live.

---

## 12. PRIORITISED REMEDIATION PLAN

**Tier 1 — Payment-integrity blockers (developer)**
1. **B1** — `app/api/webhooks/stripe/route.ts`: fulfil on **one** event type. Remove `charge.succeeded` from sklep fulfilment (or handle only `payment_intent.succeeded`). *Verify:* trigger a test payment in Stripe test mode with `stripe listen`; confirm exactly one email/order.
2. **B2** — Add a `stripe_events(id text primary key)` insert (or unique index on PaymentIntent id) and short-circuit already-processed events; make order inserts upserts on a unique key. *Verify:* replay the same event via Stripe CLI; confirm no duplicate.
3. **B3** — Derive the Cal.com slug server-side from the priced Sanity service (store the service's own `calComSlug` on the token from the server lookup, not the URL param). *Verify:* craft a URL with mismatched `service`/`serviceName`; confirm the booked calendar matches the paid service.
4. **§6.8 (Critical)** — Confirm/enable Cal.com payment-gating or private events (Joanna + developer). *Verify:* attempt a direct `cal.com/lettinggozenstudio/<slug>` booking without paying — must be blocked.

**Tier 2 — Data-protection blockers**
5. **B4** — Enable RLS on all tables, verify no public policies (Joanna's Supabase, developer-guided). *Verify:* with the public anon key, attempt `select` on `booking_consents` via REST → must return zero/forbidden.
6. Confirm `sklep-products` bucket private; add unique constraints (with B2).
7. Scrub PII from `console.log` (`route.ts:79,86`).

**Tier 3 — Reliability / fulfilment**
8. **§6.7** — Switch Resend to a verified domain; add a durable "paid/awaiting-delivery/delivered" state so a paid customer never silently gets nothing; move consent email to the webhook; escape email HTML.
9. **§6.4** — Set `receipt_email`/`customer_email` on PaymentIntent so `orders` is reconcilable; whitelist currency server-side.

**Tier 4 — Functional / config blockers**
10. **B5** — Bind final domain; update hardcoded URLs (or use `NEXT_PUBLIC_SITE_URL`); then create live Stripe webhook + Apple Pay + Resend domain against it.
11. Add security headers + CSP in `next.config.mjs`; remove `X-Powered-By`.
12. Add rate limiting + length caps to `contact` and `booking-consent`.

**Tier 5 — Legal/commercial**
13. Solicitor review of terms/privacy/service-rules/consent; define retention + erasure; confirm Stripe accepts the business; align business email everywhere.

**Tier 6 — Reliability/perf/a11y/cleanup**
14. Fix duplicate `html/body`; add `bg-texture.jpg` or remove the reference; resolve font double-load; delete `booking-pending`, dead `koszyk` code, unused `styled-components`; upgrade `undici` (`npm audit fix`), plan the Sanity major upgrades in a branch; a11y pass on modals + `role="alert"`.

---

## 13. SAFE STRIPE ACTIVATION SEQUENCE

> **Do not connect live keys until Tier 1–2 blockers (B1, B2, B3, §6.8, B4) are fixed and verified.** **Never** put live keys in source or Git — only in Vercel Production env.

1. Confirm Joanna owns the Stripe account; identity/KYC complete.
2. Confirm payout bank + payout schedule + recognisable statement descriptor.
3. Confirm business profile, refund/cancellation/privacy/terms pages match the site.
4. Bind the **final production domain** in Vercel (B5) and confirm HTTPS.
5. Confirm enabled payment methods + currencies (GBP/PLN) match the code.
6. Re-confirm all live product/service prices in Sanity.
7. In Vercel **Production only**: add live `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`. Keep **test** keys in Preview/Development.
8. In Stripe **live mode**, create a **new** webhook endpoint at `https://<final-domain>/api/webhooks/stripe`, subscribing only to the events the code handles (after B1 fix: `payment_intent.succeeded`; add async/refund events only if you build handlers).
9. Add the **live** webhook signing secret to Vercel Production (`STRIPE_WEBHOOK_SECRET`). Do not reuse the local CLI secret.
10. Deploy. Confirm the deployment reports live mode (e.g. publishable key prefix `pk_live_` in the client) **without printing secrets**.
11. Complete Apple Pay domain registration and Resend sender-domain verification against the final domain.
12. Perform **one controlled live purchase** with a real card (test cards don't work in live) — prefer the lowest-price real digital product or a temporary internal product.
13. Verify: Stripe payment succeeded → exactly **one** `sklep_orders`/`orders` row → webhook received & signature-verified → **no duplicate** on retry → customer email delivered → Joanna notified → download link (or booking entitlement) works → booking completes if applicable.
14. Refund the controlled purchase in Stripe; confirm it reflects in records; remove any temporary test product.
15. Review production function logs for secret/PII leakage; monitor the first genuine transactions closely; keep a documented rollback (previous deployment) ready.

---

## 14. FINAL LAUNCH CHECKLIST

- **Complete:** clean build & typecheck; server-authoritative pricing; webhook signature verification; translation parity; no committed secrets; server/client secret isolation; inactive/draft products unpurchasable.
- **Incomplete (must fix):** webhook idempotency (B1/B2); booking slug/price binding (B3); domain binding (B5); security headers; Resend production sender; rate limiting; email-failure fulfilment safety; solicitor legal review.
- **Unverified (dashboard/live):** Supabase RLS (B4); Storage bucket privacy; Cal.com payment-gating; Stripe account/KYC/webhook/methods; Resend DNS; Vercel env separation; DNS.
- **Not applicable (today):** delayed-payment (BLIK/P24) handling; EUR/USD (removed); physical/bundle/course fulfilment (not sellable).

---

## 15. FINAL DIRECT ANSWER

**Can the website be fully released today?** **NO**

**Can Joanna's real Stripe account be connected today?** **NO**

**Can real customer payments be accepted today?** **NO**

**The exact remaining conditions are:**
1. **Fix B1** — stop sklep double-fulfilment (webhook handles both `charge.succeeded` and `payment_intent.succeeded`).
2. **Fix B2** — add DB-enforced webhook idempotency (unique Stripe event/PaymentIntent id).
3. **Fix B3** — bind the Cal.com slug to the priced service server-side; a crafted URL must not let a cheap payment book an expensive service.
4. **Resolve §6.8** — confirm/enable Cal.com payment-gating or private events so the calendar can't be booked directly without paying.
5. **Verify B4** — enable and prove Supabase RLS on all tables (anon key is public); confirm the `sklep-products` bucket is private.
6. **Resolve B5** — bind the final production domain and align sitemap/robots/canonical/JSON-LD, then create the live Stripe webhook against it.
7. **Switch Resend** off the sandbox sender to a verified domain, and make sklep fulfilment safe when email fails (no silent "paid, got nothing").
8. **Add** security headers/CSP, rate limiting on public write endpoints, and scrub PII from logs.
9. **Complete** a professional legal/privacy review and confirm Stripe accepts the wellness business category.
10. Then run the controlled live end-to-end purchase in §13 before opening to real customers.
```
