// app/api/checkout/session/route.ts
// SECURITY: prices are NEVER taken from the client.
// Every item is looked up in Sanity server-side and the real
// price is used. Client-sent prices are ignored entirely.

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServicePriceByName, gbpToPln } from '@/lib/sanity-server'

type CheckoutItem = {
    name: string
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { items, currency, locale, token } = body as {
            items: CheckoutItem[]
            currency?: string
            locale?: string
            token?: string
        }

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'No items in cart' },
                { status: 400 }
            )
        }

        // ── SERVER-SIDE PRICE VALIDATION ──
        // Look up each item's real price from Sanity by its Polish name.
        // Reject the entire checkout if any item is unknown or inactive.
        let amount = 0
        const validatedNames: string[] = []

        for (const item of items) {
            if (!item.name) {
                return NextResponse.json(
                    { error: 'Invalid item in cart' },
                    { status: 400 }
                )
            }

            const realPrice = await getServicePriceByName(item.name)

            if (!realPrice) {
                console.error(`Checkout rejected — unknown service: "${item.name}"`)
                return NextResponse.json(
                    { error: `Service not found: ${item.name}` },
                    { status: 400 }
                )
            }

            if (currency === 'PLN') {
                const pln = realPrice.pricePLN ?? gbpToPln(realPrice.priceGBP)
                amount += Math.round(pln * 100)
            } else {
                amount += Math.round(realPrice.priceGBP * 100)
            }

            validatedNames.push(item.name)
        }

        if (amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid total amount' },
                { status: 400 }
            )
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: currency?.toLowerCase() ?? 'gbp',
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
            metadata: {
                orderType: 'session',
                locale: locale ?? 'pl',
                items: JSON.stringify(validatedNames),
                // Booking token — the webhook uses this to confirm payment
                // server-side. Empty string if this is a non-booking checkout.
                bookingToken: token ?? '',
            },
        })

        return NextResponse.json({ clientSecret: paymentIntent.client_secret })

    } catch (error) {
        console.error('Stripe payment intent error:', error)
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        )
    }
}