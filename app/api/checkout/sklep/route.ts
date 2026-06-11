// app/api/checkout/sklep/route.ts
// SECURITY: price AND fileName are looked up from Sanity by productId.
// The client cannot set the price or request an arbitrary file.

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSklepProductById, gbpToPln } from '@/lib/sanity-server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { productId, currency, locale } = body as {
            productId?: string
            currency?: string
            locale?: string
        }

        if (!productId) {
            return NextResponse.json(
                { error: 'Missing productId' },
                { status: 400 }
            )
        }

        // ── SERVER-SIDE LOOKUP ──
        // Real price, real name, real file — straight from Sanity.
        const product = await getSklepProductById(productId)

        if (!product) {
            console.error(`Sklep checkout rejected — unknown product: "${productId}"`)
            return NextResponse.json(
                { error: 'Product not found or inactive' },
                { status: 400 }
            )
        }

        const amount = currency === 'PLN'
            ? Math.round((product.pricePLN ?? gbpToPln(product.priceGBP)) * 100)
            : Math.round(product.priceGBP * 100)

        if (amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
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
                orderType: 'sklep',
                productName: product.namePl,
                fileName: product.fileName,
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