// Durable transactional-email outbox.
//
// Payment/contact rows remain the source of truth. Outbox rows contain only a
// source reference and delivery state; message bodies and signed download URLs
// are generated at send time and are never persisted here.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateDownloadUrl } from '@/lib/supabase-storage'
import {
    sendContactNotificationEmail,
    sendDownloadEmail,
    sendOrderConfirmationEmail,
    sendOrderNotificationToJoanna,
    sendPhysicalOrderEmail,
} from '@/lib/email'
import type { EmailLocale } from '@/lib/emailTemplates'

export type EmailJobKind =
    | 'shop_download'
    | 'shop_shipping'
    | 'joanna_shop_notification'
    | 'cart_confirmation'
    | 'joanna_cart_notification'
    | 'joanna_contact_notification'

export type EmailSourceType =
    | 'sklep_order'
    | 'cart_order'
    | 'contact_submission'

type EmailJobStatus =
    | 'pending'
    | 'processing'
    | 'accepted'
    | 'delivered'
    | 'delayed'
    | 'failed'
    | 'bounced'
    | 'complained'
    | 'suppressed'
    | 'dead'

export interface EmailOutboxJob {
    id: string
    dedupe_key: string
    kind: EmailJobKind
    source_type: EmailSourceType
    source_reference: string
    status: EmailJobStatus
    attempt_count: number
    send_generation: number
    provider_email_id: string | null
}

interface EnqueueEmailJobInput {
    dedupeKey: string
    kind: EmailJobKind
    sourceType: EmailSourceType
    sourceReference: string | number
}

export interface ProcessEmailJobsResult {
    claimed: number
    accepted: number
    failed: number
    dead: number
}

export interface EmailOutboxHealth {
    terminalFailures: number
    staleAccepted: number
}

const MAX_ATTEMPTS = 8
const RETRY_DELAYS_SECONDS = [60, 300, 1_800, 7_200, 18_000, 36_000, 86_400]
// The URL itself lasts 30 days. Refresh one day early, but otherwise retain it
// so every retry has byte-for-byte identical content for Resend idempotency.
const DOWNLOAD_URL_REUSE_MS = 29 * 24 * 60 * 60 * 1_000

function normaliseLocale(value: unknown): EmailLocale {
    return value === 'en' ? 'en' : 'pl'
}

function safeError(error: unknown): string {
    return (error instanceof Error ? error.message : String(error)).slice(0, 400)
}

function nextAttemptIso(attemptCount: number): string {
    const delayIndex = Math.min(
        Math.max(attemptCount - 1, 0),
        RETRY_DELAYS_SECONDS.length - 1
    )
    return new Date(Date.now() + RETRY_DELAYS_SECONDS[delayIndex] * 1_000).toISOString()
}

function providerIdempotencyKey(job: EmailOutboxJob): string {
    return `${job.dedupe_key}:g${job.send_generation}`
}

function parseItemNames(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string')
    }

    if (typeof value === 'string') {
        try {
            const parsed: unknown = JSON.parse(value)
            return Array.isArray(parsed)
                ? parsed.filter((item): item is string => typeof item === 'string')
                : []
        } catch {
            return []
        }
    }

    return []
}

interface ShippingShape {
    name?: string | null
    phone?: string | null
    address?: {
        line1?: string | null
        line2?: string | null
        postal_code?: string | null
        city?: string | null
        state?: string | null
        country?: string | null
    } | null
}

function formatShippingAddress(value: unknown): string {
    if (!value || typeof value !== 'object') return ''

    const shipping = value as ShippingShape
    const address = shipping.address

    return [
        shipping.name,
        address?.line1,
        address?.line2,
        [address?.postal_code, address?.city].filter(Boolean).join(' '),
        address?.state,
        address?.country,
        shipping.phone ? `Tel: ${shipping.phone}` : '',
    ]
        .filter(Boolean)
        .join('\n')
}

