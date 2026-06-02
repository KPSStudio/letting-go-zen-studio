// app/[locale]/polityka-prywatnosci/page.tsx
// Temporary privacy policy page.
// All visible text comes from next-intl translation files.
// This is a placeholder and must be checked by a lawyer before launch.

import { getTranslations } from 'next-intl/server'

type LegalSection = {
    title: string
    content: string
}

export default async function PolitykaPrywatnosciPage() {
    const t = await getTranslations('legal.privacy')

    const sections: LegalSection[] = [
        {
            title: t('sections.dataController.title'),
            content: t('sections.dataController.content'),
        },
        {
            title: t('sections.gdprArticle13.title'),
            content: t('sections.gdprArticle13.content'),
        },
        {
            title: t('sections.clientRights.title'),
            content: t('sections.clientRights.content'),
        },
    ]

    return (
        <main className="legal-page">
            <p className="legal-label">
                <span className="legal-label-line" />
                {t('label')}
            </p>

            <header className="legal-header">
                <h1 className="legal-title">
                    {t('titleStart')} <span>{t('titleGold')}</span>
                </h1>

                <p className="legal-intro">
                    {t('intro')}
                </p>
            </header>

            <div className="legal-warning">
                <span className="legal-warning-icon">⚠️</span>

                <p className="legal-warning-text">
                    {t('warning')}
                </p>
            </div>

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