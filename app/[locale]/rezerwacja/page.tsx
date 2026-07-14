// app/[locale]/rezerwacja/page.tsx
// Combined booking page.
// After payment the customer lands here with ?token=...
//   STAGE 1 (waiting): poll the token until the Stripe webhook confirms
//           payment — shows the "confirming payment" screen.
//   STAGE 2 (allowed): once confirmed, swap in the Cal.com calendar in
//           place — no extra page, no navigation.
// Security gate preserved: the calendar only renders when the server
// reports the token as payment_confirmed.
// All visible text flows through next-intl (bookingPage + bookingPending).

'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Cal, { getCalApi } from '@calcom/embed-react'

const CAL_USERNAME = 'lettinggozenstudio'

// Every stage of the journey, all handled on this one page:
//   waiting  – payment not yet confirmed by the webhook; keep polling
//   allowed  – payment confirmed; show the Cal.com calendar
//   used     – this token has already produced a booking
//   failed   – polled long enough and never got confirmation
//   blocked  – arrived here with no token (i.e. without paying)
type BookingStage = 'waiting' | 'allowed' | 'used' | 'failed' | 'blocked'

type VerifyBookingTokenResponse = {
    valid?: boolean
    status?: string
    serviceId?: string
    serviceName?: string
    price?: number
}

