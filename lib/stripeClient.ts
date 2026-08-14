// lib/stripeClient.ts
//
// Lazily loads Stripe.js, and only once.
//
// Both checkout surfaces previously called `loadStripe(...)` at MODULE scope.
// That runs the moment the module is evaluated — i.e. as soon as a visitor
// opens the Shop or the Cart — so js.stripe.com was contacted (and Stripe's
// own storage created) merely by browsing, long before anyone chose to pay.
//
// `getStripe()` defers that until the customer deliberately enters the payment
// step, while caching the promise so repeated renders reuse one Stripe
// instance. Stripe.js must be loaded from Stripe's own domain — it is not
// self-hostable, and PCI guidance requires their delivery — so the fix is
// about WHEN it loads, not where from.

import type { Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
    if (!stripePromise) {
        // Imported dynamically as well, so the Stripe.js loader itself is not
        // part of the initial Shop/Cart bundle.
        stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) =>
            loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!),
        )
    }

    return stripePromise
}
