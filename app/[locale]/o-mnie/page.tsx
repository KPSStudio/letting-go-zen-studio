// app/[locale]/o-mnie/page.tsx
//
// Joanna's About page. All visible text comes from messages/pl.json and
// messages/en.json, so the PL/EN switch translates the whole page.
//
// Composition (following the supplied reference):
//   split portrait introduction → centred quotation → two-column story →
//   nature interlude → five-part support section → one framed Alchemik offer →
//   centred closing and signature.
//
// Only ONE element on this page carries a complete border: the Alchemik offer.
// Everything else is separated by space, type and hairline rules, so the plum
// texture stays visually continuous from the header to the footer.

import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getServicesByCategory, type SanityService } from '@/sanity/lib/sanity'
import { getCalSlug } from '@/lib/calcom'
import BotanicalOrnament from '@/components/common/BotanicalOrnament'
import SupportGrid from '@/components/about/SupportGrid'
import { IntegrationIcon, SoulIcon, QuillIcon } from '@/components/home/PillarIcons'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

type OMniePageProps = {
    params: Promise<{ locale: string }>
}

/**
 * One Alchemik offer column. The parts are kept separate rather than joined
 * into a sentence so the price can be set large and the duration small, the
 * way the reference lays them out — and so a missing duration simply omits a
 * line instead of leaving a stray separator.
 */
type AlchemikOffer = {
    name: string
    duration?: string
    price: string
    href: string
}

