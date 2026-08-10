// app/api/webhooks/stripe/route.ts
// The single trusted place a payment is acted upon.
//
// This webhook serves ONLY the shop (sklep) and the cart. Bookings are paid
// inside the embedded Cal.com widget on Joanna's own Stripe account, so Cal.com
// handles their confirmation and emails — we do not touch bookings here.
//
// ── THE THREE RULES THAT RUN THIS FILE ──
//
// 1. ONE EVENT PER PAYMENT. We act only on payment_intent.succeeded. Stripe also
//    fires charge.succeeded for the same payment; ignoring it means nothing can
//    run twice from a single successful charge.
//
// 2. ONLY OUR ORDERS. Cal.com charges on the SAME Stripe account, so its booking
//    payments also arrive here. Anything without one of our own orderType tags
//    is ignored, so a Cal.com booking can never create a phantom order.
//
// 3. THE DATABASE ROW IS A STATE MACHINE, NOT A RECEIPT.
//
//    The previous version inserted the order row, marked digital orders
//    'delivered' immediately, attempted the email, swallowed any failure, and
//    returned 200. A Stripe retry then hit the unique constraint and returned
//    early. So a single transient Resend or Storage blip permanently lost the
//    customer's download while the database recorded it as delivered.
//
//    Now every required customer and internal message is a permanent database
//    outbox job. Incomplete work resumes instead of being skipped; Resend API
//    failure returns non-2xx for Stripe retry and the daily cron independently
//    retries due jobs. A signed Resend webhook distinguishes provider
//    acceptance from recipient-mail-server delivery. Purpose-specific database
//    dedupe keys are permanent; Resend adds a 24-hour idempotency safeguard.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
    enqueueEmailJob,
    processEmailJobs,
    sourceEmailJobsAreAccepted,
} from '@/lib/email-outbox'
import type { EmailLocale } from '@/lib/emailTemplates'

// Postgres unique-violation code. Supabase surfaces it on the error object.
// The UNIQUE constraint on stripe_session_id is what makes a Stripe retry land
// on the EXISTING row rather than creating a duplicate order.
const UNIQUE_VIOLATION = '23505'

