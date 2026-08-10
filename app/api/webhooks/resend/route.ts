// Signed Resend delivery-event webhook.
// Tracks the difference between "Resend accepted the API request" and
// "the recipient's mail server accepted the message".

import { NextRequest, NextResponse } from 'next/server'
import { Resend, type WebhookEventPayload } from 'resend'
import {
    recordResendEvent,
    reconcileSourceAfterResendEvent,
} from '@/lib/email-outbox'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

const TRACKED_EVENTS = new Set([
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.bounced',
    'email.complained',
    'email.failed',
    'email.suppressed',
])

function eventError(event: WebhookEventPayload): string | null {
    if (event.type === 'email.failed') return event.data.failed.reason
    if (event.type === 'email.bounced') return event.data.bounce.message
    if (event.type === 'email.suppressed') return event.data.suppressed.message
    if (event.type === 'email.complained') return 'Recipient marked the email as spam'
    return null
}

export async function POST(request: NextRequest) {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (!webhookSecret) {
        console.error('Resend webhook rejected: RESEND_WEBHOOK_SECRET is not configured')
        return NextResponse.json({ error: 'Webhook unavailable' }, { status: 503 })
    }

    const payload = await request.text()
    const id = request.headers.get('svix-id')
    const timestamp = request.headers.get('svix-timestamp')
    const signature = request.headers.get('svix-signature')

    if (!id || !timestamp || !signature) {
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 })
    }

    let event: WebhookEventPayload
    try {
        event = resend.webhooks.verify({
            payload,
            headers: { id, timestamp, signature },
            webhookSecret,
        })
    } catch {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    if (!TRACKED_EVENTS.has(event.type) || !('email_id' in event.data)) {
        return NextResponse.json({ received: true })
    }

    try {
        const job = await recordResendEvent({
            eventId: id,
            eventType: event.type,
            providerEmailId: event.data.email_id,
            eventCreatedAt: event.created_at,
            error: eventError(event),
        })

        // null means a duplicate/already-processed delivery, an out-of-order
        // older event, an event that raced provider-ID persistence (it remains
        // durable for replay), or an email not sent by this outbox.
        if (job) {
            await reconcileSourceAfterResendEvent(job, event.type, event.created_at)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error(
            'Could not persist Resend delivery event:',
            error instanceof Error ? error.message : String(error)
        )
        // Resend retries non-2xx webhook responses.
        return NextResponse.json({ error: 'Persistence failed' }, { status: 503 })
    }
}
