// app/api/contact/route.ts
// Handles contact form submissions
// Validates input, saves to Supabase contact_submissions table

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, phone, subject, message, locale } = body

        // Basic validation
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email and message are required' },
                { status: 400 }
            )
        }

        // Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            )
        }

        // Save to Supabase
        const { error } = await supabaseAdmin
            .from('contact_submissions')
            .insert({
                name,
                email,
                phone: phone || null,
                subject: subject || null,
                message,
                locale: locale || 'pl',
            })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json(
                { error: 'Failed to save message' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Contact form error:', error)
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        )
    }
}