export default async function OMniePage({ params }: OMniePageProps) {
    const { locale } = await params
    const t = await getTranslations('aboutPage')

    // ── The Alchemik offer ──
    //
    // Sanity is the catalogue, so BOTH the booking links and the displayed
    // duration/price are read from it. The translation files used to carry
    // "1 sesja · 30 min · £30", which made them a second, silent price source:
    // repricing in Studio left the About page advertising a stale figure.
    //
    // If Sanity is unavailable we fall back to the Umysł page and show the
    // offers with NO price at all rather than inventing one.
    let alchemikHref = `/${locale}/mind`
    let alchemikOffers: AlchemikOffer[] = []

    const buildBookingHref = (service: SanityService) => {
        const slug = service.calComSlug ?? getCalSlug(service.namePl) ?? ''
        if (!slug) return `/${locale}/mind`

        return (
            `/${locale}/zgoda-rezerwacja` +
            `?service=${encodeURIComponent(slug)}` +
            `&serviceName=${encodeURIComponent(service.namePl)}`
        )
    }

    // Each part stays separate so the layout can size them independently.
    // Every value here comes from Sanity; nothing is derived from translations.
    const buildOffer = (service: SanityService): Omit<AlchemikOffer, 'href'> => ({
        name: locale === 'en' && service.nameEn ? service.nameEn : service.namePl,
        duration: service.duration,
        price: `£${service.priceGBP}`,
    })

    try {
        const mindServices = await getServicesByCategory('mind')
        const alchemikServices = mindServices.filter(
            (service) =>
                service.requiresBooking &&
                service.namePl.toLowerCase().includes('alchemik'),
        )

        if (alchemikServices.length > 0) {
            alchemikHref = buildBookingHref(alchemikServices[0])
            alchemikOffers = alchemikServices.map((service) => ({
                ...buildOffer(service),
                href: buildBookingHref(service),
            }))
        }
    } catch {
        // A Sanity hiccup must not take the About page down. The Umysł-page
        // fallback stands, and no price is shown.
    }

    const journeyParagraphs = t.raw('journeyParagraphs') as string[]
    const studioParagraphs = t.raw('studioParagraphs') as string[]
    const closingParagraphs = t.raw('closingParagraphs') as string[]

    return (
        <main className="about-page">
            {/* ── Opening: a full-width photographic band ──
                The dark philodendron photograph carries the atmosphere now, so
                the translucent plum panel that used to bound this section is
                gone. The image is decorative — alt="" — because it tells the
                reader nothing; Joanna's portrait below is the meaningful one.

                The photograph's own composition does the heavy lifting: its
                left side is almost black, which is where the copy sits, and the
                lit leaves fall on the right behind the portrait. */}
            <section className="about-hero">
                <span className="about-hero-media" aria-hidden="true">
                    <Image
                        src="/images/about-hero-dark-botanical.webp"
                        alt=""
                        fill
                        sizes="100vw"
                        quality={70}
                        priority
                        className="about-hero-image"
                    />
                </span>

                {/* Layered overlays: a deep plum wash on the copy side, a
                    softer centre, a vignette, and a warm glow behind the
                    portrait. Kept as separate layers so the photograph is
                    tinted rather than permanently recoloured. */}
                <span className="about-hero-wash" aria-hidden="true" />
                <span className="about-hero-vignette" aria-hidden="true" />

                <div className="about-hero-text">
                    <p className="about-eyebrow">
                        <span className="about-eyebrow-line" aria-hidden="true" />
                        {t('label')}
                    </p>

                    <h1 className="about-name">
                        <span className="about-name-line">{t('heroTitle')}</span>{' '}
                        <span className="about-name-line about-name-gold">
                            {t('heroTitleGold')}
                        </span>
                    </h1>

                    <span className="about-name-rule" aria-hidden="true" />

                    {/* The gold "od serca dla serca." / "from heart to heart."
                        clause that closed this sentence has been removed, along
                        with the em-dash that introduced it — leaving the dash
                        would have dangled. `.about-opening-highlight` styles
                        remain in globals.css for any future highlighted clause. */}
                    <p className="about-opening">{t('openingStatement')}</p>
                </div>

                <div className="about-portrait">
                    {/* The sacred-geometry ornament that used to sit here is
                        gone: its circles suited the old oval crop, and layering
                        drawn foliage over a photograph of foliage read as
                        clutter. The photograph is the decoration now. */}
                    <div className="about-portrait-frame">
                        {/* The source file is a 1240x1240 SQUARE with a gold
                            ring and cream corners baked into it — it was
                            declared as 840x1040 here, which was simply wrong.

                            Because the frame is now a 4:5 rectangle, that baked
                            ring would otherwise be visible as a circle inside a
                            rectangle, so `.about-portrait-image` scales past it
                            (see globals.css). `sizes` is therefore larger than
                            the frame: the browser must fetch enough pixels to
                            survive that zoom. */}
                        <Image
                            src="/images/Joanna-photo.png"
                            alt={t('photoName')}
                            width={1240}
                            height={1240}
                            sizes="(max-width: 480px) 420px, (max-width: 900px) 520px, 680px"
                            priority
                            className="about-portrait-image"
                        />
                    </div>
                </div>
            </section>

            {/* ── Quotation ── */}
            <section className="about-quote" aria-labelledby="about-quote-text">
                {/* Was a decorative &rdquo; glyph. At this size the two commas
                    read as a pair of stray droplets rather than a quotation
                    mark, so it is now the same fine gold diamond that closes
                    the section — one ornament, used twice, symmetrically. */}
                <span className="about-quote-diamond" aria-hidden="true" />

                <blockquote className="about-quote-block">
                    <p id="about-quote-text" className="about-quote-text">
                        {t('quote')}
                    </p>
                </blockquote>

                <span className="about-quote-diamond" aria-hidden="true" />
            </section>

            {/* ── The story: two columns with one central rule ── */}
            <section className="about-story">
                <article className="about-story-col">
                    <span className="about-story-icon" aria-hidden="true">
                        <IntegrationIcon />
                    </span>

                    <h2 className="about-story-title">{t('journeyTitle')}</h2>

                    {journeyParagraphs.map((paragraph) => (
                        <p key={paragraph} className="about-story-text">
                            {paragraph}
                        </p>
                    ))}
                </article>

                <article className="about-story-col">
                    <span className="about-story-icon" aria-hidden="true">
                        <SoulIcon />
                    </span>

                    <h2 className="about-story-title">{t('studioTitle')}</h2>

                    {studioParagraphs.map((paragraph) => (
                        <p key={paragraph} className="about-story-text">
                            {paragraph}
                        </p>
                    ))}

                    <p className="about-story-text">{t('methodParagraph')}</p>
                </article>
            </section>

            {/* ── Candlelight interlude ──
                A DIFFERENT photograph from the homepage banner: tall pillar
                candles on steps here, small tea lights there, so the two pages
                do not repeat the same picture. Treated as a quieter moment —
                a much shorter band, a deeper wash, and a reflection rather
                than a quotation. */}
            <section className="about-banner" aria-labelledby="about-banner-text">
                <span className="about-banner-media" aria-hidden="true">
                    <Image
                        src="/images/candle-steps-glow.webp"
                        alt=""
                        fill
                        sizes="100vw"
                        quality={70}
                        className="about-banner-image"
                    />
                </span>
                <span className="about-banner-veil" aria-hidden="true" />

                <p id="about-banner-text" className="about-banner-text">
                    {t('bannerReflection')}
                </p>
            </section>

            {/* ── Five support areas ── */}
            <SupportGrid />

            {/* ── The one framed element on the page ── */}
            <section className="alchemik" aria-labelledby="alchemik-title">
                <span className="alchemik-symbol" aria-hidden="true">
                    <BotanicalOrnament />
                </span>

                <div className="alchemik-body">
                    <h2 id="alchemik-title" className="alchemik-title">
                        {t('alchemikTitle')}
                    </h2>

                    <p className="alchemik-text">{t('alchemikDescription')}</p>

                </div>

                {/* Prices and durations come from Sanity. When Sanity is
                    unreachable this list is empty and only the CTA shows —
                    never a fabricated figure. */}
                {alchemikOffers.length > 0 && (
                    <ul className="alchemik-offers">
                        {alchemikOffers.map((offer) => (
                            <li key={offer.name} className="alchemik-offer">
                                <span className="alchemik-offer-name">
                                    {offer.name}
                                </span>

                                {offer.duration && (
                                    <span className="alchemik-offer-duration">
                                        {offer.duration}
                                    </span>
                                )}

                                <span className="alchemik-offer-price">
                                    {offer.price}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <Link href={alchemikHref} className="alchemik-button">
                    {t('alchemikButton')}
                </Link>
            </section>

            {/* ── Closing ── */}
            <section className="about-closing">
                <BotanicalOrnament
                    variant="sprig"
                    className="about-closing-ornament about-closing-ornament-left"
                />
                <BotanicalOrnament
                    variant="sprig"
                    className="about-closing-ornament about-closing-ornament-right"
                />

                {closingParagraphs.map((paragraph) => (
                    <p key={paragraph} className="about-closing-text">
                        {paragraph}
                    </p>
                ))}

                <p className="about-signature">
                    <span className="about-signature-icon" aria-hidden="true">
                        {/* A quill beside the sign-off, replacing a heart. */}
                        <QuillIcon />
                    </span>
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
        path: '/o-mnie',
        pl: {
            title: 'O mnie — Joanna Witkowska | Letting Go Zen Studio',
            description:
                'Poznaj Joannę Witkowską, założycielkę Letting Go Zen Studio w Aberdeen — jak pracuje, komu towarzyszy i z jakich metod korzysta.',
        },
        en: {
            title: 'About — Joanna Witkowska | Letting Go Zen Studio',
            description:
                'Meet Joanna Witkowska, founder of Letting Go Zen Studio in Aberdeen — how she works, who she supports, and the methods she uses.',
        },
    })
}
