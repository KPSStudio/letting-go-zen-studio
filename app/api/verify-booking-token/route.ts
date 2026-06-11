// app/api/verify-booking-token/route.ts
// Checks a booking token's status. Used by:
// - the booking-pending page (polling for payment_confirmed)
// - the rezerwacja page (gate before showing Cal.com)

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
            return NextResponse.json(
                { valid: false, status: 'invalid' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('booking_tokens')
            .select('status, service_id, service_name, price_gbp, locale, expires_at')
            .eq('token', token)
            .single()

        if (error || !data) {
            return NextResponse.json(
                { valid: false, status: 'not_found' },
                { status: 404 }
            )
        }

        // Expired tokens are never valid, regardless of status
        if (new Date(data.expires_at) < new Date()) {
            return NextResponse.json(
                { valid: false, status: 'expired' },
                { status: 410 }
            )
        }

        return NextResponse.json({
            // valid = payment confirmed and not yet used for a booking
            valid: data.status === 'payment_confirmed',
            status: data.status,
            serviceId: data.service_id,
            serviceName: data.service_name,
            price: data.price_gbp,
            locale: data.locale,
        })
    } catch (error) {
        console.error('Verify booking token error:', error)
        return NextResponse.json(
            { valid: false, status: 'error' },
            { status: 500 }
        )
    }
}