export async function enqueueEmailJob({
    dedupeKey,
    kind,
    sourceType,
    sourceReference,
}: EnqueueEmailJobInput): Promise<void> {
    const { error } = await supabaseAdmin
        .from('email_outbox')
        .upsert(
            {
                dedupe_key: dedupeKey,
                kind,
                source_type: sourceType,
                source_reference: String(sourceReference),
                status: 'pending',
            },
            {
                onConflict: 'dedupe_key',
                ignoreDuplicates: true,
            }
        )

    if (error) {
        throw new Error(`Could not enqueue ${kind}: ${error.message}`)
    }
}

async function sendShopJob(job: EmailOutboxJob): Promise<string> {
    const { data: order, error } = await supabaseAdmin
        .from('sklep_orders')
        .select(
            'customer_email, product_name, product_type, file_name, amount_total, currency, shipping_address, email_locale, download_url, download_url_created_at'
        )
        .eq('id', job.source_reference)
        .single()

    if (error || !order) {
        throw new Error(`Shop order source is unavailable: ${error?.message ?? 'not found'}`)
    }

    const customerEmail = String(order.customer_email ?? '')
    const productName = String(order.product_name ?? '')
    const amount = Number(order.amount_total)
    const currency = String(order.currency ?? 'GBP')
    const locale = normaliseLocale(order.email_locale)

    if (!customerEmail || !productName || !Number.isFinite(amount)) {
        throw new Error('Shop order is missing required email fields')
    }

    if (job.kind === 'shop_download') {
        const fileName = String(order.file_name ?? '')
        if (!fileName) throw new Error('Shop order is missing its download file')

        const storedUrl = String(order.download_url ?? '')
        const storedAt = Date.parse(String(order.download_url_created_at ?? ''))
        const storedUrlIsReusable =
            storedUrl !== '' &&
            Number.isFinite(storedAt) &&
            Date.now() - storedAt < DOWNLOAD_URL_REUSE_MS

        let downloadUrl = storedUrl
        if (!storedUrlIsReusable) {
            downloadUrl = await generateDownloadUrl(fileName)
            const generatedAt = new Date().toISOString()
            const { error: persistUrlError } = await supabaseAdmin
                .from('sklep_orders')
                .update({
                    download_url: downloadUrl,
                    download_url_created_at: generatedAt,
                })
                .eq('id', job.source_reference)

            // Persist before sending. If this fails, no provider request is
            // made, so the next attempt can safely generate another URL.
            if (persistUrlError) {
                throw new Error(
                    `Could not persist stable download URL: ${persistUrlError.message}`
                )
            }
        }

        return sendDownloadEmail({
            to: customerEmail,
            productName,
            downloadUrl,
            locale,
            idempotencyKey: providerIdempotencyKey(job),
        })
    }

    if (job.kind === 'shop_shipping') {
        return sendPhysicalOrderEmail({
            to: customerEmail,
            productName,
            locale,
            idempotencyKey: providerIdempotencyKey(job),
        })
    }

    if (job.kind === 'joanna_shop_notification') {
        const productType = String(order.product_type ?? 'digital')
        const orderKind =
            productType === 'bundle'
                ? 'bundle'
                : productType === 'physical'
                  ? 'physical'
                  : 'sklep'

        return sendOrderNotificationToJoanna({
            productName,
            customerEmail,
            amount,
            currency,
            orderKind,
            shippingText:
                orderKind === 'physical' || orderKind === 'bundle'
                    ? formatShippingAddress(order.shipping_address)
                    : undefined,
            idempotencyKey: providerIdempotencyKey(job),
        })
    }

    throw new Error(`Invalid shop email kind: ${job.kind}`)
}

