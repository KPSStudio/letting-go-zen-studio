// app/api/checkout/sklep/route.ts
// SECURITY: price, product type AND fileName are looked up from Sanity by
// productId. The client cannot set the price, choose the product type, or
// request an arbitrary file.
//
// This route also does two things the old version did not:
//   1. It refuses product types we cannot actually fulfil (`course`), instead
//      of trusting a "do not publish this yet" note in the CMS.
//   2. It validates and forwards the legal acceptance the shop UI collects, so
//      the webhook can persist it as an audit record. Previously those fields
//      were sent by the client and silently dropped here.

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSklepProductById, gbpToPln } from '@/lib/sanity-server'
import {
    parseCurrency,
    isChargeablePrice,
    toMinorUnits,
} from '@/lib/currency-server'

// Product types with a real, built fulfilment path in the Stripe webhook.
// `course` exists in the Sanity schema but has no delivery branch: a customer
// could be charged and receive nothing at all. It stays blocked here until
// that branch is built.
const FULFILLABLE_PRODUCT_TYPES = ['digital', 'physical', 'bundle'] as const

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            productId,
            currency,
            locale,
            termsAccepted,
            privacyAccepted,
            immediateDeliveryConsent,
            withdrawalAcknowledged,
            shippingConsent,
            acceptedAt,
        } = body as {
            productId?: string
            currency?: string
            locale?: string
            termsAccepted?: unknown
            privacyAccepted?: unknown
            immediateDeliveryConsent?: unknown
            withdrawalAcknowledged?: unknown
            shippingConsent?: unknown
            acceptedAt?: unknown
        }

        if (!productId || typeof productId !== 'string') {
            return NextResponse.json(
                { error: 'Missing productId' },
                { status: 400 }
            )
        }

        // ── CURRENCY ALLOWLIST ── (see lib/currency-server.ts)
        const validatedCurrency = parseCurrency(currency)

        if (!validatedCurrency) {
            return NextResponse.json(
                { error: 'Unsupported currency' },
                { status: 400 }
            )
        }

        // ── SERVER-SIDE LOOKUP ──
        // Real price, real name, real type, real file — straight from Sanity.
        const product = await getSklepProductById(productId)

        if (!product) {
            console.error(`Sklep checkout rejected — unknown product: "${productId}"`)
            return NextResponse.json(
                { error: 'Product not found or inactive' },
                { status: 400 }
            )
        }

        const productType = product.productType ?? 'digital'

        // ── UNSUPPORTED PRODUCT TYPES ──
        if (!(FULFILLABLE_PRODUCT_TYPES as readonly string[]).includes(productType)) {
            console.error(
                `Sklep checkout rejected — product "${productId}" has unfulfillable type "${productType}"`
            )
            return NextResponse.json(
                { error: 'This product is not available for purchase yet' },
                { status: 400 }
            )
        }

        const isShipped = productType === 'physical' || productType === 'bundle'
        const hasPdf = productType === 'digital' || productType === 'bundle'

        // A PDF product with no file would charge the customer and deliver
        // nothing, exactly like the course case above.
        if (hasPdf && !product.fileName) {
            console.error(`Sklep checkout rejected — "${productId}" has no fileName`)
            return NextResponse.json(
                { error: 'This product is not available for purchase yet' },
                { status: 400 }
            )
        }

        // ── LEGAL ACCEPTANCE ──
        // Checked as strict booleans, and checked against what this product
        // type actually requires. A physical order does NOT waive the statutory
        // withdrawal right, so we must not record that it did.
        if (termsAccepted !== true || privacyAccepted !== true) {
            return NextResponse.json(
                { error: 'Terms and privacy policy must be accepted' },
                { status: 400 }
            )
        }

        if (hasPdf && (immediateDeliveryConsent !== true || withdrawalAcknowledged !== true)) {
            return NextResponse.json(
                { error: 'Immediate delivery consent is required for digital products' },
                { status: 400 }
            )
        }

        if (isShipped && shippingConsent !== true) {
            return NextResponse.json(
                { error: 'Delivery consent is required for shipped products' },
                { status: 400 }
            )
        }

        // The client's clock is not evidence; we stamp our own. The client value
        // is only kept if it parses, and never replaces the server timestamp.
        const acceptedAtIso = new Date().toISOString()
        const clientAcceptedAt =
            typeof acceptedAt === 'string' && !Number.isNaN(Date.parse(acceptedAt))
                ? new Date(acceptedAt).toISOString()
                : null

        // ── PRICING ──
        if (!isChargeablePrice(product.priceGBP)) {
            console.error(`Sklep checkout rejected — invalid GBP price on "${productId}"`)
            return NextResponse.json(
                { error: 'This product is not available for purchase yet' },
                { status: 400 }
            )
        }

        const isPln = validatedCurrency === 'PLN'

        const basePrice = isPln
            ? isChargeablePrice(product.pricePLN)
                ? product.pricePLN
                : gbpToPln(product.priceGBP)
            : product.priceGBP

        // Physical and bundle products carry a flat postage fee (set in Sanity,
        // in GBP) on top of the price. Absent or malformed means "no fee", not
        // "NaN".
        const rawShippingFee = isShipped ? product.shippingFeeGBP : undefined
        const shippingFeeGbp =
            typeof rawShippingFee === 'number' && Number.isFinite(rawShippingFee) && rawShippingFee > 0
                ? rawShippingFee
                : 0
        const shippingFee = isPln ? gbpToPln(shippingFeeGbp) : shippingFeeGbp

        const amount = toMinorUnits(basePrice + shippingFee)

        if (amount === null) {
            console.error(`Sklep checkout rejected — unusable amount for "${productId}"`)
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
            locale: locale === 'en' ? 'en' : 'pl',
            // Audit trail — the webhook copies these onto the order row.
            legalTermsAccepted: 'true',
            legalPrivacyAccepted: 'true',
            legalImmediateDelivery: String(hasPdf),
            legalWithdrawalAcknowledged: String(hasPdf),
            legalShippingConsent: String(isShipped),
            legalAcceptedAt: acceptedAtIso,
        }
        if (product.fileName) metadata.fileName = product.fileName
        if (clientAcceptedAt) metadata.legalAcceptedAtClient = clientAcceptedAt

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: validatedCurrency.toLowerCase(),
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
