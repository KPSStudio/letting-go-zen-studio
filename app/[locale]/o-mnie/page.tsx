// app/[locale]/o-mnie/page.tsx
// This page shows Joanna's About page.
// All visible text comes from messages/pl.json and messages/en.json
// so the PL/EN button can translate the page properly.

import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

type OMniePageProps = {
    params: Promise<{
        locale: string
    }>
}

export default async function OMniePage({ params }: OMniePageProps) {
    const { locale } = await params

    // Loads the "aboutPage" translation section from the active language file.
    const t = await getTranslations('aboutPage')

    // These arrays come from the translation JSON files.
    // We cast them as string[] so TypeScript knows they are lists of text.
    const bioParagraphs = t.raw('bioParagraphs') as string[]
    const supportItems = t.raw('supportItems') as string[]
    const closingParagraphs = t.raw('closingParagraphs') as string[]

    return (
        <main className="premium-content-page premium-content-pageAbout">
            <section className="premium-content-hero">
                <p className="premium-content-eyebrow">
                    <span className="premium-content-eyebrowLine" aria-hidden="true" />
                    {t('label')}
                </p>

                <h1 className="premium-content-title">
                    {t('heroTitle')}{' '}
                    <span className="premium-content-titleGold">
                        {t('heroTitleGold')}
                    </span>
                </h1>
            </section>

            <section className="premium-content-photoStage about-photo-card">
                <div className="about-photo-aura" />
                <div className="about-photo-orbit" />

                <div className="about-photo-image-wrap">
                    <Image
                        src="/images/Joanna-photo.png"
                        alt={t('photoName')}
                        width={840}
                        height={1040}
                        priority
                        className="about-photo-image"
                    />
                </div>

                <div className="about-photo-name-box">
                    <p className="about-photo-caption">
                        {t('photoName')}
                    </p>
                </div>
            </section>

            <section className="premium-content-card premium-content-textStack">
                {bioParagraphs.map((paragraph) => (
                    <p key={paragraph} className="premium-content-text">
                        {paragraph}
                    </p>
                ))}
            </section>

            <section className="premium-content-card">
                <p className="premium-content-cardLabel">
                    <span className="premium-content-divider" aria-hidden="true" />
                    {t('supportTitle')}
                </p>

                <div className="premium-content-list">
                    {supportItems.map((item) => (
                        <p key={item} className="premium-content-listItem">
                            {item}
                        </p>
                    ))}
                </div>
            </section>

            <section className="premium-content-card premium-content-textStack">
                <p className="premium-content-text">
                    {t('methodParagraph')}
                </p>
            </section>

            <section className="premium-content-card premium-content-cta">
                <p className="premium-content-cardLabel">
                    <span className="premium-content-divider" aria-hidden="true" />
                    {t('alchemikTitle')}
                </p>

                <p className="premium-content-text">
                    {t('alchemikDescription')}
                </p>

                <div className="premium-content-offerList">
                    <p className="premium-content-offerItem">
                        {t('alchemikSession')}
                    </p>

                    <p className="premium-content-offerItem">
                        {t('alchemikPackage')}
                    </p>
                </div>

                <Link
                    href={`/${locale}/zgoda-rezerwacja?service=umysl-alchemik-sesja-1-1&serviceName=Alchemik%20%E2%80%94%20Sesja%201%3A1&price=30&locale=${locale}`}
                    className="premium-content-ctaButton"
                >
                    {t('alchemikButton')}
                </Link>
            </section>

            <section className="premium-content-card premium-content-textStack">
                {closingParagraphs.map((paragraph) => (
                    <p key={paragraph} className="premium-content-text">
                        {paragraph}
                    </p>
                ))}

                <p className="premium-content-signature">
                    {t('signature')}
                </p>
            </section>
        </main>
    )
}