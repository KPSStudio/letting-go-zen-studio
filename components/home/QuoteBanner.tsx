'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useEntranceReveal } from '@/lib/useEntranceReveal'

// The quotation reveals as ONE composition — the mark and the text together —
// rather than line by line, which would make it harder to read while moving.
const QUOTE_REVEAL = ['.home-quote-inner']

/**
 * The full-width atmospheric quotation band that sits between the three
 * category columns and the "Why choose us?" section.
 *
 * The backdrop is the purple lantern-and-lavender graphic Joanna chose. It is a
 * tall portrait image in a short, full-bleed band, so `cover` keeps only a
 * horizontal slice through its middle — it works here as colour and texture,
 * not as a picture. See the .home-quote-image note in globals.css. Loaded through
 * next/image with `fill`, so Next serves a width-appropriate, format-negotiated
 * file rather than pushing the full 1672px original at a phone. `sizes="100vw"`
 * tells it the band is always full-bleed.
 *
 * It is NOT marked priority: this band sits below the hero and the three
 * category cards, so it should never compete with the logo for the initial
 * load. Lazy loading is the default and is what we want here.
 *
 * The plum wash, the edge vignette and the slight desaturation live in CSS
 * (.home-quote-veil / .home-quote-image), so the source file is untouched.
 */
export default function QuoteBanner() {
    const t = useTranslations('home')

    const sectionRef = useRef<HTMLElement | null>(null)
    useEntranceReveal(sectionRef, { steps: QUOTE_REVEAL, shift: 14 })

    return (
        <section className="home-quote" aria-labelledby="home-quote-text" ref={sectionRef}>
            {/* Purely atmospheric: the photograph and the overlay that keeps
                the quotation legible on top of it. alt="" because the image
                carries no information the quotation does not. */}
            {/* The graphic is a tall portrait FRAME — lantern, lavender and
                moon phases around a deliberately empty middle. Cropping it to
                fill a short wide band threw all of that away and kept only the
                glow. So it is used as designed instead: one full-height copy
                down each edge, the right one mirrored, with the quotation
                sitting in the open centre they create. Nothing is cropped. */}
            <span className="home-quote-media" aria-hidden="true">
                <Image
                    src="/images/purple_obj.jpeg"
                    alt=""
                    fill
                    sizes="(max-width: 600px) 50vw, 30vw"
                    quality={72}
                    className="home-quote-image home-quote-image-left"
                />
                <Image
                    src="/images/purple_obj.jpeg"
                    alt=""
                    fill
                    sizes="(max-width: 600px) 50vw, 30vw"
                    quality={72}
                    className="home-quote-image home-quote-image-right"
                />
            </span>
            <span className="home-quote-veil" aria-hidden="true" />

            <div className="home-quote-inner">
                {/* Decorative quotation mark. The real quotation is the text
                    below, so this glyph is hidden from assistive tech. */}
                <span className="home-quote-mark" aria-hidden="true">&rdquo;</span>

                <blockquote className="home-quote-block">
                    <p id="home-quote-text" className="home-quote-text">
                        {t('quote')}
                    </p>

                    {/* <cite> inside the blockquote is the correct place for
                        the attribution: it names the source of the quotation
                        rather than being part of it. */}
                    <cite className="home-quote-author">{t('quoteAuthor')}</cite>
                </blockquote>
            </div>
        </section>
    )
}
