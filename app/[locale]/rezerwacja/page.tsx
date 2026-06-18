// app/[locale]/rezerwacja/page.tsx
// Cal.com booking calendar — protected and translated.
// The calendar only renders when the booking token is payment_confirmed.
// All visible text flows through next-intl.

'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Cal, { getCalApi } from '@calcom/embed-react'

const CAL_USERNAME = 'lettinggozenstudio'

type GateStatus = 'checking' | 'allowed' | 'blocked'

type VerifyBookingTokenResponse = {
    valid?: boolean
}

function BookingEmbed() {
    const searchParams = useSearchParams()
    const locale = useLocale()
    const t = useTranslations('bookingPage')

    const service = searchParams.get('service') ?? ''
    const token = searchParams.get('token') ?? ''

    const [gate, setGate] = useState<GateStatus>('checking')
    const calLink = `${CAL_USERNAME}/${service}`

    useEffect(() => {
        if (!token || !service) {
            setGate('blocked')
            return
        }

        fetch('/api/verify-booking-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        })
            .then(response => response.json())
            .then((data: VerifyBookingTokenResponse) => {
                setGate(data.valid === true ? 'allowed' : 'blocked')
            })
            .catch(() => setGate('blocked'))
    }, [token, service])

    useEffect(() => {
        if (gate !== 'allowed') return

        getCalApi().then(cal => {
            cal('ui', {
                theme: 'dark',
                styles: {
                    branding: {
                        brandColor: '#D4AF6A',
                    },
                },
                hideEventTypeDetails: false,
            })

            cal('on', {
                action: 'bookingSuccessful',
                callback: () => {
                    fetch('/api/consume-booking-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ token }),
                    }).finally(() => {
                        window.location.href = `/${locale}/koszyk?bookingComplete=true`
                    })
                },
            })
        })
    }, [gate, token, locale])

    if (gate === 'checking') {
        return (
            <div className="booking-state booking-state-checking">
                {t('verifying')}
            </div>
        )
    }

    if (gate === 'blocked') {
        return (
            <div className="booking-state booking-state-blocked">
                <p className="booking-blocked-title">
                    {t('blockedTitle')}
                </p>

                <p className="booking-blocked-text">
                    {t('blockedText')}
                </p>

                <div className="booking-blocked-actions">
                    <Link href={`/${locale}/body`} className="cart-primary-link">
                        {t('bodyButton')}
                    </Link>

                    <Link href={`/${locale}/mind`} className="cart-primary-link">
                        {t('mindButton')}
                    </Link>

                    <Link href={`/${locale}/soul`} className="cart-primary-link">
                        {t('soulButton')}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <Cal
            calLink={calLink}
            className="booking-cal-embed"
            config={{ layout: 'month_view' }}
        />
    )
}

function RezerwacjaContent() {
    const t = useTranslations('bookingPage')

    return (
        <main className="body-page">
            <p className="shop-label">
                <span />
                {t('label')}
            </p>

            <section className="body-header">
                <h1 className="body-title">
                    {t('titleMain')} <span>{t('titleGold')}</span>
                </h1>

                <p className="body-intro">
                    {t('intro')}
                </p>
            </section>

            <section className="booking-panel">
                <Suspense
                    fallback={
                        <div className="booking-state booking-state-checking">
                            {t('loadingCalendar')}
                        </div>
                    }
                >
                    <BookingEmbed />
                </Suspense>
            </section>
        </main>
    )
}

export default function RezerwacjaPage() {
    return <RezerwacjaContent />
}