// Keeps a database error column bounded and free of anything sensitive.
function summariseError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error)
    return message.slice(0, 400)
}

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

    // The buyer's email. Ideally it's on the PaymentIntent as receipt_email, but
    // our checkout forms also attach it to the charge's billing details, so we
    // fall back to that — this is what makes the download/confirmation email
    // reliably send even if receipt_email wasn't set.
    let customerEmail = paymentIntent.receipt_email
    if (!customerEmail && paymentIntent.latest_charge) {
        try {
            const chargeId =
                typeof paymentIntent.latest_charge === 'string'
                    ? paymentIntent.latest_charge
                    : paymentIntent.latest_charge.id
            const charge = await stripe.charges.retrieve(chargeId)
            customerEmail = charge.billing_details?.email ?? null
        } catch (err) {
            console.error('Could not read charge for email fallback:', err)
        }
    }

    // ══════════════════════════════════════════════════════════════
    // SKLEP ORDER — digital (PDF) / physical (shipped) / bundle (both)
    // ══════════════════════════════════════════════════════════════
    if (orderType === 'sklep') {
        const productType = metadata.productType ?? 'digital'
        const productName = metadata.productName
        const fileName = metadata.fileName

        const hasPdf = productType === 'digital' || productType === 'bundle'
        const ships = productType === 'physical' || productType === 'bundle'

        // PDF products must have a file. Without these we cannot fulfil at all,
        // and no number of retries will change that.
        if (
            !['digital', 'physical', 'bundle'].includes(productType) ||
            !productName ||
            !customerEmail ||
            (hasPdf && !fileName)
        ) {
            const incidentReason = !['digital', 'physical', 'bundle'].includes(productType)
                ? 'Unsupported product type'
                : !productName
                  ? 'Missing product name'
                  : !customerEmail
                    ? 'Missing customer email'
                    : 'Missing download file'

            const { error: incidentError } = await supabaseAdmin
                .from('payment_incidents')
                .upsert(
                    {
                        stripe_payment_intent_id: paymentIntentId,
                        order_type: 'sklep',
                        reason: incidentReason,
                    },
                    { onConflict: 'stripe_payment_intent_id' }
                )

            if (incidentError) {
                console.error(
                    `Could not persist payment incident for ${paymentIntentId}:`,
                    incidentError.message
                )
            }

            console.error(
                `Sklep order ${paymentIntentId} cannot be fulfilled — missing ${
                    !['digital', 'physical', 'bundle'].includes(productType)
                        ? 'supported product type'
                        : !productName
                          ? 'productName'
                          : !customerEmail
                            ? 'customer email'
                            : 'fileName'
                }. Needs manual follow-up.`
            )
            // Do not acknowledge a paid but unfulfillable order. Stripe retries
            // and keeps the failure visible in its webhook dashboard.
            return NextResponse.json(
                { error: 'Paid order is missing fulfilment data' },
                { status: 500 }
            )
        }

        const shipping = paymentIntent.shipping ?? null
        if (ships && !shipping) {
            console.error(
                `Physical order ${paymentIntentId} arrived without a shipping address`
            )
        }

        // ── 1. Claim the order ──
        // Inserted as 'processing': this row is a claim on the work, not a
        // record that the work is done.
        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('sklep_orders')
            .insert({
                stripe_session_id: paymentIntentId,
                customer_email: customerEmail,
                product_name: productName,
                product_type: productType,
                file_name: fileName ?? null,
                amount_total: amount,
                currency,
                shipping_name: shipping?.name ?? null,
                shipping_address: shipping ?? null,
                fulfilment_status: 'processing',
                email_locale: emailLocale,
                // Legal acceptance captured at checkout (see app/api/checkout/sklep).
                legal_terms_accepted: metadata.legalTermsAccepted === 'true',
                legal_privacy_accepted: metadata.legalPrivacyAccepted === 'true',
                legal_immediate_delivery_consent:
                    metadata.legalImmediateDelivery === 'true',
                legal_withdrawal_acknowledged:
                    metadata.legalWithdrawalAcknowledged === 'true',
                legal_shipping_consent: metadata.legalShippingConsent === 'true',
                legal_accepted_at: metadata.legalAcceptedAt ?? null,
            })
            .select('id, fulfilment_status')
            .single()

        let orderRowId = inserted?.id ?? null

        if (insertError) {
            if (insertError.code !== UNIQUE_VIOLATION) {
                console.error('Sklep order insert error:', insertError.message)
                return NextResponse.json(
                    { error: 'Failed to save sklep order' },
                    { status: 500 }
                )
            }

            // A row already exists for this payment — this is a Stripe retry (or
            // a duplicate delivery). Resume only if the work is unfinished.
            const { data: existing, error: lookupError } = await supabaseAdmin
                .from('sklep_orders')
                .select('id, fulfilment_status')
                .eq('stripe_session_id', paymentIntentId)
                .single()

            if (lookupError || !existing) {
                console.error(
                    `Sklep order ${paymentIntentId} conflicted but could not be re-read:`,
                    lookupError?.message
                )
                return NextResponse.json(
                    { error: 'Failed to read existing order' },
                    { status: 500 }
                )
            }

            console.log(
                `Sklep order ${paymentIntentId} is ${existing.fulfilment_status} — resuming fulfilment`
            )
            orderRowId = existing.id
        }

        // ── 2. Queue every required email exactly once ──
        try {
            if (hasPdf && fileName) {
                await enqueueEmailJob({
                    dedupeKey: `${paymentIntentId}:download`,
                    kind: 'shop_download',
                    sourceType: 'sklep_order',
                    sourceReference: orderRowId!,
                })
            }

            if (ships) {
                await enqueueEmailJob({
                    dedupeKey: `${paymentIntentId}:shipping`,
                    kind: 'shop_shipping',
                    sourceType: 'sklep_order',
                    sourceReference: orderRowId!,
                })
            }

            await enqueueEmailJob({
                dedupeKey: `${paymentIntentId}:notify`,
                kind: 'joanna_shop_notification',
                sourceType: 'sklep_order',
                sourceReference: orderRowId!,
            })

            const emailResult = await processEmailJobs({
                limit: 5,
                sourceType: 'sklep_order',
                sourceReference: orderRowId!,
            })

            const allAccepted = await sourceEmailJobsAreAccepted(
                'sklep_order',
                orderRowId!
            )

            if (emailResult.failed > 0 || !allAccepted) {
                throw new Error('One or more shop emails remain pending')
            }
        } catch (fulfilmentError) {
            console.error(
                `Sklep fulfilment failed for ${paymentIntentId}:`,
                summariseError(fulfilmentError)
            )

            await supabaseAdmin
                .from('sklep_orders')
                .update({
                    fulfilment_status: 'failed',
                    fulfilment_error: summariseError(fulfilmentError),
                })
                .eq('stripe_session_id', paymentIntentId)

            return NextResponse.json(
                { error: 'Fulfilment failed, retry expected' },
                { status: 500 }
            )
        }

        // ── 3. Provider accepted every message ──
        // Digital stays processing until the signed Resend webhook confirms
        // delivery to the recipient's mail server. Physical/bundle moves to
        // to_ship because Joanna's durable notification was accepted too.
        const completedStatus = ships ? 'to_ship' : 'processing'

        const { error: completionError } = await supabaseAdmin
            .from('sklep_orders')
            .update({
                fulfilment_status: completedStatus,
                fulfilled_at: ships ? new Date().toISOString() : null,
                fulfilment_error: null,
            })
            .eq('stripe_session_id', paymentIntentId)

        if (completionError) {
            // The customer HAS their email. Returning 500 here would make Stripe
            // retry, which is safe (the idempotency keys hold) and is the right
            // call, because otherwise the row would stay 'processing' forever.
            console.error(
                `Sklep order ${paymentIntentId} delivered but status update failed:`,
                completionError.message
            )
            return NextResponse.json(
                { error: 'Delivered but could not record completion' },
                { status: 500 }
            )
        }

        // No product name, address, or download URL in the log line.
        console.log(
            `Sklep order ${paymentIntentId} fulfilled (${productType} → ${completedStatus}); row ${orderRowId}`
        )

        return NextResponse.json({ received: true })
    }

    // ══════════════════════════════════════════════════════════════
    // CART ORDER — non-booking items Joanna fulfils manually
    // ══════════════════════════════════════════════════════════════
    let itemNames: string[] = []
    try {
        const parsed = metadata.items ? JSON.parse(metadata.items) : []
        if (Array.isArray(parsed)) {
            itemNames = parsed.filter((n): n is string => typeof n === 'string')
        }
    } catch {
        console.error(`Cart order ${paymentIntentId} has unparseable item metadata`)
    }

    const { data: insertedCartOrder, error: insertError } = await supabaseAdmin
        .from('orders')
        .insert({
            stripe_session_id: paymentIntentId,
            customer_email: customerEmail ?? 'unknown',
            customer_name: paymentIntent.shipping?.name ?? null,
            currency,
            amount_total: amount,
            order_type: 'cart',
            status: 'paid',
            fulfilment_status: 'processing',
            items: itemNames,
            email_locale: emailLocale,
        })
        .select('id')
        .single()

    let cartOrderRowId = insertedCartOrder?.id ?? null

    if (insertError) {
        if (insertError.code !== UNIQUE_VIOLATION) {
            console.error('Supabase orders insert error:', insertError.message)
            return NextResponse.json(
                { error: 'Failed to save order' },
                { status: 500 }
            )
        }

        const { data: existing, error: lookupError } = await supabaseAdmin
            .from('orders')
            .select('id, fulfilment_status')
            .eq('stripe_session_id', paymentIntentId)
            .single()

        if (lookupError || !existing) {
            console.error(
                `Cart order ${paymentIntentId} conflicted but could not be re-read:`,
                lookupError?.message
            )
            return NextResponse.json(
                { error: 'Failed to read existing order' },
                { status: 500 }
            )
        }

        console.log(`Cart order ${paymentIntentId} is ${existing.fulfilment_status} — resuming`)
        cartOrderRowId = existing.id
    }

    // Queue customer and internal notifications separately. Their permanent
    // DB dedupe keys let a Stripe retry resume only the missing purpose.
    try {
        if (customerEmail) {
            await enqueueEmailJob({
                dedupeKey: `${paymentIntentId}:confirmation`,
                kind: 'cart_confirmation',
                sourceType: 'cart_order',
                sourceReference: cartOrderRowId!,
            })
        }

        await enqueueEmailJob({
            dedupeKey: `${paymentIntentId}:notify`,
            kind: 'joanna_cart_notification',
            sourceType: 'cart_order',
            sourceReference: cartOrderRowId!,
        })

        const emailResult = await processEmailJobs({
            limit: 3,
            sourceType: 'cart_order',
            sourceReference: cartOrderRowId!,
        })

        const allAccepted = await sourceEmailJobsAreAccepted(
            'cart_order',
            cartOrderRowId!
        )

        if (emailResult.failed > 0 || !allAccepted) {
            throw new Error('One or more cart emails remain pending')
        }
    } catch (fulfilmentError) {
        console.error(
            `Cart confirmation failed for ${paymentIntentId}:`,
            summariseError(fulfilmentError)
        )

        await supabaseAdmin
            .from('orders')
            .update({
                fulfilment_status: 'failed',
                fulfilment_error: summariseError(fulfilmentError),
            })
            .eq('stripe_session_id', paymentIntentId)

        return NextResponse.json(
            { error: 'Fulfilment failed, retry expected' },
            { status: 500 }
        )
    }

    // Missing customer email cannot be repaired by retrying Stripe. Joanna has
    // now received a durable alert containing the payment/order reference, so
    // retain an honest failed state for manual follow-up.
    if (!customerEmail) {
        console.error(
            `Cart order ${paymentIntentId} has no customer email — manual follow-up required`
        )
        await supabaseAdmin
            .from('orders')
            .update({
                fulfilment_status: 'failed',
                fulfilment_error: 'No customer email on the payment',
            })
            .eq('id', cartOrderRowId!)

        return NextResponse.json({ received: true })
    }

    const { error: completionError } = await supabaseAdmin
        .from('orders')
        .update({
            fulfilment_status: 'confirmed',
            fulfilled_at: new Date().toISOString(),
            fulfilment_error: null,
        })
        .eq('stripe_session_id', paymentIntentId)

    if (completionError) {
        console.error(
            `Cart order ${paymentIntentId} confirmed but status update failed:`,
            completionError.message
        )
        return NextResponse.json(
            { error: 'Confirmed but could not record completion' },
            { status: 500 }
        )
    }

    console.log(`Cart order ${paymentIntentId} confirmed`)

    return NextResponse.json({ received: true })
}
