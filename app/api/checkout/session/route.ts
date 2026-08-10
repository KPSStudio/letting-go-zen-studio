// app/api/checkout/session/route.ts
// SECURITY: prices are NEVER taken from the client.
// Every item is looked up in Sanity server-side and the real
// price is used. Client-sent prices are ignored entirely.
//
// The currency is validated against an allowlist too — see lib/currency-server.ts
// for why passing it through unchecked was a real defect and not just untidy.

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServicePriceByName, gbpToPln } from '@/lib/sanity-server'
import {
    parseCurrency,
    isChargeablePrice,
    toMinorUnits,
} from '@/lib/currency-server'

type CheckoutItem = {
    name: string
}

// A cart this large is not a real order; it is someone probing the price
// lookup. Each item costs one Sanity round trip.
const MAX_CART_ITEMS = 30

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { items, currency, locale } = body as {
            items: CheckoutItem[]
            currency?: string
            locale?: string
        }

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'No items in cart' },
                { status: 400 }
            )
        }

        if (items.length > MAX_CART_ITEMS) {
            return NextResponse.json(
                { error: 'Too many items in cart' },
                { status: 400 }
            )
        }

        // ── CURRENCY ALLOWLIST ──
        // Reject rather than fall back: silently treating an unknown currency
        // as GBP is exactly the bug this replaces.
        const validatedCurrency = parseCurrency(currency)

        if (!validatedCurrency) {
            return NextResponse.json(
                { error: 'Unsupported currency' },
                { status: 400 }
            )
        }

        // ── SERVER-SIDE PRICE VALIDATION ──
        // Look up each item's real price from Sanity by its Polish name.
        // Reject the entire checkout if any item is unknown or inactive.
        let amount = 0
        const validatedNames: string[] = []

        for (const item of items) {
            if (!item || typeof item.name !== 'string' || !item.name.trim()) {
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

            // A CMS field can hold anything a human typed. Validate before it
            // becomes money.
            if (!isChargeablePrice(realPrice.priceGBP)) {
                console.error(`Checkout rejected — invalid GBP price on "${item.name}"`)
                return NextResponse.json(
                    { error: `Service is not available for purchase: ${item.name}` },
                    { status: 400 }
                )
            }

            const majorUnits =
                validatedCurrency === 'PLN'
                    ? isChargeablePrice(realPrice.pricePLN)
                        ? realPrice.pricePLN
                        : gbpToPln(realPrice.priceGBP)
                    : realPrice.priceGBP

            const minorUnits = toMinorUnits(majorUnits)

            if (minorUnits === null) {
                console.error(`Checkout rejected — unusable amount for "${item.name}"`)
                return NextResponse.json(
                    { error: `Service is not available for purchase: ${item.name}` },
                    { status: 400 }
                )
            }

            amount += minorUnits
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
            currency: validatedCurrency.toLowerCase(),
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
            metadata: {
                // Marks this as OUR cart order. The webhook ignores any payment
                // that isn't one of our known order types (e.g. Cal.com booking
                // payments on the same Stripe account).
                orderType: 'cart',
                locale: locale === 'en' ? 'en' : 'pl',
                items: JSON.stringify(validatedNames),
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
