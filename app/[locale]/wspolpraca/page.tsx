// app/[locale]/wspolpraca/page.tsx
// Współpraca page — explains Joanna's studio protocol and points visitors at
// the booking flow. All visible text comes from next-intl translation files.

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import MedicalDisclaimer from '@/components/common/MedicalDisclaimer'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

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

                {/* The same wording used on Ciało / Umysł / Dusza, from the
                    shared `disclaimer` key — so the limitation is phrased
                    identically everywhere it appears. */}
                <MedicalDisclaimer />

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
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "/wspolpraca",
        pl: {
            title: "Jak pracuję — współpraca i protokół | Letting Go Zen Studio",
            description: "Jak wygląda współpraca z Letting Go Zen Studio: przebieg sesji, ważne informacje i zasady. Przeczytaj, zanim zarezerwujesz termin.",
        },
        en: {
            title: "How I Work — Approach and Protocol | Letting Go Zen Studio",
            description: "What working with Letting Go Zen Studio looks like: how a session runs, important information, and the ground rules. Read this before booking.",
        },
    })
}
