// app/[locale]/booking-pending/page.tsx
// Landing page after Stripe payment for booked sessions.
// It waits until the Stripe webhook confirms payment,
// then sends the customer to the booking page.
// All visible text comes from messages/pl.json and messages/en.json.

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

type PendingStatus = 'waiting' | 'failed' | 'already_used'

type VerifyBookingTokenResponse = {
    valid?: boolean
    status?: string
    serviceId?: string
    serviceName?: string
    price?: number
}

function BookingPendingInner() {
    const searchParams = useSearchParams()
    const locale = useLocale()
    const t = useTranslations('bookingPending')

    const token = searchParams.get('token') ?? ''
    const [status, setStatus] = useState<PendingStatus>('waiting')

    useEffect(() => {
        if (!token) {
            window.location.href = `/${locale}`
            return
        }

        let attempts = 0
        const maxAttempts = 20

        const interval = window.setInterval(async () => {
            attempts += 1

            try {
                const response = await fetch('/api/verify-booking-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                })

                const data = (await response.json()) as VerifyBookingTokenResponse

                if (data.valid && data.status === 'payment_confirmed') {
                    window.clearInterval(interval)

                    const params = new URLSearchParams({
                        service: data.serviceId ?? '',
                        serviceName: data.serviceName ?? '',
                        price: String(data.price ?? ''),
                        locale,
                        token,
                    })

                    window.location.href = `/${locale}/rezerwacja?${params.toString()}`
                    return
                }

                if (data.status === 'used') {
                    window.clearInterval(interval)
                    setStatus('already_used')
                    return
                }
            } catch {
                // Temporary network issue.
                // Keep polling until the maximum number of attempts is reached.
            }

            if (attempts >= maxAttempts) {
                window.clearInterval(interval)
                setStatus('failed')
            }
        }, 2000)

        return () => window.clearInterval(interval)
    }, [token, locale])

    return (
        <main className="thankyou-page booking-pending-page">
            <div className="thankyou-orbit" aria-hidden="true">
                <span className="thankyou-orbit-dot" />
                <span className="thankyou-orbit-dot" />
                <span className="thankyou-orbit-dot" />
            </div>

            <div className="thankyou-aura" aria-hidden="true" />

            <section className="thankyou-content booking-pending-panel">
                <div className="thankyou-symbol" aria-hidden="true">
                    ✦
                </div>

                <div className="thankyou-label">
                    <span />
                    {t('label')}
                    <span />
                </div>

                {status === 'waiting' && (
                    <>
                        <h1 className="thankyou-title">
                            {t('confirmingMain')}
                            <br />
                            {t('confirmingGold')}
                        </h1>

                        <div className="thankyou-divider" />

                        <p className="thankyou-text">{t('waitText')}</p>
                        <p className="thankyou-subtext">{t('waitSubtext')}</p>

                        <div className="booking-pending-loader" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </div>
                    </>
                )}

                {status === 'already_used' && (
                    <>
                        <h1 className="thankyou-title">
                            {t('usedMain')}
                            <br />
                            {t('usedGold')}
                        </h1>

                        <div className="thankyou-divider" />

                        <p className="thankyou-text">{t('usedText')}</p>
                        <p className="thankyou-subtext">{t('usedSubtext')}</p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <h1 className="thankyou-title">
                            {t('failedMain')}
                            <br />
                            {t('failedGold')}
                        </h1>

                        <div className="thankyou-divider" />

                        <p className="thankyou-text">{t('failedText')}</p>
                        <p className="thankyou-subtext">{t('failedSubtext')}</p>
                    </>
                )}
            </section>
        </main>
    )
}

export default function BookingPendingPage() {
    return (
        <Suspense fallback={null}>
            <BookingPendingInner />
        </Suspense>
    )
}