async function sendCartJob(job: EmailOutboxJob): Promise<string> {
    const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('customer_email, amount_total, currency, items, email_locale')
        .eq('id', job.source_reference)
        .single()

    if (error || !order) {
        throw new Error(`Cart order source is unavailable: ${error?.message ?? 'not found'}`)
    }

    const customerEmail = String(order.customer_email ?? '')
    const amount = Number(order.amount_total)
    const currency = String(order.currency ?? 'GBP')
    const itemNames = parseItemNames(order.items)

    if (!customerEmail || !Number.isFinite(amount)) {
        throw new Error('Cart order is missing required email fields')
    }

    if (job.kind === 'cart_confirmation') {
        return sendOrderConfirmationEmail({
            to: customerEmail,
            itemNames,
            amount,
            currency,
            locale: normaliseLocale(order.email_locale),
            idempotencyKey: providerIdempotencyKey(job),
        })
    }

    if (job.kind === 'joanna_cart_notification') {
        return sendOrderNotificationToJoanna({
            productName: itemNames.join(', ') || 'Zamówienie',
            customerEmail,
            amount,
            currency,
            orderKind: 'cart',
            idempotencyKey: providerIdempotencyKey(job),
        })
    }

    throw new Error(`Invalid cart email kind: ${job.kind}`)
}

async function sendContactJob(job: EmailOutboxJob): Promise<string> {
    if (job.kind !== 'joanna_contact_notification') {
        throw new Error(`Invalid contact email kind: ${job.kind}`)
    }

    const { data: submission, error } = await supabaseAdmin
        .from('contact_submissions')
        .select('name, email, phone, subject, message, locale')
        .eq('id', job.source_reference)
        .single()

    if (error || !submission) {
        throw new Error(`Contact source is unavailable: ${error?.message ?? 'not found'}`)
    }

    return sendContactNotificationEmail({
        name: String(submission.name ?? ''),
        email: String(submission.email ?? ''),
        phone: submission.phone ? String(submission.phone) : null,
        subject: submission.subject ? String(submission.subject) : null,
        message: String(submission.message ?? ''),
        locale: normaliseLocale(submission.locale),
        idempotencyKey: providerIdempotencyKey(job),
    })
}

async function sendClaimedJob(job: EmailOutboxJob): Promise<string> {
    if (job.source_type === 'sklep_order') return sendShopJob(job)
    if (job.source_type === 'cart_order') return sendCartJob(job)
    if (job.source_type === 'contact_submission') return sendContactJob(job)
    throw new Error(`Unknown email source type: ${job.source_type}`)
}

async function recordAcceptedJob(
    job: EmailOutboxJob,
    providerEmailId: string
): Promise<void> {
    const acceptedAt = new Date().toISOString()
    const { error } = await supabaseAdmin
        .from('email_outbox')
        .update({
            status: 'accepted',
            provider_email_id: providerEmailId,
            accepted_at: acceptedAt,
            locked_at: null,
            last_error: null,
            updated_at: acceptedAt,
        })
        .eq('id', job.id)

    if (error) {
        throw new Error(`Email was accepted but outbox update failed: ${error.message}`)
    }

    if (job.source_type === 'sklep_order') {
        const update =
            job.kind === 'joanna_shop_notification'
                ? { joanna_notified_at: acceptedAt }
                : { customer_email_accepted_at: acceptedAt }
        await supabaseAdmin
            .from('sklep_orders')
            .update(update)
            .eq('id', job.source_reference)
    } else if (job.source_type === 'cart_order') {
        const update =
            job.kind === 'joanna_cart_notification'
                ? { joanna_notified_at: acceptedAt }
                : { customer_email_accepted_at: acceptedAt }
        await supabaseAdmin
            .from('orders')
            .update(update)
            .eq('id', job.source_reference)
    } else {
        await supabaseAdmin
            .from('contact_submissions')
            .update({
                notification_accepted_at: acceptedAt,
                notification_error: null,
            })
            .eq('id', job.source_reference)
    }

    // A delivery webhook can arrive immediately after Resend accepts a send,
    // before provider_email_id has been committed above. Replay any durable,
    // still-unprocessed events now so that race cannot lose delivery state.
    await replayPendingResendEvents(providerEmailId)
}

