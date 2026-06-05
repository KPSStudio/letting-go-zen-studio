// app/api/checkout/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { items, currency, locale } = body

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'No items in cart' },
                { status: 400 }
            )
        }

        // Calculate total in smallest currency unit (pence/grosze)
        const amount = currency === 'PLN'
            ? items.reduce((sum: number, item: { pln: number }) => sum + Math.round(item.pln * 100), 0)
            : items.reduce((sum: number, item: { gbp: number }) => sum + Math.round(item.gbp * 100), 0)

        // Create Payment Intent
        // allow_redirects: 'never' removes Klarna, Amazon Pay etc
        // Leaves only card, Apple Pay and Google Pay
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
                items: JSON.stringify(items.map((i: { name: string }) => i.name)),
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