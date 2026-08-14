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
 * "Letting Go / Zen Studio" name, a single line of description, and one
 * restrained outlined button.
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

            {/* The five independently-fading ornaments that used to sit here
                (Fibonacci spiral, biofeedback, aura, pendulum, quantum) have
                been removed. Their staggered fade-ins read as pop-in rather
                than atmosphere. The site-wide ray of light in
                app/[locale]/layout.tsx now carries that role, calmly and on
                every page. The image assets are intentionally left in
                public/images/ for rollback. */}

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

                <p className="hero-description">{t('description')}</p>

                <Link href={`/${locale}/o-mnie`} className="hero-button">
                    {t('button')}
                </Link>
            </div>

            {/* Decorative line */}
            <span className="hero-bottom-line" aria-hidden="true" />
        </section>
    )
}