async function recordFailedJob(job: EmailOutboxJob, error: unknown): Promise<boolean> {
    const isDead = job.attempt_count >= MAX_ATTEMPTS
    const message = safeError(error)
    const { error: updateError } = await supabaseAdmin
        .from('email_outbox')
        .update({
            status: isDead ? 'dead' : 'failed',
            locked_at: null,
            last_error: message,
            next_attempt_at: nextAttemptIso(job.attempt_count),
            updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)

    if (updateError) {
        console.error(`Could not record failed email job ${job.id}:`, updateError.message)
    }

    if (job.source_type === 'contact_submission') {
        await supabaseAdmin
            .from('contact_submissions')
            .update({ notification_error: message })
            .eq('id', job.source_reference)
    }

    return isDead
}

export async function processEmailJobs(options: {
    limit?: number
    sourceType?: EmailSourceType
    sourceReference?: string | number
} = {}): Promise<ProcessEmailJobsResult> {
    const { data, error } = await supabaseAdmin.rpc('claim_email_outbox_jobs', {
        p_limit: options.limit ?? 10,
        p_source_type: options.sourceType ?? null,
        p_source_reference:
            options.sourceReference === undefined
                ? null
                : String(options.sourceReference),
    })

    if (error) {
        throw new Error(`Could not claim email jobs: ${error.message}`)
    }

    const jobs = (data ?? []) as EmailOutboxJob[]
    const result: ProcessEmailJobsResult = {
        claimed: jobs.length,
        accepted: 0,
        failed: 0,
        dead: 0,
    }

    for (const job of jobs) {
        try {
            const providerEmailId = await sendClaimedJob(job)
            await recordAcceptedJob(job, providerEmailId)
            result.accepted += 1
        } catch (sendError) {
            const isDead = await recordFailedJob(job, sendError)
            console.error(`Email outbox job ${job.id} failed:`, safeError(sendError))
            result.failed += 1
            if (isDead) result.dead += 1
        }
    }

    return result
}

export async function sourceEmailJobsAreAccepted(
    sourceType: EmailSourceType,
    sourceReference: string | number
): Promise<boolean> {
    const { data, error } = await supabaseAdmin
        .from('email_outbox')
        .select('status')
        .eq('source_type', sourceType)
        .eq('source_reference', String(sourceReference))

    if (error || !data?.length) return false

    return data.every((job) =>
        ['accepted', 'delivered', 'delayed'].includes(String(job.status))
    )
}

export async function getEmailOutboxHealth(): Promise<EmailOutboxHealth> {
    const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString()

    const [terminalResult, staleResult] = await Promise.all([
        supabaseAdmin
            .from('email_outbox')
            .select('id', { head: true, count: 'exact' })
            .in('status', ['dead', 'bounced', 'complained', 'suppressed']),
        supabaseAdmin
            .from('email_outbox')
            .select('id', { head: true, count: 'exact' })
            .in('status', ['accepted', 'delayed'])
            .lt('accepted_at', staleCutoff),
    ])

    if (terminalResult.error || staleResult.error) {
        throw new Error(
            `Could not inspect email outbox health: ${
                terminalResult.error?.message ?? staleResult.error?.message
            }`
        )
    }

    return {
        terminalFailures: terminalResult.count ?? 0,
        staleAccepted: staleResult.count ?? 0,
    }
}

export async function recordResendEvent(input: {
    eventId: string
    eventType: string
    providerEmailId: string
    eventCreatedAt: string
    error?: string | null
}): Promise<EmailOutboxJob | null> {
    const { data, error } = await supabaseAdmin.rpc('record_resend_email_event', {
        p_event_id: input.eventId,
        p_event_type: input.eventType,
        p_provider_email_id: input.providerEmailId,
        p_event_created_at: input.eventCreatedAt,
        p_error: input.error?.slice(0, 400) ?? null,
    })

    if (error) throw new Error(`Could not record Resend event: ${error.message}`)
    const rows = (data ?? []) as EmailOutboxJob[]
    return rows[0] ?? null
}

export async function reconcileSourceAfterResendEvent(
    job: EmailOutboxJob,
    eventType: string,
    eventCreatedAt: string
): Promise<void> {
    const customerFailureEvents = [
        'email.bounced',
        'email.failed',
        'email.suppressed',
    ]

    if (job.source_type === 'sklep_order') {
        if (
            eventType === 'email.delivered' &&
            (job.kind === 'shop_download' || job.kind === 'shop_shipping')
        ) {
            // Any customer-facing shop message can record confirmed mail-server
            // delivery. Only a digital-only download completes fulfilment;
            // bundles must remain `to_ship` until the parcel is handled.
            await supabaseAdmin
                .from('sklep_orders')
                .update({
                    customer_email_delivered_at: eventCreatedAt,
                })
                .eq('id', job.source_reference)

            if (job.kind === 'shop_download') {
                await supabaseAdmin
                    .from('sklep_orders')
                    .update({
                        fulfilment_status: 'delivered',
                        fulfilled_at: eventCreatedAt,
                        fulfilment_error: null,
                    })
                    .eq('id', job.source_reference)
                    .eq('product_type', 'digital')
            }

            if (job.kind === 'shop_shipping' || job.kind === 'shop_download') {
                // Restore a physical/bundle order that was temporarily marked
                // failed after a provider-level failure and then recovered.
                await supabaseAdmin
                    .from('sklep_orders')
                    .update({
                        fulfilment_status: 'to_ship',
                        fulfilment_error: null,
                    })
                    .eq('id', job.source_reference)
                    .in('product_type', ['physical', 'bundle'])
            }
        } else if (
            customerFailureEvents.includes(eventType) &&
            (job.kind === 'shop_download' || job.kind === 'shop_shipping')
        ) {
            await supabaseAdmin
                .from('sklep_orders')
                .update({
                    fulfilment_status: 'failed',
                    fulfilment_error: `Resend reported ${eventType}`,
                })
                .eq('id', job.source_reference)
        }
    } else if (job.source_type === 'cart_order') {
        if (eventType === 'email.delivered' && job.kind === 'cart_confirmation') {
            await supabaseAdmin
                .from('orders')
                .update({
                    customer_email_delivered_at: eventCreatedAt,
                    fulfilment_status: 'confirmed',
                    fulfilled_at: eventCreatedAt,
                    fulfilment_error: null,
                })
                .eq('id', job.source_reference)
        } else if (
            customerFailureEvents.includes(eventType) &&
            job.kind === 'cart_confirmation'
        ) {
            await supabaseAdmin
                .from('orders')
                .update({
                    fulfilment_status: 'failed',
                    fulfilment_error: `Resend reported ${eventType}`,
                })
                .eq('id', job.source_reference)
        }
    } else if (job.source_type === 'contact_submission') {
        if (eventType === 'email.delivered') {
            await supabaseAdmin
                .from('contact_submissions')
                .update({
                    notification_delivered_at: eventCreatedAt,
                    notification_error: null,
                })
                .eq('id', job.source_reference)
        } else if (customerFailureEvents.includes(eventType)) {
            await supabaseAdmin
                .from('contact_submissions')
                .update({ notification_error: `Resend reported ${eventType}` })
                .eq('id', job.source_reference)
        }
    }
}

async function replayPendingResendEvents(providerEmailId: string): Promise<void> {
    const { data: events, error } = await supabaseAdmin
        .from('resend_webhook_events')
        .select('event_id, event_type, event_created_at, event_error')
        .eq('provider_email_id', providerEmailId)
        .is('processed_at', null)
        .order('event_created_at', { ascending: true })

    if (error) {
        throw new Error(`Could not replay Resend events: ${error.message}`)
    }

    for (const event of events ?? []) {
        const job = await recordResendEvent({
            eventId: String(event.event_id),
            eventType: String(event.event_type),
            providerEmailId,
            eventCreatedAt: String(event.event_created_at),
            error: event.event_error ? String(event.event_error) : null,
        })

        if (job) {
            await reconcileSourceAfterResendEvent(
                job,
                String(event.event_type),
                String(event.event_created_at)
            )
        }
    }
}
