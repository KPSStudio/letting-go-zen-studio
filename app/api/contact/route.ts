// app/api/contact/route.ts
// Handles contact form submissions.
//
// Validates and normalises input, saves it to Supabase `contact_submissions`,
// and then emails Joanna so the message is actually seen.
//
// WHY THE EMAIL MATTERS: the contact page promises a reply "within 24 hours",
// but this route previously only wrote a database row. Nothing notified anyone,
// so unless Joanna happened to open the Supabase table editor, a customer
// enquiry sat unread while the site promised a response. No external Supabase
// automation (Database Webhook / Edge Function / trigger) could be found in
// this repository; if one does exist it is invisible to version control, and
// duplicated notifications are a far smaller problem than silent ones. See the
// audit report — confirming this in the Supabase dashboard is a launch check.

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
    enqueueEmailJob,
    processEmailJobs,
    sourceEmailJobsAreAccepted,
} from '@/lib/email-outbox'

// Generous for a real enquiry, small enough that the table cannot be used as
// free storage. Enforced after trimming.
const FIELD_LIMITS = {
    name: 120,
    email: 254, // RFC 5321 maximum
    phone: 40,
    subject: 200,
    message: 5000,
} as const

const SUPPORTED_LOCALES = ['pl', 'en'] as const

function normalise(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
}

export async function POST(req: NextRequest) {
    try {
        let body: Record<string, unknown>
        try {
            const parsed: unknown = await req.json()
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                throw new Error('Body must be a JSON object')
            }
            body = parsed as Record<string, unknown>
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

        // ── HONEYPOT ──
        // A field no human sees and no human fills. Most form-spam bots fill
        // every input they find. We answer 200 rather than 400 so the bot gets
        // no signal that it was detected — it just quietly goes nowhere.
        if (normalise(body.website) !== '') {
            console.warn('Contact submission rejected: honeypot filled')
            return NextResponse.json({ success: true })
        }

        const name = normalise(body.name)
        const email = normalise(body.email)
        const phone = normalise(body.phone)
        const subject = normalise(body.subject)
        const message = normalise(body.message)

        const requestedLocale = normalise(body.locale)
        const locale = (SUPPORTED_LOCALES as readonly string[]).includes(requestedLocale)
            ? requestedLocale
            : 'pl'

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email and message are required' },
                { status: 400 }
            )
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            )
        }

        for (const [field, value] of Object.entries({
            name,
            email,
            phone,
            subject,
            message,
        })) {
            if (value.length > FIELD_LIMITS[field as keyof typeof FIELD_LIMITS]) {
                return NextResponse.json(
                    { error: `The ${field} field is too long` },
                    { status: 400 }
                )
            }
        }

        // ── 1. Persist ──
        // The row is the durable record. If this fails there is nothing to
        // notify about, so we stop here.
        const { data: inserted, error } = await supabaseAdmin
            .from('contact_submissions')
            .insert({
                name,
                email,
                phone: phone || null,
                subject: subject || null,
                message,
                locale,
            })
            .select('id')
            .single()

        if (error) {
            console.error('Supabase contact insert error:', error.message)
            return NextResponse.json(
                { error: 'Failed to save message' },
                { status: 500 }
            )
        }

        // ── 2. Queue + immediately attempt Joanna's notification ──
        // The submission is already durable. If Resend is down, the outbox
        // retains the job for cron recovery instead of losing the enquiry.
        try {
            await enqueueEmailJob({
                dedupeKey: `contact:${inserted.id}`,
                kind: 'joanna_contact_notification',
                sourceType: 'contact_submission',
                sourceReference: inserted.id,
            })

            const emailResult = await processEmailJobs({
                limit: 1,
                sourceType: 'contact_submission',
                sourceReference: inserted.id,
            })

            const accepted = await sourceEmailJobsAreAccepted(
                'contact_submission',
                inserted.id
            )

            if (emailResult.failed > 0 || !accepted) {
                throw new Error('Contact notification remains pending')
            }
        } catch (notificationError) {
            const reason =
                notificationError instanceof Error
                    ? notificationError.message
                    : String(notificationError)

            console.error(`Contact notification failed for row ${inserted.id}:`, reason)

            await supabaseAdmin
                .from('contact_submissions')
                .update({ notification_error: reason.slice(0, 400) })
                .eq('id', inserted.id)
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
