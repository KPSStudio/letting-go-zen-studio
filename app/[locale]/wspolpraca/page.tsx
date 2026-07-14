// app/[locale]/wspolpraca/page.tsx
// Współpraca page — explains Joanna's studio protocol and shows a booking placeholder.
// All visible text comes from next-intl translation files.

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

export default function WspolpracaPage() {
    const locale = useLocale()
    const t = useTranslations('wspolpraca')

    return (
        <main className="premium-content-page premium-content-pageProtocol">
            <section className="premium-content-hero">
                <p className="premium-content-eyebrow">
                    <span className="premium-content-eyebrowLine" aria-hidden="true" />
                    {t('label')}
                </p>

                <h1 className="premium-content-title">
                    {t('titleStart')}{' '}
                    <span className="premium-content-titleGold">
                        {t('titleGold')}
                    </span>
                </h1>

                <p className="premium-content-intro">
                    {t('intro')}
                </p>
            </section>

            <section className="premium-content-card">
                <p className="premium-content-cardLabel">
                    <span className="premium-content-divider" aria-hidden="true" />
                    {t('studioLabel')}
                </p>

                <p className="premium-content-text">
                    {t('studioText')}
                </p>
            </section>

            <section className="premium-content-card premium-content-cardLargeGap premium-content-textStack">
                <p className="premium-content-cardLabel">
                    <span className="premium-content-divider" aria-hidden="true" />
                    {t('importantLabel')}
                </p>

                <p className="premium-content-text">
                    {t('importantTextOne')}
                </p>

                <p className="premium-content-text">
                    {t('importantTextTwo')}
                </p>
            </section>

            <section className="premium-content-card premium-content-cta premium-content-ctaCentered">
                <p className="premium-content-ctaLabel">
                    {t('bookingLabel')}
                </p>

                <p className="premium-content-ctaText">
                    {t('bookingText')}
                </p>

                <Link href={`/${locale}/kontakt`} className="premium-content-ctaButton">
                    {t('bookingButton')}
                </Link>
            </section>
        </main>
    )
}