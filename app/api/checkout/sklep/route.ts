// app/api/checkout/sklep/route.ts
// Creates a Stripe Payment Intent for instant digital product purchase
// Separate from the cart checkout flow

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { productId, productName, fileName, priceGBP, pricePLN, currency, locale } = body

        if (!productId || !productName || !fileName || !priceGBP) {
            return NextResponse.json(
                { error: 'Missing required product fields' },
                { status: 400 }
            )
        }

        const amount = currency === 'PLN'
            ? Math.round(pricePLN * 100)
            : Math.round(priceGBP * 100)

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: currency?.toLowerCase() ?? 'gbp',
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
            metadata: {
                orderType: 'sklep',
                productName,
                fileName,
                locale: locale ?? 'pl',
            },
        })

        return NextResponse.json({ clientSecret: paymentIntent.client_secret })

    } catch (error) {
        console.error('Sklep checkout error:', error)
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        )
    }
}