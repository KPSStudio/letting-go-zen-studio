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
        <main className="mx-auto max-w-[900px] px-8 pb-24 pt-12">

            {/* Page label */}
            <p className="mb-4 flex items-center gap-3 font-cinzel text-[0.7rem] tracking-[0.3em] text-[var(--gold)]">
                <span className="inline-block h-px w-8 bg-[var(--gold)]" />
                {t('label')}
            </p>

            {/* Page hero */}
            <section className="mb-16">
                <h1 className="font-cinzel text-[clamp(2.5rem,6vw,5rem)] leading-[1.1] text-[var(--cream)]">
                    {t('heroTitle')}{' '}
                    <span className="text-[var(--gold-lt)]">
                        {t('heroTitleGold')}
                    </span>
                </h1>
            </section>

            {/* Joanna photo */}
            <section className="about-photo-card">
                <div className="about-photo-aura" />
                <div className="about-photo-orbit" />

                <div className="about-photo-image-wrap">
                    <Image
                        src="/images/Joanna-photo.png"
                        alt={t('photoAlt')}
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

            {/* Main bio text */}
            <section className="mb-12">
                {bioParagraphs.map((paragraph) => (
                    <p
                        key={paragraph}
                        className="mb-6 font-montserrat text-[0.95rem] leading-[1.9] text-[var(--cream)] opacity-90"
                    >
                        {paragraph}
                    </p>
                ))}
            </section>

            {/* Support section */}
            <section className="mb-12">
                <p className="mb-6 flex items-center gap-3 font-cinzel text-[0.7rem] tracking-[0.3em] text-[var(--gold)]">
                    <span className="inline-block h-px w-8 bg-[var(--gold)]" />
                    {t('supportTitle')}
                </p>

                {supportItems.map((item) => (
                    <p
                        key={item}
                        className="mb-3 border-l-2 border-[rgba(184,148,42,0.3)] pl-6 font-montserrat text-[0.95rem] leading-[1.8] text-[var(--cream)] opacity-90"
                    >
                        ✦ {item}
                    </p>
                ))}
            </section>

            {/* Closing paragraph before Alchemik card */}
            <p className="mb-12 font-montserrat text-[0.95rem] leading-[1.9] text-[var(--cream)] opacity-90">
                {t('methodParagraph')}
            </p>

            {/* Alchemik card */}
            <section className="mb-12 border border-[rgba(184,148,42,0.2)] bg-black/25 p-10">
                <p className="mb-4 flex items-center gap-3 font-cinzel text-[0.7rem] tracking-[0.3em] text-[var(--gold)]">
                    <span className="inline-block h-px w-8 bg-[var(--gold)]" />
                    {t('alchemikTitle')}
                </p>

                <p className="mb-6 font-montserrat text-[0.95rem] leading-[1.8] text-[var(--cream)] opacity-90">
                    {t('alchemikDescription')}
                </p>

                <div className="mb-6 flex flex-wrap gap-8">
                    <p className="font-montserrat text-[0.9rem] text-[var(--gold-lt)]">
                        ✦ {t('alchemikSession')}
                    </p>

                    <p className="font-montserrat text-[0.9rem] text-[var(--gold-lt)]">
                        ✦ {t('alchemikPackage')}
                    </p>
                </div>

                <Link
                    href={`/${locale}/zgoda-rezerwacja?service=umysl-alchemik-sesja-1-1&serviceName=Alchemik%20%E2%80%94%20Sesja%201%3A1&price=30&locale=${locale}`}
                    className="inline-block bg-gradient-to-br from-[#D4AF6A] to-[#8A6A1A] px-10 py-4 font-cinzel text-[0.75rem] tracking-[0.25em] text-[#3D0845] no-underline transition-opacity hover:opacity-80"
                >
                    {t('alchemikButton')}
                </Link>
            </section>

            {/* Final closing words */}
            <section className="mb-8">
                {closingParagraphs.map((paragraph) => (
                    <p
                        key={paragraph}
                        className="mb-4 font-montserrat text-[0.95rem] leading-[1.9] text-[var(--cream)] opacity-90"
                    >
                        {paragraph}
                    </p>
                ))}

                <p className="font-cinzel text-[0.9rem] tracking-[0.1em] text-[var(--gold-lt)]">
                    {t('signature')}
                </p>
            </section>

        </main>
    )
}