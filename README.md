# Letting Go Zen Studio

A bilingual (Polish / English) e-commerce and secure-booking platform for a holistic-therapy
studio in Aberdeen, Scotland. Clients can browse services across three themes, buy digital
products with instant delivery, and book paid one-to-one sessions after giving informed consent.

**Live site:** https://www.lettinggozenstudio.com

Content is managed through an embedded Sanity Studio (admin-only).

---

## What it does

- **Service catalogue** across Body / Mind / Soul, fully data-driven from the CMS (bilingual
  descriptions, pricing, duration, availability and detail modals).
- **Digital shop** (`/sklep`) — sells downloadable products with automatic delivery: after payment
  the customer is emailed a time-limited, signed download link.
- **Secure bookings** — a client gives legally-sound consent (a signed waiver stored with an audit
  trail), then books and pays for the session through an embedded calendar.
- **Bilingual throughout** — Polish (default) and English, with the chosen language persisted and
  reflected in the URL, the UI and the transactional emails.
- **Contact form**, legal pages (terms, privacy/RODO, service rules, informed consent) and
  site-wide search.

---

## Tech stack

| Area | Technology |
|------|------------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 + a hand-authored design system in `app/globals.css` |
| i18n | next-intl (`messages/pl.json`, `messages/en.json`) |
| CMS | Sanity (embedded Studio at `/studio`) |
| Database & storage | Supabase (Postgres + Storage for product files) |
| Payments | Stripe (embedded Payment Element) |
| Bookings | Cal.com (embedded scheduling with native Stripe payments) |
| Email | Resend (branded, bilingual transactional emails) |
| Hosting | Vercel (auto-deploy from `main`) |

---

## Architecture & key decisions

**Prices are never trusted from the client.** Every money-touching request re-fetches the real
price from the CMS by product/service identity and ignores any price sent by the browser
(`lib/sanity-server.ts`, using an un-cached client so pricing is always current).

**Two payment paths, deliberately separated:**

- **Shop & cart** are paid with Stripe's embedded Payment Element on our own pages. A single Stripe
  webhook (`/api/webhooks/stripe`) is the only trusted authority that records the order and triggers
  fulfilment (the download-link email for digital products). It processes exactly one event per
  payment and is idempotent at the database level, so retries can never double-fulfil. It also
  ignores any payment that isn't tagged as one of our own orders.
- **Bookings** are paid through the **embedded Cal.com widget**, which handles the charge on the
  studio's own Stripe account. The customer never leaves the site: they sign the consent form
  (saved to the database as the legal record), and the calendar then appears in place for them to
  choose a slot and pay. Cancellation and reschedule rules are managed in Cal.com.

**Consent is captured before booking.** The waiver — a set of explicit confirmations plus a typed
signature — is stored with an IP and user-agent audit trail before the calendar is shown.

**Bilingual routing** is handled in middleware with a locale prefix and a persisted cookie, so
switching language mid-flow never resets the customer's progress.

**Content is data-driven.** Services and shop products are authored in Sanity; adding or repricing a
service is a CMS change with no code deploy.

---

## Project structure

```
app/
  layout.tsx                Root layout (single <html>/<body>)
  globals.css               Design system — tokens, animations, component styles
  [locale]/                 Localised routes (pl / en): home, body, mind, soul, sklep,
                            booking consent, cart, about, contact, legal pages
  studio/                   Embedded Sanity Studio (/studio)
  api/                      Checkout, booking-consent and the Stripe webhook
components/                 Home, layout (nav/footer/search) and per-section clients
lib/                        Server-only price client, Stripe/Supabase clients, email, i18n helpers
sanity/                     Schemas, CMS clients and fetchers
messages/                   pl.json / en.json — all UI copy
```

---

## Getting started

Requires Node.js 20+ and the environment variables listed below.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

Create a `.env.local` (never committed) with:

```
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Resend)
RESEND_API_KEY=
CONTACT_EMAIL=

# Site
NEXT_PUBLIC_SITE_URL=https://www.lettinggozenstudio.com
```

For local webhook testing, forward Stripe events to the dev server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

and use the printed signing secret as `STRIPE_WEBHOOK_SECRET`.

---

## Content management

The site's content — services, shop products, testimonials and site settings — is edited in an
embedded Sanity Studio (admin-only). Changes publish straight to the live site, which reads
published content.

---

## Deployment

Hosted on Vercel with automatic deployments from the `main` branch. The production Stripe webhook
endpoint points at `/api/webhooks/stripe`, and all secrets are configured as Vercel environment
variables.

---

Built and maintained by **KPS Studio**.
