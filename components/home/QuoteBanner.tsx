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
 * The backdrop is the lantern-and-lavender altar scene Joanna supplied. Its
 * objects run in a row along the bottom of the frame, so the band anchors to
 * that edge and crops the empty upper half away. Loaded through
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
            {/* Purely atmospheric, so alt="" — the image carries nothing the
                quotation does not.

                Bottom-weighted scene: lantern, singing bowls, incense burner,
                amethyst and stones all sit in a horizontal row along the foot of
                the frame, with open purple and the gold spiral above. So it is
                anchored to its BOTTOM edge and cropped — that row is already
                band-shaped, and no mirroring or stretching is needed. The two
                earlier graphics were edge-frames and needed the opposite
                treatment; see the note in globals.css. */}
            <span className="home-quote-media" aria-hidden="true">
                <Image
                    src="/images/altar-incense-lavender.webp"
                    alt=""
                    fill
                    sizes="100vw"
                    quality={72}
                    className="home-quote-image"
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
