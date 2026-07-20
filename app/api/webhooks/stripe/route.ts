// app/api/webhooks/stripe/route.ts
// The single trusted place a payment is acted upon.
//
// This webhook now serves ONLY the shop (sklep) and the cart. Bookings are
// paid inside the embedded Cal.com widget on Joanna's own Stripe account, so
// Cal.com handles their confirmation and emails — we no longer touch bookings
// here at all.
//
// Two safety rules run this file:
//   1. We act on exactly ONE Stripe event per payment (payment_intent.succeeded).
//      Stripe also fires charge.succeeded for the same payment; we ignore it so
//      nothing can run twice.
//   2. Because Cal.com charges on the SAME Stripe account, its booking payments
//      also arrive here. We ignore any payment that isn't tagged with one of our
//      own order types, so a Cal.com booking never creates a phantom order.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateDownloadUrl } from '@/lib/supabase-storage'
import {
    sendDownloadEmail,
    sendOrderNotificationToJoanna,
    sendOrderConfirmationEmail,
} from '@/lib/email'
import type { EmailLocale } from '@/lib/emailTemplates'

// Postgres unique-violation code. Supabase surfaces it on the error object.
// It is how we stay idempotent: a Stripe retry of the same payment tries to
// insert the same stripe_session_id, hits the unique constraint, and we stop
// before sending any email a second time.
const UNIQUE_VIOLATION = '23505'

export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    if (!sig) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        )
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json(
            { error: 'Webhook signature failed' },
            { status: 400 }
        )
    }

    // Rule 1: only ever act on a completed payment intent.
    if (event.type !== 'payment_intent.succeeded') {
        return NextResponse.json({ received: true })
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const metadata = paymentIntent.metadata ?? {}
    const orderType = metadata.orderType
    const customerEmail = paymentIntent.receipt_email
    const paymentIntentId = paymentIntent.id
    const amount = paymentIntent.amount
    const currency = paymentIntent.currency.toUpperCase()
    const emailLocale: EmailLocale = metadata.locale === 'en' ? 'en' : 'pl'

    // Rule 2: ignore anything that isn't one of our own shop/cart orders
    // (e.g. a Cal.com booking payment on the same Stripe account).
    if (orderType !== 'sklep' && orderType !== 'cart') {
        console.log(
            `Ignoring payment ${paymentIntentId} — not one of our orders (orderType: ${orderType ?? 'none'})`
        )
        return NextResponse.json({ received: true })
    }

    // ── SKLEP ORDER — digital product, delivered automatically ──
    if (orderType === 'sklep') {
        const fileName = metadata.fileName
        const productName = metadata.productName

        if (!fileName || !productName || !customerEmail) {
            console.error('Missing sklep metadata or email — skipping')
            return NextResponse.json({ received: true })
        }

        // Record the order FIRST. If this same payment is delivered again by
        // Stripe, the unique constraint on stripe_session_id rejects the insert
        // and we return before emailing a second download link.
        const { error: insertError } = await supabaseAdmin
            .from('sklep_orders')
            .insert({
                stripe_session_id: paymentIntentId,
                customer_email: customerEmail,
                product_name: productName,
                file_name: fileName,
                amount_total: amount,
                currency,
                download_url_created_at: new Date().toISOString(),
            })

        if (insertError) {
            if (insertError.code === UNIQUE_VIOLATION) {
                console.log(`Sklep order ${paymentIntentId} already processed — skipping`)
                return NextResponse.json({ received: true })
            }
            console.error('Sklep order insert error:', insertError)
            return NextResponse.json(
                { error: 'Failed to save sklep order' },
                { status: 500 }
            )
        }

        // The order is saved; email trouble must never fail the webhook (that
        // would make Stripe retry and we'd duplicate work).
        try {
            const downloadUrl = await generateDownloadUrl(fileName)

            await sendDownloadEmail({
                to: customerEmail,
                productName,
                downloadUrl,
                locale: emailLocale,
            })

            await sendOrderNotificationToJoanna({
                productName,
                customerEmail,
                amount,
                currency,
                orderKind: 'sklep',
            })

            console.log(`Sklep order processed: ${productName} → ${customerEmail}`)
        } catch (emailError) {
            console.error('Sklep email error:', emailError)
        }

        return NextResponse.json({ received: true })
    }

    // ── CART ORDER — non-booking items Joanna fulfils manually ──
    const itemNames: string[] = metadata.items ? JSON.parse(metadata.items) : []

    // Same idempotency approach: insert first, guarded by the unique constraint.
    const { error: insertError } = await supabaseAdmin
        .from('orders')
        .insert({
            stripe_session_id: paymentIntentId,
            customer_email: customerEmail ?? 'unknown',
            customer_name: paymentIntent.shipping?.name ?? null,
            currency,
            amount_total: amount,
            order_type: 'cart',
            status: 'paid',
            items: itemNames,
        })

    if (insertError) {
        if (insertError.code === UNIQUE_VIOLATION) {
            console.log(`Cart order ${paymentIntentId} already processed — skipping`)
            return NextResponse.json({ received: true })
        }
        console.error('Supabase orders insert error:', insertError)
        return NextResponse.json(
            { error: 'Failed to save order' },
            { status: 500 }
        )
    }

    console.log(`Cart order saved: ${paymentIntentId}`)

    if (customerEmail) {
        try {
            await sendOrderConfirmationEmail({
                to: customerEmail,
                itemNames,
                amount,
                currency,
                locale: emailLocale,
            })

            await sendOrderNotificationToJoanna({
                productName: itemNames.join(', ') || 'Zamówienie',
                customerEmail,
                amount,
                currency,
                orderKind: 'cart',
            })
        } catch (emailError) {
            console.error('Cart order email error:', emailError)
        }
    } else {
        console.error('Cart order has no customer email — no confirmation sent')
    }

    return NextResponse.json({ received: true })
}
