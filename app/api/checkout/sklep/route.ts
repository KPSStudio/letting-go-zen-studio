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

        // Physical and bundle products are shipped, so they carry a flat postage
        // fee (set in Sanity, in GBP) on top of the price.
        const productType = product.productType ?? 'digital'
        const isShipped = productType === 'physical' || productType === 'bundle'
        const isPln = currency === 'PLN'

        const basePrice = isPln
            ? product.pricePLN ?? gbpToPln(product.priceGBP)
            : product.priceGBP

        const shippingFeeGbp = isShipped ? product.shippingFeeGBP ?? 0 : 0
        const shippingFee = isPln ? gbpToPln(shippingFeeGbp) : shippingFeeGbp

        const amount = Math.round((basePrice + shippingFee) * 100)

        if (amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            )
        }

        // Stripe metadata values must be strings; only include fileName for
        // products that actually deliver a PDF (digital / bundle).
        const metadata: Record<string, string> = {
            orderType: 'sklep',
            productType,
            productName: product.namePl,
            locale: locale ?? 'pl',
        }
        if (product.fileName) metadata.fileName = product.fileName

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: currency?.toLowerCase() ?? 'gbp',
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
            metadata,
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