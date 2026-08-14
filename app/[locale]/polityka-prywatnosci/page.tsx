// app/[locale]/polityka-prywatnosci/page.tsx
// Privacy policy page.
// This page explains how Letting Go Zen Studio processes personal data.
// All visible text comes from next-intl translation files.

import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

type LegalSection = {
    title: string
    content: string
    /** Optional detail lines rendered as a list under the section paragraph. */
    points?: string[]
    /** Optional closing paragraph, shown after the list. */
    footnote?: string
}

// Section keys in the order they appear on the page. Keeping the order in one
// array means adding or reordering a section is a one-line change here, and the
// messages files stay the single source of the wording.
//
// `hasPoints` / `hasFootnote` say which sections carry the extra blocks. They
// are read with t.raw() because next-intl returns arrays as-is only that way.
const SECTION_KEYS = [
    { key: 'controller', hasPoints: true, hasFootnote: false },
    { key: 'collectedData', hasPoints: true, hasFootnote: true },
    { key: 'specialCategoryData', hasPoints: false, hasFootnote: false },
    { key: 'legalBasis', hasPoints: true, hasFootnote: false },
    { key: 'retention', hasPoints: true, hasFootnote: true },
    { key: 'sharing', hasPoints: true, hasFootnote: true },
    { key: 'transfers', hasPoints: false, hasFootnote: false },
    { key: 'payments', hasPoints: false, hasFootnote: false },
    { key: 'security', hasPoints: true, hasFootnote: false },
    { key: 'rights', hasPoints: true, hasFootnote: true },
    { key: 'complaints', hasPoints: false, hasFootnote: false },
    { key: 'cookies', hasPoints: false, hasFootnote: false },
    { key: 'changes', hasPoints: false, hasFootnote: false },
] as const

export default async function PolitykaPrywatnosciPage() {
    const t = await getTranslations('legal.privacy')

    const sections: LegalSection[] = SECTION_KEYS.map(
        ({ key, hasPoints, hasFootnote }) => ({
            title: t(`sections.${key}.title`),
            content: t(`sections.${key}.content`),
            points: hasPoints
                ? (t.raw(`sections.${key}.points`) as string[])
                : undefined,
            footnote: hasFootnote ? t(`sections.${key}.footnote`) : undefined,
        })
    )

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

                        {/* Detail lines: named processors, retention periods,
                            legal bases — the specifics the ICO asks for. */}
                        {section.points && section.points.length > 0 && (
                            <ul className="legal-section-points">
                                {section.points.map((point) => (
                                    <li key={point}>{point}</li>
                                ))}
                            </ul>
                        )}

                        {section.footnote && (
                            <p className="legal-section-text legal-section-footnote">
                                {section.footnote}
                            </p>
                        )}
                    </section>
                ))}
            </div>
        </main>
    )
}
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "/polityka-prywatnosci",
        pl: {
            title: "Polityka prywatności | Letting Go Zen Studio",
            description: "Jak Letting Go Zen Studio przetwarza dane osobowe: jakie dane zbieramy, w jakim celu, jak długo je przechowujemy i jakie masz prawa.",
        },
        en: {
            title: "Privacy Policy | Letting Go Zen Studio",
            description: "How Letting Go Zen Studio handles personal data: what we collect, why, how long we keep it, and the rights you have over it.",
        },
    })
}
