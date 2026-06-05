// app/[locale]/polityka-prywatnosci/page.tsx
// Privacy policy page.
// This page explains how Letting Go Zen Studio processes personal data.
// All visible text comes from next-intl translation files.

import { getTranslations } from 'next-intl/server'

type LegalSection = {
    title: string
    content: string
}

export default async function PolitykaPrywatnosciPage() {
    const t = await getTranslations('legal.privacy')

    const sections: LegalSection[] = [
        {
            title: t('sections.controller.title'),
            content: t('sections.controller.content'),
        },
        {
            title: t('sections.collectedData.title'),
            content: t('sections.collectedData.content'),
        },
        {
            title: t('sections.specialCategoryData.title'),
            content: t('sections.specialCategoryData.content'),
        },
        {
            title: t('sections.purposes.title'),
            content: t('sections.purposes.content'),
        },
        {
            title: t('sections.legalBasis.title'),
            content: t('sections.legalBasis.content'),
        },
        {
            title: t('sections.retention.title'),
            content: t('sections.retention.content'),
        },
        {
            title: t('sections.sharing.title'),
            content: t('sections.sharing.content'),
        },
        {
            title: t('sections.rights.title'),
            content: t('sections.rights.content'),
        },
        {
            title: t('sections.cookies.title'),
            content: t('sections.cookies.content'),
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

            {/* Privacy policy sections */}
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