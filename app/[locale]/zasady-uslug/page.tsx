// app/[locale]/zasady-uslug/page.tsx
// Service terms page.
// This page explains the rules for sessions, bookings, cancellations, contraindications and responsibility.
// All visible text comes from next-intl translation files.

import { getTranslations } from 'next-intl/server'

type LegalSection = {
    title: string
    content: string
}

export default async function ZasadyUslugPage() {
    const t = await getTranslations('legal.serviceTerms')

    const sections: LegalSection[] = [
        {
            title: t('sections.provider.title'),
            content: t('sections.provider.content'),
        },
        {
            title: t('sections.scope.title'),
            content: t('sections.scope.content'),
        },
        {
            title: t('sections.nature.title'),
            content: t('sections.nature.content'),
        },
        {
            title: t('sections.booking.title'),
            content: t('sections.booking.content'),
        },
        {
            title: t('sections.cancellation.title'),
            content: t('sections.cancellation.content'),
        },
        {
            title: t('sections.contraindications.title'),
            content: t('sections.contraindications.content'),
        },
        {
            title: t('sections.liability.title'),
            content: t('sections.liability.content'),
        },
        {
            title: t('sections.copyright.title'),
            content: t('sections.copyright.content'),
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

            {/* Service terms sections */}
            <div className="legal-section-list">
                {sections.map((section) => (
                    <section key={section.title} className="legal-section-card">
                        <h2 className="legal-section-title">
                            {section.title}
                        </h2>

                        <p className="legal-section-text">
                            {section.content}
                        </p>
                    </section>
                ))}
            </div>
        </main>
    )
}