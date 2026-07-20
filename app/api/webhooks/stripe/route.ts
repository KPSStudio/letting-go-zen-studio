// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateDownloadUrl } from '@/lib/supabase-storage'
import { sendDownloadEmail, sendOrderNotificationToJoanna, sendBookingConfirmationEmail, sendOrderConfirmationEmail } from '@/lib/email'
import type { EmailLocale } from '@/lib/emailTemplates'

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

    if (
        event.type === 'payment_intent.succeeded' ||
        event.type === 'charge.succeeded'
    ) {
        let metadata: Record<string, string> = {}
        let customerEmail: string | null = null
        let paymentIntentId: string = ''
        let amount: number = 0
        let currency: string = 'gbp'
        let shippingName: string | null = null

        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object as Stripe.PaymentIntent
            metadata = pi.metadata ?? {}
            customerEmail = pi.receipt_email
            paymentIntentId = pi.id
            amount = pi.amount
            currency = pi.currency
            shippingName = pi.shipping?.name ?? null

        } else {
            // charge.succeeded — fetch payment intent for metadata
            const charge = event.data.object as Stripe.Charge
            customerEmail = charge.billing_details?.email ?? charge.receipt_email ?? null
            amount = charge.amount
            currency = charge.currency

            if (charge.payment_intent) {
                const piId = typeof charge.payment_intent === 'string'
                    ? charge.payment_intent
                    : charge.payment_intent.id

                paymentIntentId = piId

                const pi = await stripe.paymentIntents.retrieve(piId)
                metadata = pi.metadata ?? {}
                customerEmail = customerEmail ?? pi.receipt_email
            } else {
                paymentIntentId = charge.id
            }
        }

        const orderType = metadata?.orderType
        console.log(`Payment event: ${event.type}, orderType: ${orderType}, email: ${customerEmail}`)

        // ── SKLEP ORDER ──
        if (orderType === 'sklep') {
            const fileName = metadata?.fileName
            const productName = metadata?.productName

            console.log('Sklep metadata:', { fileName, productName, customerEmail })

            if (!fileName || !productName || !customerEmail) {
                console.error('Missing sklep metadata — skipping')
                return NextResponse.json({ received: true })
            }

            try {
                const downloadUrl = await generateDownloadUrl(fileName)

                // Locale travelled here from the original checkout request.
                const emailLocale: EmailLocale =
                    metadata?.locale === 'en' ? 'en' : 'pl'

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
                    currency: currency.toUpperCase(),
                    orderKind: 'sklep',
                })

                await supabaseAdmin
                    .from('sklep_orders')
                    .insert({
                        stripe_session_id: paymentIntentId,
                        customer_email: customerEmail,
                        product_name: productName,
                        file_name: fileName,
                        amount_total: amount,
                        currency: currency.toUpperCase(),
                        download_url_created_at: new Date().toISOString(),
                    })

                console.log(`Sklep order processed: ${productName} → ${customerEmail}`)

            } catch (err) {
                console.error('Sklep order processing error:', err)
                return NextResponse.json(
                    { error: 'Failed to process sklep order' },
                    { status: 500 }
                )
            }
        }

        // ── SESSION ORDER ──
        else if (event.type === 'payment_intent.succeeded') {
            const { error } = await supabaseAdmin
                .from('orders')
                .insert({
                    stripe_session_id: paymentIntentId,
                    customer_email: customerEmail ?? 'unknown',
                    customer_name: shippingName,
                    currency: currency.toUpperCase(),
                    amount_total: amount,
                    order_type: orderType ?? 'session',
                    status: 'paid',
                    items: metadata?.items
                        ? JSON.parse(metadata.items)
                        : [],
                })

            if (error) {
                console.error('Supabase orders insert error:', error)
                return NextResponse.json(
                    { error: 'Failed to save order' },
                    { status: 500 }
                )
            }

            console.log(`Session order saved: ${paymentIntentId}`)

            // Locale chosen by the customer at checkout, used for their emails.
            const emailLocale: EmailLocale = metadata?.locale === 'en' ? 'en' : 'pl'

            // Item names validated server-side at checkout.
            const itemNames: string[] = metadata?.items
                ? JSON.parse(metadata.items)
                : []

            // ── BOOKING TOKEN CONFIRMATION ──
            // This is the ONLY place a token advances to payment_confirmed.
            // Stripe signs this webhook, so it cannot be faked from a browser.
            const bookingToken = metadata?.bookingToken

            if (bookingToken) {
                // .select() returns the rows that were actually updated.
                // Because the filter requires status 'pending', a Stripe retry
                // matches zero rows the second time — so the confirmation email
                // is sent exactly once, never duplicated.
                const { data: confirmedTokens, error: tokenError } = await supabaseAdmin
                    .from('booking_tokens')
                    .update({
                        status: 'payment_confirmed',
                        stripe_payment_intent_id: paymentIntentId,
                    })
                    .eq('token', bookingToken)
                    .eq('status', 'pending')
                    .select()

                if (tokenError) {
                    console.error('Booking token confirm error:', tokenError)
                } else if (confirmedTokens && confirmedTokens.length > 0) {
                    console.log(`Booking token confirmed: ${bookingToken.slice(0, 8)}...`)

                    // The consent form captured a verified email and the real
                    // service name, so prefer those over Stripe's receipt_email.
                    const tokenRow = confirmedTokens[0]
                    const bookingEmail: string | null =
                        tokenRow.customer_email ?? customerEmail
                    const serviceName: string =
                        tokenRow.service_name ?? itemNames[0] ?? 'Sesja'
                    const bookingLocale: EmailLocale =
                        tokenRow.locale === 'en' ? 'en' : emailLocale

                    if (bookingEmail) {
                        try {
                            await sendBookingConfirmationEmail({
                                to: bookingEmail,
                                serviceName,
                                amount,
                                currency: currency.toUpperCase(),
                                bookingToken,
                                locale: bookingLocale,
                            })

                            await sendOrderNotificationToJoanna({
                                productName: serviceName,
                                customerEmail: bookingEmail,
                                amount,
                                currency: currency.toUpperCase(),
                                orderKind: 'booking',
                            })
                        } catch (emailError) {
                            // Never fail the webhook because of email trouble —
                            // the payment and token state are what matter most.
                            console.error('Booking email error:', emailError)
                        }
                    } else {
                        console.error('No email address for booking confirmation')
                    }
                }
            }

            // ── CART ORDER (no booking token) ──
            // Joanna fulfils these manually, so both sides need telling.
            else if (customerEmail) {
                try {
                    await sendOrderConfirmationEmail({
                        to: customerEmail,
                        itemNames,
                        amount,
                        currency: currency.toUpperCase(),
                        locale: emailLocale,
                    })

                    await sendOrderNotificationToJoanna({
                        productName: itemNames.join(', ') || 'Zamówienie',
                        customerEmail,
                        amount,
                        currency: currency.toUpperCase(),
                        orderKind: 'cart',
                    })
                } catch (emailError) {
                    console.error('Cart order email error:', emailError)
                }
            } else {
                console.error('Cart order has no customer email — no confirmation sent')
            }
        }
    }

    return NextResponse.json({ received: true })
}