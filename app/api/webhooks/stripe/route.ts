// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateDownloadUrl } from '@/lib/supabase-storage'
import { sendDownloadEmail, sendOrderNotificationToJoanna } from '@/lib/email'

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

                await sendDownloadEmail({
                    to: customerEmail,
                    productName,
                    downloadUrl,
                })

                await sendOrderNotificationToJoanna({
                    productName,
                    customerEmail,
                    amount,
                    currency: currency.toUpperCase(),
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
        }
    }

    return NextResponse.json({ received: true })
}