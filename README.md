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
RESEND_WEBHOOK_SECRET=
CONTACT_EMAIL=

# Site
NEXT_PUBLIC_SITE_URL=https://www.lettinggozenstudio.com

# Cron — protects /api/cron/supabase-keepalive.
# Any long random string, e.g. `openssl rand -hex 32`.
# Vercel sends it automatically as `Authorization: Bearer <CRON_SECRET>`.
# If this is unset or blank the endpoint fails closed and returns 401.
CRON_SECRET=
```

For local webhook testing, forward Stripe events to the dev server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

and use the printed signing secret as `STRIPE_WEBHOOK_SECRET`.

### Scheduled job — Supabase keep-alive

`vercel.json` registers one daily cron that calls `/api/cron/supabase-keepalive`.
It makes three tiny read-only queries (`booking_consents`, `orders`,
`sklep_orders`) so the database sees regular activity, then retries up to ten
due jobs from the durable email outbox. It returns a non-2xx if either database
health or email recovery fails.

**This is a best-effort mitigation, not an uptime guarantee.** Supabase documents
that Free projects may be paused after ~7 days of low activity and that only a
paid plan guarantees otherwise —
<https://supabase.com/docs/guides/platform/free-project-pausing>. Vercel Hobby
also allows only one cron run per day, triggered at some point within the
scheduled hour — <https://vercel.com/docs/cron-jobs/usage-and-pricing>.

To confirm it is running:

1. **Vercel → Project → Settings → Cron Jobs** — the job should be listed with
   the path `/api/cron/supabase-keepalive` and schedule `17 6 * * *`.
2. **Vercel → Project → Settings → Environment Variables** — `CRON_SECRET` must
   be set for Production (Vercel injects it into the request automatically).
3. **Vercel → Project → Logs**, filtered to that path — a successful run returns
   `{"ok":true,"checkedAt":"…","recoveredEmails":0}` with a 200.

To test locally:

```bash
# 401 — no credentials
curl -i localhost:3000/api/cron/supabase-keepalive

# 200 — with the secret from .env.local
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  localhost:3000/api/cron/supabase-keepalive
```

The secret is only ever read from the `Authorization` header — passing it as a
query parameter will NOT authenticate, by design.

### Database migrations

SQL lives in `supabase/migrations/`. It is applied by hand through the Supabase
Dashboard → SQL Editor; each file documents its own apply, verify and rollback
steps at the bottom. Apply them in filename order.

The email-outbox code requires
`20260810_0003_private_rls_and_email_outbox.sql`. Apply migrations before the
matching code deployment; deploying code first makes email processing fail.

### Resend delivery tracking and recovery

Email API acceptance is not the same as delivery. The application therefore:

1. creates one private `email_outbox` row per recipient/purpose;
2. sends immediately and records the Resend email id;
3. retries provider/network failures without repeating already-accepted jobs;
4. processes stranded jobs during the daily protected cron; and
5. updates delivery/bounce state from a signed Resend webhook.

For PDF mail, the private order row retains one signed URL and reuses it during
retries. This is required because Resend's 24-hour idempotency check also
compares the request payload; regenerating the URL would make the payload
different. RLS/service-role-only grants protect that credential, and it is
never logged or returned by an API.

After deploying the webhook route:

1. Resend → **Webhooks → Add Webhook**.
2. Endpoint: `https://www.lettinggozenstudio.com/api/webhooks/resend`.
3. Subscribe to `email.sent`, `email.delivered`, `email.delivery_delayed`,
   `email.bounced`, `email.complained`, `email.failed`, and
   `email.suppressed`.
4. Copy its signing secret (`whsec_…`) to Vercel Production as
   `RESEND_WEBHOOK_SECRET`; never reuse `RESEND_API_KEY` for this.
5. Redeploy, send one authorised test message, and confirm the corresponding
   outbox row advances `pending → accepted → delivered`.

Create a Vercel alert or log drain for non-2xx responses from the cron route.
The cron deliberately returns 503 when it sees a terminal failure
(`dead`, `bounced`, `complained`, `suppressed`) or an accepted/delayed message
with no delivery event after 24 hours. Without an external alert, durable state
prevents loss but does not guarantee that a human notices the problem.

Operational check (returns no message body or signed URL):

```sql
select id, kind, source_type, source_reference, status, attempt_count,
       accepted_at, delivered_at, last_error, updated_at
from public.email_outbox
where status <> 'delivered'
order by updated_at asc;
```

The webhook verifies the raw body and Svix signature before writing anything.
No email body, signed download URL, or secret is stored in the outbox. Email
delivery can never be made mathematically infallible—mailboxes can reject or
suppress messages—but API failures are retried, definitive delivery failures
are visible, and digital orders are not falsely marked delivered.

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
