// app/[locale]/regulamin/page.tsx
// Online shop terms page.
// This page is only for digital products, online purchases and shop checkout rules.
// All visible text comes from next-intl translation files.

import { getTranslations } from 'next-intl/server'

type LegalSection = {
    title: string
    content: string
}

export default async function RegulaminPage() {
    const t = await getTranslations('legal.terms')

    const sections: LegalSection[] = [
        {
            title: t('sections.seller.title'),
            content: t('sections.seller.content'),
        },
        {
            title: t('sections.definitions.title'),
            content: t('sections.definitions.content'),
        },
        {
            title: t('sections.scope.title'),
            content: t('sections.scope.content'),
        },
        {
            title: t('sections.orders.title'),
            content: t('sections.orders.content'),
        },
        {
            title: t('sections.prices.title'),
            content: t('sections.prices.content'),
        },
        {
            title: t('sections.delivery.title'),
            content: t('sections.delivery.content'),
        },
        {
            title: t('sections.withdrawal.title'),
            content: t('sections.withdrawal.content'),
        },
        {
            title: t('sections.complaints.title'),
            content: t('sections.complaints.content'),
        },
        {
            title: t('sections.copyright.title'),
            content: t('sections.copyright.content'),
        },
        {
            title: t('sections.liability.title'),
            content: t('sections.liability.content'),
        },
        {
            title: t('sections.sessions.title'),
            content: t('sections.sessions.content'),
        },
        {
            title: t('sections.data.title'),
            content: t('sections.data.content'),
        },
        {
            title: t('sections.final.title'),
            content: t('sections.final.content'),
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

            {/* Online shop legal sections */}
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

            {/* Mandatory consent wording for PDF/course checkout */}
            <section className="legal-section-card legal-consent-card">
                <h2 className="legal-section-title">
                    {t('digitalConsent.title')}
                </h2>

                <div className="legal-checkbox-list">
                    <p className="legal-section-text">
                        ☐ {t('digitalConsent.terms')}
                    </p>

                    <p className="legal-section-text">
                        ☐ {t('digitalConsent.instantDelivery')}
                    </p>
                </div>
            </section>
        </main>
    )
}