function BookingFlow() {
    const searchParams = useSearchParams()
    const locale = useLocale()
    const tPage = useTranslations('bookingPage')
    const tPending = useTranslations('bookingPending')

    const token = searchParams.get('token') ?? ''
    const serviceFromUrl = searchParams.get('service') ?? ''

    const [stage, setStage] = useState<BookingStage>('waiting')

    // The Cal.com slug. The server is the source of truth (it returns the
    // real serviceId once payment is confirmed); the URL is a fallback.
    const [calSlug, setCalSlug] = useState(serviceFromUrl)

    // ── STAGE 1: poll the token until payment is confirmed ──
    useEffect(() => {
        if (!token) {
            setStage('blocked')
            return
        }

        let attempts = 0
        const maxAttempts = 20            // 20 tries × 2s = ~40s before giving up
        let stopped = false
        let intervalId: number | undefined

        // Stop polling and move to a final stage.
        const finish = (next: BookingStage, slug?: string) => {
            stopped = true
            if (intervalId !== undefined) window.clearInterval(intervalId)
            if (slug !== undefined) setCalSlug(slug)
            setStage(next)
        }

        async function check() {
            if (stopped) return
            attempts += 1

            try {
                const response = await fetch('/api/verify-booking-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                })

                const data = (await response.json()) as VerifyBookingTokenResponse

                // Paid and not yet used → open the calendar.
                if (data.valid && data.status === 'payment_confirmed') {
                    finish('allowed', data.serviceId ?? serviceFromUrl)
                    return
                }

                // Token already spent on a previous booking.
                if (data.status === 'used') {
                    finish('used')
                    return
                }
            } catch {
                // Temporary network blip — keep polling until maxAttempts.
            }

            if (attempts >= maxAttempts) {
                finish('failed')
            }
        }

        // Check once straight away (so an already-confirmed token opens the
        // calendar with no delay), then keep checking every 2 seconds.
        check()
        if (!stopped) {
            intervalId = window.setInterval(check, 2000)
        }

        return () => {
            stopped = true
            if (intervalId !== undefined) window.clearInterval(intervalId)
        }
    }, [token, serviceFromUrl])

    // ── STAGE 2: once allowed, boot the Cal.com calendar ──
    useEffect(() => {
        if (stage !== 'allowed') return

        getCalApi().then(cal => {
            cal('ui', {
                theme: 'dark',
                styles: { branding: { brandColor: '#D4AF6A' } },
                hideEventTypeDetails: false,
            })

            cal('on', {
                action: 'bookingSuccessful',
                callback: () => {
                    // Mark the token used, then send the customer to the
                    // booking-complete thank-you screen.
                    fetch('/api/consume-booking-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token }),
                    }).finally(() => {
                        window.location.href = `/${locale}/koszyk?bookingComplete=true`
                    })
                },
            })
        })
    }, [stage, token, locale])

    // ── WAITING / USED / FAILED: the "confirming payment" style screen ──
    if (stage === 'waiting' || stage === 'used' || stage === 'failed') {
        return (
            <main className="thankyou-page booking-pending-page">
                <div className="thankyou-orbit" aria-hidden="true">
                    <span className="thankyou-orbit-dot" />
                    <span className="thankyou-orbit-dot" />
                    <span className="thankyou-orbit-dot" />
                </div>

                <div className="thankyou-aura" aria-hidden="true" />

                <section className="thankyou-content booking-pending-panel">
                    <div className="thankyou-symbol" aria-hidden="true">✦</div>

                    <div className="thankyou-label">
                        <span />
                        {tPending('label')}
                        <span />
                    </div>

                    {stage === 'waiting' && (
                        <>
                            <h1 className="thankyou-title">
                                {tPending('confirmingMain')}
                                <br />
                                {tPending('confirmingGold')}
                            </h1>

                            <div className="thankyou-divider" />

                            <p className="thankyou-text">{tPending('waitText')}</p>
                            <p className="thankyou-subtext">{tPending('waitSubtext')}</p>

                            <div className="booking-pending-loader" aria-hidden="true">
                                <span />
                                <span />
                                <span />
                            </div>
                        </>
                    )}

                    {stage === 'used' && (
                        <>
                            <h1 className="thankyou-title">
                                {tPending('usedMain')}
                                <br />
                                {tPending('usedGold')}
                            </h1>

                            <div className="thankyou-divider" />

                            <p className="thankyou-text">{tPending('usedText')}</p>
                            <p className="thankyou-subtext">{tPending('usedSubtext')}</p>
                        </>
                    )}

                    {stage === 'failed' && (
                        <>
                            <h1 className="thankyou-title">
                                {tPending('failedMain')}
                                <br />
                                {tPending('failedGold')}
                            </h1>

                            <div className="thankyou-divider" />

                            <p className="thankyou-text">{tPending('failedText')}</p>
                            <p className="thankyou-subtext">{tPending('failedSubtext')}</p>
                        </>
                    )}
                </section>
            </main>
        )
    }

    // ── BLOCKED: arrived without a valid paid token ──
    if (stage === 'blocked') {
        return (
            <main className="body-page">
                <p className="shop-label">
                    <span />
                    {tPage('label')}
                </p>

                <section className="body-header">
                    <h1 className="body-title">
                        {tPage('titleMain')} <span>{tPage('titleGold')}</span>
                    </h1>
                </section>

                <section className="booking-panel">
                    <div className="booking-state booking-state-blocked">
                        <p className="booking-blocked-title">{tPage('blockedTitle')}</p>
                        <p className="booking-blocked-text">{tPage('blockedText')}</p>

                        <div className="booking-blocked-actions">
                            <Link href={`/${locale}/body`} className="cart-primary-link">
                                {tPage('bodyButton')}
                            </Link>
                            <Link href={`/${locale}/mind`} className="cart-primary-link">
                                {tPage('mindButton')}
                            </Link>
                            <Link href={`/${locale}/soul`} className="cart-primary-link">
                                {tPage('soulButton')}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        )
    }

    // ── ALLOWED: payment confirmed — show the calendar ──
    return (
        <main className="body-page">
            <p className="shop-label">
                <span />
                {tPage('label')}
            </p>

            <section className="body-header">
                <h1 className="body-title">
                    {tPage('titleMain')} <span>{tPage('titleGold')}</span>
                </h1>

                <p className="body-intro">{tPage('intro')}</p>
            </section>

            <section className="booking-panel">
                <Cal
                    calLink={`${CAL_USERNAME}/${calSlug}`}
                    className="booking-cal-embed"
                    config={{ layout: 'month_view' }}
                />
            </section>
        </main>
    )
}

export default function RezerwacjaPage() {
    return (
        <Suspense fallback={null}>
            <BookingFlow />
        </Suspense>
    )
}