// app/[locale]/o-mnie/page.tsx
// This page shows Joanna's About page.
// All visible text comes from messages/pl.json and messages/en.json
// so the PL/EN button can translate the page properly.

import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getServicesByCategory } from '@/sanity/lib/sanity'
import { getCalSlug } from '@/lib/calcom'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

type OMniePageProps = {
    params: Promise<{
        locale: string
    }>
}

export default async function OMniePage({ params }: OMniePageProps) {
    const { locale } = await params

    // Loads the "aboutPage" translation section from the active language file.
    const t = await getTranslations('aboutPage')

    // ── The Alchemik call to action ──
    // This link used to hard-code the slug, the display name AND the price
    // (`?service=umysl-alchemik-sesja-1-1&serviceName=Alchemik…&price=30`).
    // That made the About page a second, silent source of truth: renaming or
    // repricing the service in Sanity left this button pointing at a name the
    // consent route would reject. Sanity is the catalogue, so the CTA is built
    // from Sanity — and if the service is not there, we send people to the
    // Umysł page rather than to a link that cannot work.
    let alchemikHref = `/${locale}/mind`

    try {
        const mindServices = await getServicesByCategory('mind')
        const alchemik = mindServices.find(
            (service) =>
                service.requiresBooking &&
                service.namePl.toLowerCase().includes('alchemik')
        )

        if (alchemik) {
            const slug = alchemik.calComSlug ?? getCalSlug(alchemik.namePl) ?? ''
            if (slug) {
                alchemikHref =
                    `/${locale}/zgoda-rezerwacja` +
                    `?service=${encodeURIComponent(slug)}` +
                    `&serviceName=${encodeURIComponent(alchemik.namePl)}`
            }
        }
    } catch {
        // A Sanity hiccup must not take the About page down; the Umysł-page
        // fallback above still gets the visitor to the right place.
    }

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
                    href={alchemikHref}
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
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "/o-mnie",
        pl: {
            title: "O mnie — Joanna Witkowska | Letting Go Zen Studio",
            description: "Poznaj Joannę Witkowską, założycielkę Letting Go Zen Studio w Aberdeen — jak pracuje, komu towarzyszy i z jakich metod korzysta.",
        },
        en: {
            title: "About — Joanna Witkowska | Letting Go Zen Studio",
            description: "Meet Joanna Witkowska, founder of Letting Go Zen Studio in Aberdeen — how she works, who she supports, and the methods she uses.",
        },
    })
}
