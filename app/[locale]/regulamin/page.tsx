// app/[locale]/regulamin/page.tsx
// Temporary legal terms page.
// All visible text comes from next-intl translation files.
// This is a placeholder and must be checked by a lawyer before launch.

import { getTranslations } from 'next-intl/server'

type LegalSection = {
    title: string
    content: string
}

export default async function RegulaminPage() {
    const t = await getTranslations('legal.terms')

    const sections: LegalSection[] = [
        {
            title: t('sections.general.title'),
            content: t('sections.general.content'),
        },
        {
            title: t('sections.serviceNature.title'),
            content: t('sections.serviceNature.content'),
        },
        {
            title: t('sections.payments.title'),
            content: t('sections.payments.content'),
        },
        {
            title: t('sections.refunds.title'),
            content: t('sections.refunds.content'),
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
            </header>

            {/* Visible warning because this is not final legal copy */}
            <div className="legal-warning">
                <span className="legal-warning-icon">⚠️</span>

                <p className="legal-warning-text">
                    {t('warning')}
                </p>
            </div>

            {/* Legal sections */}
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