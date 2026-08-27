'use client'

import Image from 'next/image'
import { useRef, type CSSProperties } from 'react'
import { useTranslations } from 'next-intl'
import { useEntranceReveal } from '@/lib/useEntranceReveal'

// The whole item is revealed as one piece, not icon/heading/text separately.
// The four columns share subgrid rows to stay aligned, so animating the item
// keeps that alignment untouched — and the second section of the page staying
// simpler than the first is deliberate, not an oversight.
const REVEAL_STEPS = ['.home-why-item']

/**
 * "Dlaczego warto? / Why choose us?" — four benefits inside ONE band, divided
 * by hairline gold rules, rather than four floating cards.
 *
 * The copy is deliberately about how Joanna works — attention, a whole-person
 * view, deliberate method choice, an unhurried space. It makes no claim about
 * what any session treats, cures, proves or guarantees.
 *
 * THE EMBLEMS ARE IMAGES HERE, not the inline SVGs used everywhere else on the
 * site. Joanna supplied this set, and they are painted gold artwork rather than
 * line drawings, so they cannot inherit `currentColor` or be redrawn in CSS.
 * Two consequences worth knowing before editing:
 *
 *   • the shimmer that travels across each emblem is a gradient masked by the
 *     emblem's own alpha, which is why `--icon-src` is set inline — the CSS
 *     needs the same file the <Image> is showing;
 *   • the files as supplied had a checkerboard PAINTED INTO them (they carried
 *     an alpha channel, but it was fully opaque). These are keyed copies; the
 *     originals in public/images/attachments/ cannot be used directly.
 */
export default function WhyChooseUs() {
    const t = useTranslations('home')

    const sectionRef = useRef<HTMLElement | null>(null)
    useEntranceReveal(sectionRef, { steps: REVEAL_STEPS, stagger: 80, shift: 10 })

    const benefits = [
        { key: 'why1', src: '/images/why-individual.webp' },
        { key: 'why2', src: '/images/why-holistic.webp' },
        { key: 'why3', src: '/images/why-methods.webp' },
        { key: 'why4', src: '/images/why-calm.webp' },
    ] as const

    return (
        <section className="home-why" aria-labelledby="home-why-heading" ref={sectionRef}>
            <div className="home-why-inner">
                <h2 id="home-why-heading" className="home-why-heading">
                    {t('whyHeading')}
                </h2>

                <ul className="home-why-grid">
                    {benefits.map(({ key, src }) => (
                        <li key={key} className="home-why-item">
                            {/* alt="" — the heading beside it already names the
                                benefit, so announcing the emblem too would just
                                repeat it. */}
                            <span
                                className="home-why-icon"
                                style={{ '--icon-src': `url(${src})` } as CSSProperties}
                            >
                                <Image
                                    src={src}
                                    alt=""
                                    width={320}
                                    height={320}
                                    sizes="(max-width: 600px) 96px, 120px"
                                    className="home-why-image"
                                />
                            </span>

                            <h3 className="home-why-title">{t(`${key}Title`)}</h3>

                            <p className="home-why-text">{t(`${key}Text`)}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
