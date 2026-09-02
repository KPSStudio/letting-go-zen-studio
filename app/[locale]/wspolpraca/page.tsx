// app/[locale]/wspolpraca/page.tsx
//
// Współpraca page — explains how working together and booking actually work,
// then points at the service chooser. All visible text comes from next-intl.
//
// Composition: a split hero (copy + gold lotus), the five-step booking journey,
// an open studio/story band, and TWO bordered callouts — the important
// information and the booking CTA. Those two callouts are the only complete
// borders on the page; everything else sits open on the plum texture.
//
// Page-specific `wsp-*` classes are used instead of the generic
// `premium-content-*` ones, so restyling this page cannot reach the legal
// pages, About or Contact, which still rely on those shared classes.

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import MedicalDisclaimer from '@/components/common/MedicalDisclaimer'
import JourneyStages from '@/components/wspolpraca/JourneyStages'
import BotanicalOrnament from '@/components/common/BotanicalOrnament'
import BackControl from '@/components/common/BackControl'
import { ShieldIcon, BookingIcon } from '@/components/home/PillarIcons'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export default function WspolpracaPage() {
    const locale = useLocale()
    const t = useTranslations('wspolpraca')
    const tBack = useTranslations('body')

    return (
        <main className="wsp-page">
            {/* Shared floating glyph, as on the category pages. */}
            <BackControl
                href={`/${locale}`}
                label={tBack('back')}
                ariaLabel={tBack('backAria')}
            />

            {/* ── Split hero: copy left, lotus right ── */}
            <section className="wsp-hero">
                <div className="wsp-hero-copy">
                    <p className="wsp-eyebrow">
                        <span className="wsp-eyebrow-line" aria-hidden="true" />
                        {t('label')}
                    </p>

                    <h1 className="wsp-title">
                        {t('titleStart')}{' '}
                        <span className="wsp-title-gold">{t('titleGold')}</span>
                    </h1>

                    <span className="wsp-rule" aria-hidden="true">
                        <span className="wsp-rule-diamond" />
                    </span>

                    <p className="wsp-intro">{t('intro')}</p>
                </div>

                {/* A lotus lamp floating on dark water. Purely atmospheric —
                    alt="" — and deliberately symbolic: it depicts nothing about
                    the studio, so it cannot be read as documentary. The width
                    and height below fix the aspect ratio before the file loads,
                    so the hero never shifts as it arrives. */}
                <div className="wsp-hero-art" aria-hidden="true">
                    <Image
                        src="/images/wspolpraca-emblem.webp"
                        alt=""
                        width={1200}
                        height={1800}
                        sizes="(max-width: 900px) 88vw, (max-width: 1200px) 42vw, 500px"
                        priority
                        className="wsp-hero-image"
                    />

                    {/* Plum wash + edge vignette, so the photograph reads as
                        part of the page rather than a pasted rectangle. */}
                    <span className="wsp-hero-wash" />
                    <span className="wsp-hero-vignette" />
                </div>
            </section>

            {/* ── The five real booking steps ── */}
            <JourneyStages />

            {/* ── Studio / story ──
                The imagery here is deliberately a sacred-geometry ornament
                rather than a room photograph: the project holds no photograph
                of Joanna's studio, and dressing a stock interior as hers would
                misrepresent the business. The copy is Joanna's own. */}
            <section className="wsp-studio" aria-labelledby="wsp-studio-title">
                <div className="wsp-studio-art" aria-hidden="true">
                    <span className="wsp-studio-glow" />
                    <BotanicalOrnament className="wsp-studio-ornament" />
                </div>

                <div className="wsp-studio-copy">
                    <h2 id="wsp-studio-title" className="wsp-studio-title">
                        {t('studioLabel')}
                    </h2>

                    <span className="wsp-rule" aria-hidden="true">
                        <span className="wsp-rule-diamond" />
                    </span>

                    <p className="wsp-studio-text">{t('studioText')}</p>
                </div>
            </section>

            {/* ── The two bordered callouts ── */}
            <div className="wsp-callouts">
                <section className="wsp-callout" aria-labelledby="wsp-info-title">
                    <p className="wsp-callout-head">
                        <span className="wsp-callout-icon" aria-hidden="true">
                            <ShieldIcon />
                        </span>
                        <span id="wsp-info-title" className="wsp-callout-title">
                            {t('importantLabel')}
                        </span>
                    </p>

                    {/* The shared component, not a re-worded copy of it, so the
                        limitation is phrased identically everywhere. */}
                    <MedicalDisclaimer />

                    <p className="wsp-callout-text">{t('importantTextOne')}</p>

                    <p className="wsp-callout-text wsp-callout-note">
                        {t('importantTextTwo')}
                    </p>
                </section>

                <section className="wsp-callout" aria-labelledby="wsp-booking-title">
                    <p className="wsp-callout-head">
                        <span className="wsp-callout-icon" aria-hidden="true">
                            <BookingIcon />
                        </span>
                        <span id="wsp-booking-title" className="wsp-callout-title">
                            {t('bookingLabel')}
                        </span>
                    </p>

                    <p className="wsp-callout-text">{t('bookingText')}</p>

                    {/* Straight to the service chooser on the homepage. The CTA
                        used to point at /kontakt, which implied a visitor had to
                        message Joanna before booking — they do not. */}
                    <Link href={`/${locale}#services`} className="wsp-cta">
                        {t('bookingButton')}
                        <span className="wsp-cta-arrow" aria-hidden="true">
                            &rarr;
                        </span>
                    </Link>
                </section>
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
        path: '/wspolpraca',
        pl: {
            title: 'Jak pracuję — współpraca i protokół | Letting Go Zen Studio',
            description:
                'Jak wygląda współpraca z Letting Go Zen Studio: przebieg sesji, ważne informacje i zasady. Przeczytaj, zanim zarezerwujesz termin.',
        },
        en: {
            title: 'How I Work — Approach and Protocol | Letting Go Zen Studio',
            description:
                'What working with Letting Go Zen Studio looks like: how a session runs, important information, and the ground rules. Read this before booking.',
        },
    })
}
