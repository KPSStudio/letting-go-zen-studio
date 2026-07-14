# AGENT.md — Letting Go Zen Studio Project Guide

**For:** VS Code Claude, Claude.ai, and any developer working on this project
**Project:** Letting Go Zen Studio — Bilingual (Polish/English) E-Commerce + Booking Platform
**Status:** Shop upgraded — productType spine, site-wide search, accent-insensitive matching, product images · Bookings bypass the cart
**Updated:** June 29, 2026 · _Verified against a full read of the live source_

> Where this file disagrees with `CLAUDE.md` (the older master brief), **this file wins.** The
> brief predates several decisions and has stale values (Next.js 14, Cinzel/Raleway fonts, a flat
> background, the cart-based booking flow). Everything below was checked against the real code.
>
> ⚠️ This file is git-ignored (`.gitignore` lists `AGENTS.md`, `CLAUDE.md`). It is a **local
> reference only** — a fresh clone won't include it, and it is not deployed.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure (Actual)](#3-directory-structure-actual)
4. [Core Architecture](#4-core-architecture)
5. [The Three Checkout Flows (End-to-End)](#5-the-three-checkout-flows-end-to-end)
6. [Key Files & Their Exact Roles](#6-key-files--their-exact-roles)
7. [Important Rules & Constraints](#7-important-rules--constraints)
8. [Common Tasks](#8-common-tasks)
9. [Debugging & Troubleshooting](#9-debugging--troubleshooting)
10. [Audit Findings — Known Issues](#10-audit-findings--known-issues)
11. [Go-Live Checklist](#11-go-live-checklist)
12. [Final Notes for Developers](#12-final-notes-for-developers)

---

## 1. PROJECT OVERVIEW

### What Is This Project?

**Letting Go Zen Studio** is an e-commerce and secure booking platform for Joanna Witkowska's
holistic-therapy business in Aberdeen, Scotland. It serves UK and Polish audiences across three
service themes, with all service content managed in Sanity (so the live list is data-driven):

- **Ciało (Body):** Physical therapies — Biorezonans, Biofeedback (Skan Ciała / Wspierająca
  Regeneracja), Presoterapia (30/60 min), Hocell hydrogen inhalation (1-person, 2-person, 5-session
  packages).
- **Umysł (Mind):** Subconscious & energy work — Hipnoterapia, Konsultacja Energetyczna, Alchemik
  (single session / 5-session package).
- **Dusza (Soul):** Spiritual analysis — Pakiet Jasność Umysłu, Przeznaczenie (PDF report),
  Zdjęcie i Analiza Aury + Chakr.

> The exact services and prices come from Sanity, not the code. The lists above describe the
> current catalogue, but treat Sanity as the source of truth.

### What Does It Do?

1. **Showcases services** across Body/Mind/Soul with bilingual descriptions, pricing, duration,
   availability, and detail modals.
2. **Captures legally-sound consent** before any booking (the `zgoda-rezerwacja` page).
3. **Takes Stripe payments** with **server-side price validation** — the client cannot spoof a price.
4. **Secures bookings** with a token-based three-state machine (`pending → payment_confirmed → used`).
5. **Unlocks the Cal.com calendar** only after payment is verified.
6. **Sells digital products** (`/sklep`) with automatic instant delivery (emailed download link).
7. **Serves both languages** with persistent language choice (cookie).

### Key Architecture Principles

✅ **Zero client-side trust** — prices are always re-fetched from Sanity; URL/cart prices are ignored.
✅ **Token state machine** — only the Stripe webhook can advance a token to `payment_confirmed`.
✅ **Cal.com gating** — the calendar renders only when the token is `payment_confirmed`.
✅ **Bookings skip the cart** — booking payment happens on the consent page (recent refactor).
✅ **Bilingual routing** — next-intl with URL locale prefix + cookie persistence.
✅ **Audit trail** — consent saved to Supabase with IP + user-agent.

### Who Builds It

Developed and maintained by **KPS Studio** (the developer's brand) on a retainer. **All accounts**
(GitHub, Vercel, Stripe, Sanity, Supabase, Namecheap, Cal.com) are in **Joanna's** name; the
developer is a collaborator/member only — never owner.

---

## 2. TECHNOLOGY STACK

### Framework & Core (exact, from `package.json`)

- **Next.js** ^15.5.19 (App Router)
- **React** / React-DOM ^19.2.7
- **TypeScript** 5.8.3 (strict mode; `@types/react` pinned to 18 — harmless)
- **Tailwind CSS** 4.1.8 (+ `@tailwindcss/postcss`)

### Internationalization

- **next-intl** 4.13.0 — `messages/pl.json` (Polish, default) + `messages/en.json` (English)

### CMS & Data

- **Sanity** ^3.99.0 + **next-sanity** ^9.12.3 (`@sanity/client` 7.22.1, `@sanity/image-url` 2.1.1,
  `@sanity/vision` 3.99). Server price client uses `useCdn: false` for real-time pricing.
- **Supabase** (`@supabase/supabase-js` ^2.107.0) — Postgres + Storage. Tables: `booking_tokens`,
  `booking_consents`, `orders`, `sklep_orders`, `contact_submissions`. Storage bucket: `sklep-products`.
- **Stripe** server SDK ^22.2.0 (API `2026-05-27.dahlia`); client `@stripe/react-stripe-js` ^6.6.0,
  `@stripe/stripe-js` ^9.7.0. Webhook at `/api/webhooks/stripe` is the only trusted payment authority.
- **Resend** ^6.12.4 — currently sends from the sandbox `onboarding@resend.dev` (custom domain pending).

### Booking

- **Cal.com** via `@calcom/embed-react` ^1.5.3. Username `lettinggozenstudio`; each service has a
  slug; the calendar is gated behind token verification.

### Build / Deploy

- **IDE:** WebStorm · **Terminal:** PowerShell (Windows) · **VCS:** Git + GitHub (`main` only)
- **Hosting:** Netlify (demo) · Vercel (planned production, auto-deploy from `main`)
- `next.config.mjs` sets `eslint.ignoreDuringBuilds: true` (an ESLint version blocked Vercel) and
  whitelists `cdn.sanity.io` under `images.remotePatterns` so `next/image` can render Sanity-hosted
  product photos. **Changing next.config requires a dev-server restart — it does NOT hot-reload.**
- Path alias `@/*` → project root.

**Running costs after launch: ~£10/yr domain + Stripe per-transaction fees.**

---

## 3. DIRECTORY STRUCTURE (ACTUAL)

```
letting-go-zen-studio/
│
├── app/
│   ├── layout.tsx                  # Root layout (minimal <html><body>)
│   ├── globals.css                 # MASTER STYLESHEET — all tokens, animations, component CSS
│   ├── sitemap.ts                  # pl+en × public routes (no cart/booking/consent pages)
│   ├── robots.ts                   # allow / · disallow /studio/ + /api/
│   │
│   ├── studio/                     # Embedded Sanity Studio at /studio
│   │   ├── layout.tsx
│   │   └── [[...tool]]/page.tsx
│   │
│   └── [locale]/                   # pl / en
│       ├── layout.tsx              # Fonts + per-locale metadata + Providers + UtilityBar/Nav/Footer
│       ├── page.tsx                # Homepage (Hero + CUDPillars + JSON-LD LocalBusiness)
│       │
│       ├── body/page.tsx           # Ciało — server component → BodyClient.tsx
│       ├── mind/page.tsx           # Umysł — server component → MindClient.tsx
│       ├── soul/page.tsx           # Dusza — server component → SoulClient.tsx
│       ├── sklep/page.tsx          # Digital shop — server component → SklepClient.tsx
│       │
│       ├── zgoda-rezerwacja/page.tsx   # BOOKING CONSENT + INLINE PAYMENT (consent → Stripe here)
│       ├── rezerwacja/page.tsx     # BOOKING GATE: polls token → renders Cal.com → consumes token
│       ├── booking-pending/page.tsx    # ⚠ DEPRECATED — merged into rezerwacja; no flow uses it
│       ├── koszyk/page.tsx         # CART + Stripe (non-booking items) + post-booking thank-you
│       │
│       ├── o-mnie/page.tsx         # About Joanna (photo + bio + Alchemik CTA)
│       ├── kontakt/page.tsx        # Contact form (→ /api/contact) + WhatsApp/email/socials
│       ├── wspolpraca/page.tsx     # "How I work" / protocol (CTA links to /kontakt)
│       ├── regulamin/page.tsx                 # Terms (t()-driven content)
│       ├── polityka-prywatnosci/page.tsx      # Privacy / RODO (t()-driven)
│       ├── zasady-uslug/page.tsx              # Service rules (t()-driven)
│       └── zgoda-swiadoma/page.tsx            # Informed consent (t()-driven)
│
│   └── api/
│       ├── booking-consent/route.ts     # Save consent + create pending token; returns the token
│       ├── checkout/session/route.ts    # Stripe PaymentIntent for cart + bookings; server price
│       ├── checkout/sklep/route.ts      # Stripe PaymentIntent for digital products
│       ├── verify-booking-token/route.ts# Returns token status (used by polling + the gate)
│       ├── consume-booking-token/route.ts# Marks token 'used' after a successful booking
│       ├── contact/route.ts             # Contact form → Supabase contact_submissions
│       └── webhooks/stripe/route.ts     # ONLY place a payment is confirmed (signed)
│
├── components/
│   ├── home/        Hero.tsx, CUDPillars.tsx
│   ├── layout/      Nav.tsx, UtilityBar.tsx, Footer.tsx, NavSearch.tsx
│   ├── body/        bodyClient.tsx     # Service grid + modal + cart/booking routing
│   ├── mind/        mindClient.tsx     # Same pattern as bodyClient
│   ├── soul/        soulClient.tsx     # Same pattern as bodyClient
│   ├── sklep/       sklepClient.tsx    # Shop: search + image cards → legal step → Stripe payment
│   └── ui/          (empty)
│
├── lib/
│   ├── sanity-server.ts   # SERVER-ONLY price authority (useCdn:false). Never import client-side.
│   ├── stripe.ts          # Server Stripe client
│   ├── supabase.ts        # Anon client (browser-safe)
│   ├── supabase-admin.ts  # Service-role client (server only)
│   ├── supabase-storage.ts# 24h signed download URLs (sklep-products bucket)
│   ├── email.ts           # Resend: sendDownloadEmail(), sendOrderNotificationToJoanna()
│   ├── calcom.ts          # CAL_USERNAME + hardcoded slug map + getCalSlug() fallback
│   ├── CartContext.tsx    # useCart() — items, addItem/removeItem/clearCart, count, totalGBP/PLN
│   ├── CurrencyContext.tsx# useCurrency() — GBP/PLN/EUR/USD, RATES, SYMBOLS, formatPrice()
│   ├── localeRouting.ts   # buildLocaleHref() — switch locale while preserving query/flow state
│   └── normalizeText.ts   # accent-insensitive search helper (odpornosc → odporność; ł → l)
│
├── sanity/
│   ├── schemas/    service.ts, sklepProduct.ts, testimonial.ts, siteSettings.ts, galleryImage.ts
│   ├── lib/        sanity.ts (public client + TS types + fetchers), client.ts, image.ts, live.ts
│   ├── env.ts, structure.ts, schemaTypes/index.ts   # (schemaTypes/index is unused scaffold)
│
├── messages/       pl.json, en.json     # ALL UI text (structures must match)
├── i18n/request.ts                       # next-intl message loader
├── middleware.ts                         # Locale routing + NEXT_LOCALE cookie
├── sanity.config.ts                      # Studio config + custom desk (Body/Mind/Soul/Sklep/...)
├── scripts/        importProducts.ts, importSklepProduct.ts   # One-off Sanity importers
├── public/images/  logo.png, Joanna-photo.png, Eye*.png, bg-texture.jpg
├── next.config.mjs, postcss.config.mjs, eslint.config.mjs, tsconfig.json
└── AGENTS.md, CLAUDE.md, README.md
```

---

## 4. CORE ARCHITECTURE

### 1. THE BOOKING TOKEN STATE MACHINE

**This is the security backbone.** Every booking goes through a token whose state only ever moves
forward, and only the right actor can move it.

```
┌──────────────────────────────────────────────────────────────────┐
│ BOOKING TOKEN LIFECYCLE  (Supabase: booking_tokens)               │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│ 1. PENDING — created by /api/booking-consent                      │
│    • 64-char hex token, expires_at = now + 2 hours                 │
│    • consent saved, awaiting payment                               │
│    • the client CANNOT advance this state                          │
│                                                                    │
│ 2. PAYMENT_CONFIRMED — advanced by the Stripe webhook ONLY        │
│    • Stripe's signed webhook fired payment_intent.succeeded        │
│    • /rezerwacja gate checks this state                            │
│    • Cal.com embed renders only in this state                      │
│                                                                    │
│ 3. USED — advanced by /api/consume-booking-token                  │
│    • Cal.com booking succeeded → token can't be reused             │
│                                                                    │
│ • EXPIRED — if still pending after 2h, verify treats it invalid    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Why this design?**

- ✅ A user cannot fake a booking by editing a URL — the gate checks server state.
- ✅ Only Stripe's cryptographically-signed webhook can confirm payment.
- ✅ Tokens are single-use and auto-expire.

**Supabase `booking_tokens` (observed columns):**

```sql
CREATE TABLE booking_tokens (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token                     TEXT UNIQUE,        -- 64-char hex
  status                    TEXT,               -- 'pending' | 'payment_confirmed' | 'used'
  service_id                TEXT,               -- Cal.com slug
  service_name              TEXT,               -- Polish service name
  price_gbp                 NUMERIC,            -- server-validated price
  customer_email            TEXT,
  locale                    TEXT,               -- 'pl' | 'en'
  stripe_payment_intent_id  TEXT,
  expires_at                TIMESTAMP,          -- now + 2h
  created_at                TIMESTAMP DEFAULT now()
);
```

### 2. SERVER-SIDE PRICE VALIDATION (CRITICAL)

**Golden rule: never trust a price from the client. Always fetch from Sanity.**

```typescript
// ❌ INSECURE — never do this
const amount = req.body.price * 100; // user could send 0.01

// ✅ SECURE — always do this (see lib/sanity-server.ts)
const realPrice = await getServicePriceByName(serviceName);
if (!realPrice)
  return NextResponse.json({ error: "Service not found" }, { status: 400 });
const amount = realPrice.priceGBP * 100;
```

Where it happens:

- `/api/booking-consent` — looks up the real price before creating the token.
- `/api/checkout/session` — re-fetches each item's price by name before creating the PaymentIntent.
- `/api/checkout/sklep` — fetches price **and** filename by product id (client can't request an
  arbitrary file).
- `/api/webhooks/stripe` — trusts only Stripe's signed event.

`lib/sanity-server.ts` uses `useCdn: false` so prices are always fresh (never a cached value), and
only returns rows where `isActive == true`.

### 3. CAL.COM SLUG RESOLUTION

```
bodyClient / mindClient / soulClient → getConsentHref(product):
    slug = product.calComSlug ?? getCalSlug(product.namePl) ?? ''
           └ Priority 1: Sanity   └ Priority 2: lib/calcom.ts map   └ fallback: empty
```

- **Priority 1** — Sanity `calComSlug` (hidden in Studio unless `requiresBooking = true`).
- **Priority 2** — hardcoded map in `lib/calcom.ts` (`CAL_USERNAME = 'lettinggozenstudio'`).
- Empty slug → calendar link becomes `lettinggozenstudio/` (shows all events; works but unfiltered).
- **Deprecation plan:** once every service has a Sanity `calComSlug`, delete `lib/calcom.ts` and the
  `getCalSlug` imports in the three category clients.

### 4. BILINGUAL ROUTING WITH PERSISTENCE

```
Request → middleware.ts
  ├─ /studio or /api?  → skip i18n
  ├─ URL already /pl or /en?  → set NEXT_LOCALE cookie, continue
  ├─ cookie set & URL un-prefixed?  → redirect to /{cookie}{path}
  └─ otherwise  → next-intl default (pl)
[locale]/layout.tsx → NextIntlClientProvider → CurrencyProvider → CartProvider → UI
Components: const t = useTranslations('namespace'); const locale = useLocale()
Language switch (Nav / UtilityBar / mobile drawer) → buildLocaleHref(pathname, search, newLocale)
  • preserves query params + the `locale` query value, so switching language mid-checkout
    does NOT reset consent / payment / booking state.
Cookie: NEXT_LOCALE, 1 year, used by middleware on every request.
```

### 5. CURRENCY MODEL

`CurrencyContext` supports **GBP, PLN, EUR, USD** (rates: GBP 1, PLN 5.2, EUR 1.17, USD 1.27) and a
`formatPrice()` for display. State is **in-memory only** (resets on reload).

> ⚠️ **Only GBP and PLN are charged correctly.** The checkout routes compute the amount in GBP pence
> for any non-PLN currency, but pass the selected currency code to Stripe — so EUR/USD would charge
> the GBP _number_ in euros/dollars and won't match the displayed converted price. See §10 #1.
> Treat EUR/USD as display-only until fixed.

---

## 5. THE THREE CHECKOUT FLOWS (END-TO-END)

There are **three** purchase paths. The split begins on the service card: `requiresBooking` decides
whether a product books (consent path) or goes to the cart. The shop is separate again.

### FLOW A — Booking (in-person/online sessions) — _cart is skipped_

```
STEP 1 — SERVICE CARD (body/mind/soul)
  requiresBooking = true → "ZAREZERWUJ" link →
  /{locale}/zgoda-rezerwacja?service={slug}&serviceName={namePl}&price={gbp}&locale={loc}

STEP 2 — CONSENT + PAYMENT (one page: /zgoda-rezerwacja)
  • 7 consent confirmations + full name, email, phone, typed signature
  • Submit → POST /api/booking-consent
        - validates fields; ⭐ fetches REAL price from Sanity
        - inserts booking_tokens (status 'pending', expires +2h)
        - inserts booking_consents (IP + user-agent audit trail)
        - emails Joanna  (⚠ fires before payment — see §10 #3)
        - returns { token, serviceName, priceGBP }
  • Page → POST /api/checkout/session { items:[{name}], currency, locale, token } → clientSecret
  • Stripe PaymentElement renders ON THE SAME PAGE (no cart, no navigation)
  • Pay → return_url = /{locale}/rezerwacja?token={token}

STEP 3 — WEBHOOK (async, signed) — /api/webhooks/stripe
  • payment_intent.succeeded → UPDATE booking_tokens SET status='payment_confirmed'
    WHERE token=metadata.bookingToken AND status='pending'   (the ONLY place this happens)
  • also inserts an `orders` row

STEP 4 — GATE + CALENDAR (/rezerwacja) — stages: waiting / allowed / used / failed / blocked
  • polls /api/verify-booking-token every 2s (~40s max) — "confirming payment" screen
  • on payment_confirmed → renders Cal.com embed (slug = token's serviceId)
  • Cal.com bookingSuccessful → POST /api/consume-booking-token (→ 'used')
  • → /{locale}/koszyk?bookingComplete=true  (thank-you screen)
```

> Historical note: the old flow routed bookings through `/koszyk` and through a separate
> `/booking-pending` polling page. Both are gone — payment now lives on the consent page, and the
> waiting + calendar are merged into `/rezerwacja`. `booking-pending/` is orphaned and safe to delete.

### FLOW B — Cart (non-booking category items, e.g. PDF/ebook services)

```
Service card (requiresBooking = false) → "+ Koszyk" (CartContext)
/koszyk → cart items + T&C checkbox (regulamin, polityka-prywatnosci, zasady-uslug, zgoda-swiadoma)
  → POST /api/checkout/session { items, currency, locale, token:'' } → PaymentElement (on page)
  → pay → return_url /{locale}/koszyk?success=true (thank-you)
Webhook logs an `orders` row. Fulfilment is manual (Joanna sends the file).
```

> `/koszyk` still contains leftover booking code (`pendingBooking`, `booked=true`) that nothing uses
> anymore — pending the planned cart cleanup (§10 #8).

### FLOW C — Sklep (standalone digital products, auto-delivered)

```
/sklep → "Kup Teraz" → in-page legal step (shop terms + immediate-delivery consent)
  → POST /api/checkout/sklep { productId, currency, locale } → clientSecret
  → SklepPaymentForm (email field + PaymentElement) → return_url /{locale}/sklep?success=true
Webhook (orderType 'sklep'):
  • generateDownloadUrl(fileName) → 24h signed URL
  • sendDownloadEmail(customer) + sendOrderNotificationToJoanna()
  • inserts a `sklep_orders` row
```

**Shop product types (`productType` on `sklepProduct`).** `digital` is the ONLY type wired
end-to-end today. `physical` (ship an item, no PDF), `bundle` (physical + PDF), and `course` are
scaffolded in the schema but their checkout/webhook branches are NOT built yet (Phase 2) — they show
"(wkrótce)" in Studio and must not be sold live. When built, the webhook just branches on
`productType`: physical → email Joanna to ship + mark order `to_ship` (no download link); bundle →
BOTH the digital download email AND the ship notice. **No new infrastructure** — Sanity + Supabase +
Stripe already cover it; Stripe collects the shipping address at checkout. A bundle is literally the
digital branch and the physical branch running together.

**Shop search + images.** `/sklep` has an in-memory ranked search (see §6 `sklepClient`) and renders
the first Sanity-hosted image on cards that have one. Both are additive — they don't touch the
payment path.

> All three flows use the embedded Stripe **PaymentElement** with `allow_redirects: 'never'`, so
> BLIK / Przelewy24 (redirect-only) are currently **disabled** — only card + Apple/Google Pay show.
> 3-D Secure can still briefly bounce a card to the bank and back to `return_url`.

---

## 6. KEY FILES & THEIR EXACT ROLES

### `app/globals.css` — THE DESIGN SYSTEM

All styling lives here (tokens, animations, every `.body-* / .cart-* / .booking-* / .hero-* /
.footer-*` class, media queries). Tokens in `:root`:

```css
--bg: #3d0845;
--gold: #b8942a;
--gold-lt: #d4af6a;
--gold-sh: #f0d080;
--cream: #e8d7b8;
--cream-soft: rgba(232, 215, 184, 0.78);
--brown: #6b351e;
--brown-soft: #8a4b2a;
--font-cinzel: "Marcellus", serif; /* heading font (NOT Cinzel — see §10 #5) */
--font-raleway: "Montserrat", sans-serif; /* body font */
```

Tailwind v4 `@theme inline` also exposes `brand-bg/gold/gold-lt/gold-sh/cream` utilities.
**Background is layered**, not flat: base `#24042d` + `bg-texture.jpg` (fixed) + animated radial
gradients (`body::before` float, `body::after` sparkle drift). On mobile (≤720px) the texture is set
to `background-attachment: scroll` because mobile browsers break `fixed` — but this did not fully fix
the flat-purple band; see §10 #11.

Named sections appended at the end of the file: `SHOP SEARCH` (shop search box), `NAV SEARCH`
(site-wide nav dropdown), `SEARCH → CARD HIGHLIGHT` (`itemFlash` / `.item-flash` for deep-linked
cards), and `SHOP CARD IMAGE` (`.shop-card-image`, a 4:3 product-photo frame).

> ⚠️ CSS can override component props — e.g. `.body-product-card img { width: … }` beats an inline
> `<Image width={…}>`. Let the stylesheet own sizing; don't fight it with inline width/height.

### `middleware.ts` — i18n ROUTER + LOCALE PERSISTENCE

Skips `/studio` and `/api`; reads/writes the `NEXT_LOCALE` cookie (1 year); redirects un-prefixed
URLs to the saved locale; delegates the rest to next-intl. (See §4.4.)

### `messages/pl.json` & `messages/en.json` — ALL UI TEXT

Both files must share an identical key structure. A missing key renders the raw key string. Test
both `/pl` and `/en` after any text change. (Namespaces include `nav, hero, pillars, utility,
footer, body, mindPage, soul, sklep, cartPage, bookingConsent, bookingPage, bookingPending,
kontakt, aboutPage, wspolpraca`, plus the legal pages.)

### `lib/sanity-server.ts` — PRICE AUTHORITY (server only)

```typescript
getServicePriceByName(namePl)  → { priceGBP, pricePLN } | null    // active services only
getSklepProductById(id)        → { priceGBP, pricePLN, fileName, namePl } | null
gbpToPln(gbp)                  → Math.round(gbp * 5.2)
// createClient(..., { useCdn: false })  ← always fresh, never a cached price
```

**Never import in client components.**

### `lib/calcom.ts` — SLUG MAP (fallback)

`CAL_USERNAME = 'lettinggozenstudio'` + a `serviceToCalSlug` map + `getCalSlug(name)`. Safety net
for services whose Sanity `calComSlug` is empty. Delete once Sanity slugs are complete.

### `sanity/schemas/service.ts` — SERVICE DEFINITION

Fields Joanna edits in Studio: `namePl, nameEn, category(body|mind|soul), type(sesja|pakiet|ebook),
descPl, descEn, priceGBP, pricePLN, duration, availability, pdfNote, requiresBooking,
calComSlug (hidden unless requiresBooking), freeConsultation, includes[], whoFor[], warning, order,
isActive`. `calComSlug` only shows when `requiresBooking` is on.

### `app/[locale]/rezerwacja/page.tsx` — BOOKING GATE (security-critical)

Reads `token`, polls `/api/verify-booking-token`, and renders the Cal.com embed **only** when the
token is `payment_confirmed`. Five stages: `waiting` (polling), `allowed` (calendar), `used`,
`failed` (timeout), `blocked` (no/invalid token → links to /body, /mind, /soul). On
`bookingSuccessful` it calls `/api/consume-booking-token` then redirects to the thank-you screen.

### `app/[locale]/zgoda-rezerwacja/page.tsx` — CONSENT + PAYMENT

Collects consent + signature, creates the token via `/api/booking-consent`, then reveals the Stripe
`PaymentElement` in place and confirms payment with `return_url → /rezerwacja`. The booking entry
point — bookings never touch the cart.

### `app/api/webhooks/stripe/route.ts` — PAYMENT AUTHORITY

Verifies the Stripe signature. For `orderType: 'sklep'` → download email + Joanna notification +
`sklep_orders`. For sessions → `orders` row, and if `metadata.bookingToken` is present, advances the
token `pending → payment_confirmed`. **The only place a payment is confirmed.**

### `components/layout/NavSearch.tsx` — SITE-WIDE SEARCH

Client component rendered by `Nav.tsx` in two modes: `icon` (desktop magnifier → dropdown) and
`inline` (always-open box inside the mobile drawer). Searches a `SearchItem[]` of **bookable services
+ shop products** built in `[locale]/layout.tsx` (fetched there, wrapped in try/catch so a Sanity
blip can't break the layout) and passed down through `Nav`. Same ranked scoring as the shop
(name 5 / keywords 4 / includes 2 / desc 1) via `normalizeText`. Results link to
`/{locale}{section}?item=<id>` so the destination page scrolls to the card. Only services with
`requiresBooking === true` are included.

### `lib/normalizeText.ts` — ACCENT-INSENSITIVE SEARCH

Lowercases, strips diacritics (NFD), maps `ł → l`. So "odpornosc" matches "odporność". Used by BOTH
the shop search and the nav search — one source of truth, change once and both update.

### `sanity/schemas/sklepProduct.ts` — SHOP PRODUCT DEFINITION

Fields: `productType (digital|physical|bundle|course)`, `namePl/nameEn`, `descPl/descEn`, `images[]`
(Sanity-hosted photos with `alt`; **hidden when productType is digital**), `keywords[]` (bilingual
search tags), `priceGBP/pricePLN`, `fileName` (PDF in Supabase — required for digital/bundle, hidden
for physical), `deliveryNote`, `includes[]`, `isActive`, `order`. Only `digital` is sellable today
(see §5).

### `components/{body,mind,soul}/*Client.tsx` — SERVICE GRID + MODAL

Fetch nothing themselves (data arrives via props from the server page). Render the grid + detail
modal, manage cart state, and route: `requiresBooking` → `getConsentHref()` (consent page); else
`handleAddToCart()`. All three follow the same pattern; mind/soul reuse the `body-*` CSS.
Each card carries `id="item-<sanityId>"`, and a `useEffect` reads `?item=<id>` from the URL to
smooth-scroll + flash that card (`.item-flash`) — this is how nav-search results deep-link in.
`sklepClient` does the same for shop products, and additionally renders `product.images[0]` via
`urlFor()` + `next/image` inside a `.shop-card-image` frame when a product has photos.

---

## 7. IMPORTANT RULES & CONSTRAINTS

### 🔴 GIT: NEVER CHECKOUT BRANCHES

```bash
# ❌ DO NOT
git checkout main
git checkout some-branch
# ✅ ALWAYS
git push origin HEAD:main --force   # push current branch to main, stay where you are
```

Checking out a branch where a file doesn't exist deletes it from your working tree. This has
happened twice. Stay on `legal-pages-working`. Delete files via the WebStorm file tree, not Git.

### 🟡 PRICES: ALWAYS SERVER-SIDE

Every money-touching API route fetches the real price from Sanity by name/id and ignores any
client-sent price. (See §4.2.)

### 🟡 BOOKING TOKEN: STRIPE IS THE ONLY AUTHORITY

Client code can only _read_ a token's status (`verify-booking-token`). Only the signed Stripe
webhook advances `pending → payment_confirmed`.

### 🟡 TRANSLATIONS: STRUCTURE MUST MATCH

`pl.json` and `en.json` must have identical keys, or pages show raw key strings. All new text goes
through `t('key')` — don't hardcode (a few existing `sklepClient.tsx` strings break this rule and
won't translate; see §10 #10).

### 🟡 BOOKINGS DO NOT USE THE CART

Booking payment is on `/zgoda-rezerwacja`. After submitting consent, the URL must stay on
`/zgoda-rezerwacja` (the payment box appears in place) and must **never** redirect to `/koszyk`.

### 🟡 CAL.COM SLUGS: EXACT MATCH

The Sanity/`calcom.ts` slug must match the Cal.com event slug exactly, or the calendar shows all
events instead of the right one.

---

## 8. COMMON TASKS

### Task: Add a New Bookable Service

_(e.g. "Tarot Reading — 60 min" in Mind)_

1. **Sanity Studio** (`/studio` → "Umysł — Usługi" → Create):
   - `namePl`: "Tarot Reading — Sesja 1:1", `category`: Umysł, `type`: Sesja
   - `priceGBP`: 75, `pricePLN`: 390, `duration`: "60 min"
   - `requiresBooking`: ✓ → then fill `calComSlug`: "umysl-tarot-reading-sesja-1-1"
   - Publish.
2. **Cal.com** (`cal.com/lettinggozenstudio`): create an event with the **same slug**.
3. Done — the card appears on `/mind`, and the booking flow (consent → payment → calendar) works.
   No code changes (it's data-driven).

### Task: Update a Service Price

1. Sanity Studio → find the service → change `priceGBP` → Publish.
2. That's it. Pages and checkout re-fetch from Sanity; server-side validation uses the new value.
   No code changes.

### Task: Fix a Typo

1. Search `messages/pl.json` **and** `messages/en.json` for the text.
2. Edit both (keep the structures identical).
3. Deploy:
   ```bash
   git add .
   git commit -m "Fix typo"
   git push origin HEAD:main --force
   ```

### Task: Test the Booking Flow Locally (current flow)

```bash
npm run dev        # http://localhost:3000
```

1. Visit `/pl/body` (or `/en/mind`). Find a card with a **ZAREZERWUJ** button.
2. Click it → lands on `/zgoda-rezerwacja`.
3. Tick all 7 confirmations; fill name, email, phone, signature.
4. Submit → **payment appears on the SAME page** (URL stays `/zgoda-rezerwacja`, never `/koszyk`).
5. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.
6. Redirects to `/rezerwacja` → "confirming…" → Cal.com calendar (webhook fires in ~1–2s).
7. Book a slot → thank-you screen (`/koszyk?bookingComplete=true`).
8. Sanity check the other paths: add a non-booking item → `/koszyk`; and `/sklep` buy-now.

### Task: Add a Digital Shop Product

1. Upload the PDF to Supabase Storage → bucket `sklep-products` (note the exact filename).
2. Sanity Studio → "Sklep — Produkty" → Create → set `productType` = Cyfrowy → fill `namePl`, price,
   `fileName`, and `keywords` (PL + EN so search finds it) → Publish.
3. It appears on `/sklep`; purchase auto-emails a 24h download link via the webhook.

> **Physical / bundle / course are NOT sellable yet (Phase 2).** A physical/bundle product can
> already take **images** (uploaded in Studio, hosted by Sanity) and the card shows the first one,
> but the shipping checkout + webhook branch aren't built — don't publish a non-digital product as
> live until Phase 2 ships.

---

## 9. DEBUGGING & TROUBLESHOOTING

### "Service not found" at checkout

**Cause:** the cart/booking item name doesn't match an active Sanity service.
**Fix:** in Sanity, confirm the service exists, `isActive` is on, `priceGBP > 0`, and `namePl`
matches exactly (case-sensitive). The lookup is by `namePl`.

### /rezerwacja shows "choose a service" instead of the calendar

**Cause:** token missing, expired (>2h), or not yet `payment_confirmed`.
**Fix:**

1. Supabase → `booking_tokens` → find the recent row; check `status` and `expires_at`.
2. If still `pending` after payment, the webhook didn't fire/confirm → check Stripe Dashboard →
   Webhooks → recent events, and confirm `STRIPE_WEBHOOK_SECRET` matches the endpoint's signing
   secret (local CLI secret ≠ dashboard endpoint secret).
3. Browser console (F12) for client errors.

### Payment succeeds but customer is stuck on "confirming…"

**Cause:** the webhook hasn't advanced the token (signature mismatch or endpoint not receiving).
**Fix:** verify the webhook secret + endpoint URL; in local dev run
`stripe listen --forward-to localhost:3000/api/webhooks/stripe` and use _its_ `whsec_` in
`.env.local`.

### EUR/USD charges look wrong

**Known bug (§10 #1).** EUR/USD send the GBP number with a foreign currency code. Use GBP or PLN, or
fix the conversion. Not a misconfiguration.

### About-page "book Alchemik" button 404s

**Known bug (§10 #2).** The link has a typo (`zgonpmda-rezerwacja`). Fix the path to
`zgoda-rezerwacja`.

### A translation key shows as raw text (e.g. "footer.unknown")

**Cause:** key present in one JSON but not the other.
**Fix:** add the matching key to both `pl.json` and `en.json`; `npm run build` to verify.

### Mobile layout broken

**Fix:** DevTools responsive mode at 375px → find the element's class → check/add a
`@media (max-width: 768px)` rule in `globals.css`.

### Fonts look off / inconsistent

**Known conflict (§10 #5).** `next/font` (Cinzel/Raleway) and `globals.css` (Marcellus/Montserrat)
both define `--font-cinzel`/`--font-raleway`. Decide on one source.

### Shop product image won't show

**Causes, in order:** (1) the dev server wasn't **restarted** after the `next.config.mjs`
`cdn.sanity.io` whitelist was added — that change does NOT hot-reload; (2) the product's
`productType` is still `digital`, which **hides** the image field in Studio, so `images` is empty;
(3) the product/image isn't **published** (draft only); (4) the browser console shows a Next image
hostname error → the `cdn.sanity.io` remotePattern isn't active → restart the server.

---

## 10. AUDIT FINDINGS — KNOWN ISSUES

Found by reading the source. None block local dev; several should be fixed before launch. Worst-first.

1. **EUR/USD charge the wrong amount.** Checkout computes GBP pence for non-PLN currencies but
   passes the selected code to Stripe. Restrict the toggle to GBP/PLN, or convert server-side.
2. **Broken booking link on the About page.** `o-mnie/page.tsx` Alchemik CTA points to
   `zgonpmda-rezerwacja` (typo) → 404. Fix to `zgoda-rezerwacja`.
3. **Consent email fires before payment.** `/api/booking-consent` emails Joanna + creates the token
   at submit; abandoned checkouts still send a "new consent" email + leave a pending token (2h TTL).
   Consider moving the email to the webhook.
4. **Duplicate `<html>`/`<body>`.** Root, `[locale]`, and `studio` layouts each render `<html><body>`.
   Nested html/body is invalid and can cause hydration warnings — consolidate.
5. **Font token collision.** next/font (Cinzel/Raleway) vs `globals.css` (Marcellus/Montserrat) on
   the same CSS variables — pick one.
6. **`siteSettings` not wired in.** The schema is editable in Studio, but Footer/Contact hardcode
   phone/email/socials, so edits don't change the site yet.
7. **JSON-LD email mismatch.** Homepage structured data uses `joanna@lettinggozenstudio.com`; the
   rest of the site uses `lettinggozenstudio@gmail.com`. Align them.
8. **Dead booking code in `koszyk`** (`pendingBooking`, `booked=true`) — unused since the bypass;
   pending cleanup.
9. **`booking-pending/` still in the repo** though no flow routes to it. Safe to delete.
10. **Hardcoded Polish strings** in `sklepClient.tsx` + category empty-states bypass next-intl (won't
    translate to English). The shop + nav search UI labels are inline-bilingual for the same reason —
    move them to `messages` when tidying.
11. **Mobile background still shows a flat-purple band (UNRESOLVED).** The `@media (max-width: 720px)
    { body { background-attachment: scroll } }` fix did not fully resolve it in testing. Likely needs
    the bulletproof approach: paint the velvet texture on a `position: fixed` full-screen layer (a
    fixed element works on mobile where `background-attachment: fixed` does not). Revisit.
12. **Physical / bundle / course shop types are scaffolded but not sellable.** `productType` exists
    and image upload works, but the shipping checkout (Stripe address collection) + the webhook
    branch + an order `fulfilment_status` are not built (Phase 2). Don't sell non-digital shop
    products live yet.

---

## 11. GO-LIVE CHECKLIST

### Environment & Secrets

- [ ] Stripe **live** keys (`pk_live_…`, `sk_live_…`) + production webhook signing secret
- [ ] Production webhook endpoint registered → `/api/webhooks/stripe`
- [ ] All env vars set in Vercel; `.env.local` never committed (it's git-ignored)
- [ ] Resend custom domain verified (replace sandbox `onboarding@resend.dev`)

### Functionality

- [ ] Booking flow end-to-end, PL **and** EN (consent → pay → confirm → Cal.com → thank-you)
- [ ] Cart flow (non-booking) end-to-end
- [ ] Sklep flow end-to-end (download email arrives; 24h link works)
- [ ] Fix EUR/USD or hide them (#1); fix About link (#2)
- [ ] No raw translation keys anywhere; both locales complete

### Legal & Content

- [ ] Solicitor-reviewed regulamin, polityka-prywatnosci, zasady-uslug, zgoda-swiadoma
- [ ] Address: "42 Leslie Road, Aberdeen AB24 4EF, Scotland, UK"; email consistent (#7)
- [ ] `siteSettings` wired into Footer/Contact (#6)
- [ ] Footer "KPS Studio" link → developer's site; qualifications + gallery added

### SEO & Quality

- [ ] `npm run build` clean
- [ ] `/sitemap.xml` + `/robots.txt` correct
- [ ] JSON-LD validates (Google Rich Results)
- [ ] Real-device mobile testing (iPhone + Android)
- [ ] Joanna's final approval

---

## 12. FINAL NOTES FOR DEVELOPERS

### Working style

1. **Full variable names**, comments above non-obvious logic (API routes, state machine, validators).
2. **Explain before changing:** which file, what it does, why the change, what to expect after.
3. **Test both languages** — `/pl` and `/en` — and run `npm run build` to catch type/translation errors.
4. **Incremental:** change → `npm run dev` test → deploy. Never skip the local test.
5. **Never commit `.env.local`.**

### When uncertain, check in this order

- `globals.css` (many "bugs" are CSS, including image-sizing overrides)
- `messages/*.json` structure (raw keys = mismatch)
- The relevant API route (is the price coming from Sanity?)
- Supabase `booking_tokens` (what state is the token in?)
- Stripe Dashboard → Webhooks (did the event arrive and confirm?)

### If stuck

- Re-read this file (especially §4 architecture and §10 known issues)
- Browser DevTools console; Stripe webhook logs; Supabase table rows
- Ask Kamil in context

---

**END OF AGENT.MD**
_Verified against a full source read · Updated June 29, 2026 · Keep §10 current and re-audit before go-live._
