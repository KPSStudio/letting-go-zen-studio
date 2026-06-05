// lib/stripe.ts
// Stripe server-side client
// Only used in API routes — never in client components

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-05-27.dahlia',
})