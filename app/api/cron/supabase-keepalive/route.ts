// app/api/cron/supabase-keepalive/route.ts
//
// A once-a-day authenticated health check that also serves as database
// activity, so a Supabase Free project is less likely to be paused for
// inactivity.
//
// ⚠️ BEST EFFORT, NOT A GUARANTEE. Supabase documents that Free projects may be
// paused after ~7 days of low activity and that "a few user requests per day"
// is normally enough to avoid it — but the only supported guarantee against
// inactivity pausing is a paid plan. Treat this route as a mitigation, not as
// an uptime control. See docs/RELEASE_AUDIT_2026-08.md.
//
// Security model:
//   • the secret only ever arrives in the Authorization header (never a query
//     string, which would end up in logs, referrers and browser history);
//   • the comparison is length-safe and constant-time;
//   • no branch of this route ever echoes the secret or any row contents.

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getEmailOutboxHealth, processEmailJobs } from '@/lib/email-outbox'

// Never prerender and never serve from a cache: a cached 200 would look
// healthy while no query ever reached Postgres, which defeats the whole point.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// The business-critical tables. We touch each one so the check fails loudly if
// a table is dropped, renamed, or made unreachable by a policy change — not
// just if the project is down.
const MONITORED_TABLES = ['booking_consents', 'orders', 'sklep_orders'] as const

// Constant-time compare that does not leak length through early return.
function secretMatches(provided: string, expected: string): boolean {
    const a = Buffer.from(provided, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) {
        // Still burn a comparison so the failure timing does not advertise
        // whether the length was right.
        timingSafeEqual(b, b)
        return false
    }
    return timingSafeEqual(a, b)
}

export async function GET(request: NextRequest) {
    const expectedSecret = process.env.CRON_SECRET

    // An unset or blank secret must fail closed. Without this an empty env var
    // would turn the endpoint into an open, unauthenticated database prod.
    if (!expectedSecret || expectedSecret.trim() === '') {
        console.error('Cron keepalive rejected: CRON_SECRET is not configured')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authorizationHeader = request.headers.get('authorization') ?? ''
    const bearerPrefix = 'Bearer '

    if (!authorizationHeader.startsWith(bearerPrefix)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const providedSecret = authorizationHeader.slice(bearerPrefix.length)

    if (!secretMatches(providedSecret, expectedSecret)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── The activity itself ──
    // One tiny indexed read per table. `head: true` asks PostgREST for no body
    // at all, and the exact: false count keeps this cheap on large tables — we
    // are proving the database answered, not reading customer data. Nothing
    // here inserts, updates, or returns a single row of content.
    for (const table of MONITORED_TABLES) {
        const { error } = await supabaseAdmin
            .from(table)
            .select('id', { head: true, count: 'estimated' })
            .limit(1)

        if (error) {
            // Log the table and the database's own message; neither contains
            // customer data or credentials.
            console.error(`Cron keepalive failed on "${table}":`, error.message)
            return NextResponse.json(
                { ok: false, failedTable: table },
                { status: 503, headers: { 'Cache-Control': 'no-store' } }
            )
        }
    }

    // Recovery sweep for email jobs left pending after provider/network errors
    // or after Stripe exhausted its own webhook retries. Immediate sends still
    // happen in the originating request; this is the durable safety net.
    let emailRecovery
    let emailHealth
    try {
        emailRecovery = await processEmailJobs({ limit: 10 })
        emailHealth = await getEmailOutboxHealth()
    } catch (error) {
        console.error(
            'Cron email recovery failed:',
            error instanceof Error ? error.message : String(error)
        )
        return NextResponse.json(
            { ok: false, failedCheck: 'email-recovery' },
            { status: 503, headers: { 'Cache-Control': 'no-store' } }
        )
    }

    if (
        emailRecovery.failed > 0 ||
        emailHealth.terminalFailures > 0 ||
        emailHealth.staleAccepted > 0
    ) {
        return NextResponse.json(
            {
                ok: false,
                failedCheck: 'email-recovery',
                failedJobs: emailRecovery.failed,
                deadJobs: emailRecovery.dead,
                terminalFailures: emailHealth.terminalFailures,
                staleAccepted: emailHealth.staleAccepted,
            },
            { status: 503, headers: { 'Cache-Control': 'no-store' } }
        )
    }

    return NextResponse.json(
        {
            ok: true,
            checkedAt: new Date().toISOString(),
            recoveredEmails: emailRecovery.accepted,
        },
        { headers: { 'Cache-Control': 'no-store' } }
    )
}
