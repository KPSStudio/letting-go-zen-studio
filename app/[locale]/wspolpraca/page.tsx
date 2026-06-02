// app/[locale]/wspolpraca/page.tsx
// Współpraca page — explains Joanna's studio protocol and shows a booking placeholder.
// All visible text comes from next-intl translation files.

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function WspolpracaPage() {
    const t = useTranslations('wspolpraca')

    return (
        <main className="protocol-page">
            <p className="protocol-label">
                <span />
                {t('label')}
            </p>

            <section className="protocol-header">
                <h1 className="protocol-title">
                    {t('titleStart')} <span>{t('titleGold')}</span>
                </h1>

                <p className="protocol-intro">
                    {t('intro')}
                </p>
            </section>

            <section className="protocol-card">
                <p className="protocol-card-label">
                    <span />
                    {t('studioLabel')}
                </p>

                <p className="protocol-text">
                    {t('studioText')}
                </p>
            </section>

            <section className="protocol-card protocol-card-large-gap">
                <p className="protocol-card-label">
                    <span />
                    {t('importantLabel')}
                </p>

                <p className="protocol-text protocol-text-gap">
                    {t('importantTextOne')}
                </p>

                <p className="protocol-text">
                    {t('importantTextTwo')}
                </p>
            </section>

            <section className="protocol-booking-box">
                <p className="protocol-booking-label">
                    {t('bookingLabel')}
                </p>

                <p className="protocol-booking-text">
                    {t('bookingText')}
                </p>

                <Link href="/kontakt" className="protocol-booking-button">
                    {t('bookingButton')}
                </Link>
            </section>
        </main>
    )
}