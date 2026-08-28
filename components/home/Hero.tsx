'use client'

import { useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useLogoReveal } from '@/lib/useLogoReveal'

/**
 * The homepage hero.
 *
 * One centred column: emblem, the "Ciało · Umysł · Dusza" eyebrow, the gold
 * "Letting Go / Zen Studio" name sized to span the page, and one restrained
 * outlined button.
 *
 * The brand name is the <h1>: on the homepage it IS the subject of the page,
 * and it is the visual heading of the composition. "Czym się zajmujemy?" in the
 * section below is the <h2>, and the three card titles are <h3> — so the
 * document outline reads in the same order as the page does.
 *
 * The practical facts that used to live here (Aberdeen, in person + online,
 * languages) now read as a sentence in that section's intro instead of a row of
 * chips, which keeps this first screen as calm as the reference.
 */
// One file for both layers, and the same one the quotation band uses further
// down the page — so the browser fetches it once for the whole homepage.
const HERO_SCENE = '/images/altar-incense-lavender.webp'

export default function Hero() {
    // t() looks up text from messages/pl.json or messages/en.json
    // depending on which language is active
    const t = useTranslations('hero')
    // Internal links must carry the active locale (e.g. /pl/o-mnie), otherwise
    // middleware has to redirect them on every click.
    const locale = useLocale()

    // The emblem is a raster PNG, so this is a soft mask reveal rather than
    // true SVG path drawing. See lib/useLogoReveal.ts for why.
    //
    // The content column is passed in as well so the eyebrow and the gold
    // wordmark arrive on the emblem's own timeline: they are one lockup, and
    // the name used to sit there fully formed while the mark drew itself in.
    const logoRef = useRef<HTMLImageElement | null>(null)
    const contentRef = useRef<HTMLDivElement | null>(null)
    useLogoReveal(logoRef, contentRef)

    return (
        <section className="hero-section">

            {/* THE ALTAR SCENE. Two copies of one file, and the reason is the
                shape of the picture: it is 843x1264 portrait, so it fills a
                phone almost exactly but survives only about a quarter of a wide
                desktop hero.

                So the copy is never cropped — it is sized to the hero's HEIGHT
                and centred, keeping the whole composition — and its edges are
                feathered into the site's own velvet texture, which shows
                through either side because the hero itself has no background.
                Stretching to fill was the alternative and is not viable: 0.667
                to roughly 2.6 would squash the lantern and bowls to a quarter
                of their height. On phones the picture simply covers, because
                there the proportions already agree.

                It is the same picture as the quotation band further down the
                page, deliberately: one file, cached once, and the hero shows a
                different part of it than the band does.

                The four drifting gold symbols that used to sit here were
                removed at the client's request; over a photographic scene they
                read as clutter. */}
            <span className="hero-media" aria-hidden="true">
                {/* The copy lives in a frame carrying the image's OWN
                    aspect ratio, not the hero's. That is what lets its left and
                    right edges be feathered into the blur: a mask on the image
                    itself would work across the full hero width, and the image
                    only occupies the middle third of that. */}
                <span className="hero-media-frame">
                    <Image
                        src={HERO_SCENE}
                        alt=""
                        fill
                        sizes="(max-width: 900px) 100vw, 70vh"
                        quality={78}
                        priority
                        className="hero-media-sharp"
                    />
                </span>
            </span>

            {/* Darkens the middle so the gold name holds its contrast over the
                lavender and the painted spiral behind it. */}
            <span className="hero-scrim" aria-hidden="true" />

            {/* Thin animated vertical gold line */}
            <span className="hero-vertical-line" aria-hidden="true" />

            {/* Rising gold dots */}
            <div className="hero-rising-dots" aria-hidden="true">
                <span /><span /><span /><span /><span />
            </div>

            <div className="hero-content" ref={contentRef}>

                {/* ── Emblem ── */}
                <div className="hero-emblem">
                    <div className="hero-orbit" aria-hidden="true">
                        <span className="hero-orbit-dot hero-orbit-dot-one" />
                        <span className="hero-orbit-dot hero-orbit-dot-two" />
                        <span className="hero-orbit-dot hero-orbit-dot-three" />
                    </div>

                    {/* alt="" because the wordmark below already names the
                        business — announcing it twice helps nobody. `sizes`
                        mirrors the clamps in globals.css so Next serves a file
                        matched to the rendered size rather than an upscaled one.

                        This uses logo-hero.png rather than logo.png. The
                        original has asymmetric transparent padding — 237px on
                        the left against 228px on the right — so its artwork
                        sits 4.5px right of the canvas centre. The image element
                        was always perfectly centred; the drawing inside it was
                        not, which is why the emblem read as slightly right of
                        the wordmark. logo-hero.png is the same artwork at the
                        same size on the same 1024x1024 canvas, shifted to be
                        horizontally centred. logo.png is untouched for the nav,
                        footer and emails, where the offset is invisible. */}
                    <Image
                        src="/images/logo-hero.png"
                        alt=""
                        width={420}
                        height={420}
                        sizes="(max-width: 768px) 285px, (max-width: 1500px) 27vw, 405px"
                        priority
                        className="hero-logo"
                        ref={logoRef}
                    />
                </div>

                {/* ── Eyebrow ── */}
                <p className="hero-tagline-wrap">
                    <span className="hero-tagline-line" aria-hidden="true" />
                    <span className="hero-tagline">{t('tagline')}</span>
                    <span className="hero-tagline-line" aria-hidden="true" />
                </p>

                {/* ── Name ── */}
                {/* The explicit {' '} matters: the two spans are display:block,
                    so without it the accessible name concatenates to
                    "Letting GoZen Studio". It is not rendered visually because
                    each span is its own block. */}
                <h1 className="hero-wordmark">
                    <span className="hero-wordmark-line">{t('brandLine1')}</span>{' '}
                    <span className="hero-wordmark-line hero-wordmark-sub">
                        {t('brandLine2')}
                    </span>
                </h1>

                {/* The "Przestrzeń harmonii…" line that sat here has been
                    removed: the eyebrow and the name already say what this is,
                    and the sentence pushed the button below the fold on short
                    screens. The `.hero-description` styles and the `description`
                    key in messages/*.json are deliberately kept, so restoring it
                    is a one-line change rather than a rewrite. */}

                <Link href={`/${locale}/o-mnie`} className="hero-button">
                    {t('button')}
                </Link>
            </div>

            {/* Decorative line */}
            <span className="hero-bottom-line" aria-hidden="true" />
        </section>
    )
}
