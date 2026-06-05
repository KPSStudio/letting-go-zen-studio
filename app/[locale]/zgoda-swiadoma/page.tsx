// app/[locale]/zgoda-swiadoma/page.tsx
// Conscious consent page.
// This page explains what the client confirms before starting a session.
// All visible text comes from next-intl translation files.

import { getTranslations } from 'next-intl/server'

type ConsentPoint = {
    text: string
}

export default async function ZgodaSwiadomaPage() {
    const t = await getTranslations('legal.consent')

    const points: ConsentPoint[] = [
        {
            text: t('points.voluntary'),
        },
        {
            text: t('points.nature'),
        },
        {
            text: t('points.notMedical'),
        },
        {
            text: t('points.truthfulHealth'),
        },
        {
            text: t('points.stopAnytime'),
        },
        {
            text: t('points.dataProcessing'),
        },
    ]

    return (
        <main className="legal-page">
            {/* Small label above the page title */}
            <p className="legal-label">
                <span className="legal-label-line" />
                {t('label')}
            </p>

            {/* Main page heading */}
            <header className="legal-header">
                <h1 className="legal-title">
                    {t('titleStart')} <span>{t('titleGold')}</span>
                </h1>

                <p className="legal-intro">
                    {t('intro')}
                </p>

                <p className="legal-effective-date">
                    {t('effectiveDate')}
                </p>
            </header>

            {/* Consent points */}
            <section className="legal-section-card">
                <h2 className="legal-section-title">
                    {t('confirmationTitle')}
                </h2>

                <div className="legal-checkbox-list">
                    {points.map((point) => (
                        <p key={point.text} className="legal-section-text">
                            ☐ {point.text}
                        </p>
                    ))}
                </div>
            </section>

            {/* Signature fields for in-person use */}
            <section className="legal-section-card legal-consent-card">
                <h2 className="legal-section-title">
                    {t('signatureTitle')}
                </h2>

                <div className="legal-checkbox-list">
                    <p className="legal-section-text">
                        {t('fields.fullName')}
                    </p>

                    <p className="legal-section-text">
                        {t('fields.date')}
                    </p>

                    <p className="legal-section-text">
                        {t('fields.signature')}
                    </p>
                </div>
            </section>

            {/* Short disclaimer recommended for service pages */}
            <section className="legal-section-card legal-consent-card">
                <h2 className="legal-section-title">
                    {t('serviceDisclaimerTitle')}
                </h2>

                <p className="legal-section-text">
                    {t('serviceDisclaimer')}
                </p>
            </section>
        </main>
    )
}