// app/[locale]/rezerwacja/page.tsx
// Booking page — embeds Cal.com calendar
// Service slug passed via URL query param e.g. /rezerwacja?service=cialo-biorezonans-sesja-1-1

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Cal, { getCalApi } from '@calcom/embed-react'
import { useEffect } from 'react'

const CAL_USERNAME = 'lettinggozenstudio'

// Default event if none specified
const DEFAULT_EVENT = 'cialo-biorezonans-sesja-1-1'

function BookingEmbed() {
    const searchParams = useSearchParams()
    const service = searchParams.get('service') ?? DEFAULT_EVENT
    const serviceName = searchParams.get('serviceName') ?? ''
    const price = searchParams.get('price') ?? ''
    const locale = searchParams.get('locale') ?? 'pl'
    const calLink = `${CAL_USERNAME}/${service}`

    useEffect(() => {
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

            // After booking confirmed, redirect to koszyk with service pre-added
            cal('on', {
                action: 'bookingSuccessful',
                callback: () => {
                    const params = new URLSearchParams({
                        booked: 'true',
                        service: serviceName || service,
                        price,
                    })
                    window.location.href = `/${locale}/koszyk?${params.toString()}`
                },
            })
        })
    }, [service, serviceName, price, locale])

    return (
        <Cal
            calLink={calLink}
            style={{ width: '100%', height: '100%', overflow: 'scroll' }}
            config={{ layout: 'month_view' }}
        />
    )
}

export default function RezerwacjaPage() {
    return (
        <main style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '3rem 2rem 6rem',
        }}>

            {/* Page label */}
            <p style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.7rem',
                letterSpacing: '0.3em',
                color: 'var(--gold)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
            }}>
        <span style={{
            display: 'inline-block',
            width: '2rem',
            height: '1px',
            background: 'var(--gold)',
        }} />
                REZERWACJA
            </p>

            {/* Page hero */}
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: 'clamp(2rem, 5vw, 4rem)',
                    color: 'var(--cream)',
                    marginBottom: '1rem',
                    lineHeight: 1.1,
                }}>
                    Zarezerwuj <span style={{ color: 'var(--gold-lt)' }}>Sesję</span>
                </h1>
                <p style={{
                    fontFamily: 'var(--font-raleway)',
                    fontSize: '1rem',
                    color: 'var(--cream)',
                    opacity: 0.8,
                }}>
                    Wybierz dogodny termin. Otrzymasz potwierdzenie na email.
                </p>
            </div>

            {/* Cal.com embed */}
            <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(184,148,42,0.15)',
                minHeight: '600px',
                overflow: 'hidden',
            }}>
                <Suspense fallback={
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '600px',
                        fontFamily: 'var(--font-cinzel)',
                        fontSize: '0.85rem',
                        letterSpacing: '0.2em',
                        color: 'rgba(245,237,216,0.4)',
                    }}>
                        Ładowanie kalendarza...
                    </div>
                }>
                    <BookingEmbed />
                </Suspense>
            </div>

        </main>
    )
}