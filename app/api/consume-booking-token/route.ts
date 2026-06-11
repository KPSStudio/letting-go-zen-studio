// app/api/consume-booking-token/route.ts
// Marks a booking token as used after Cal.com booking completes.
// Can only consume tokens in payment_confirmed state — a pending
// (unpaid) token cannot be consumed, and a used token stays used.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json()

        if (!token || typeof token !== 'string') {
            return NextResponse.json({ success: false }, { status: 400 })
        }

        const { error } = await supabase
            .from('booking_tokens')
            .update({ status: 'used' })
            .eq('token', token)
            .eq('status', 'payment_confirmed')

        if (error) {
            console.error('Consume booking token error:', error)
            return NextResponse.json({ success: false }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}