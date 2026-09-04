// components/about/SupportGrid.tsx
//
// "W czym mogę Cię wesprzeć? / How can I support you?" — five support areas as
// ONE open composed section divided by hairline rules, not five boxed cards.
//
// The five icons come from the existing shared set, so the stroke weight and
// proportions match the Body / Mind / Soul glyphs exactly. Each sits in an
// equal-sized square, and the whole row shares grid rows so titles and
// descriptions stay aligned even when a title wraps to two lines — the same
// subgrid technique used by the homepage benefits.
//
// The copy lives in `aboutPage.supportItems` as explicit {title, text} objects.
// Nothing is parsed out of a sentence here.

'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEntranceReveal } from '@/lib/useEntranceReveal'

type SupportItem = { title: string; text: string }

// Joanna's own emblems, in the order the copy is written. She supplied them on
// a labelled sheet, so each one is HER pairing rather than an interpretation:
// brain to NLP, spiral head to hypnotherapy, seated figure to mindfulness,
// atom to quantum physics, ouroboros to energy alchemy.
const ICONS = [
    '/images/icon-nlp.webp',
    '/images/icon-hipnoterapia.webp',
    '/images/icon-mindfulness.webp',
    '/images/icon-fizyka.webp',
    '/images/icon-alchemia.webp',
] as const

const REVEAL_STEPS = ['.support-item']

export default function SupportGrid() {
    const t = useTranslations('aboutPage')
    const items = t.raw('supportItems') as SupportItem[]

    const sectionRef = useRef<HTMLElement | null>(null)
    // No drawSelector any more: these are raster emblems, so there is no SVG
    // geometry to draw on. The items still fade and rise together.
    useEntranceReveal(sectionRef, { steps: REVEAL_STEPS, stagger: 75, shift: 10 })

    return (
        <section
            className="support"
            aria-labelledby="support-heading"
            ref={sectionRef}
        >
            <h2 id="support-heading" className="support-heading">
                {t('supportTitle')}
            </h2>

            <ul className="support-grid">
                {items.map((item, index) => {
                    const src = ICONS[index] ?? ICONS[ICONS.length - 1]

                    return (
                        <li key={item.title} className="support-item">
                            {/* Decorative: the title beside it carries the meaning.
                                The printed word on Joanna's source sheet was
                                cropped off — this text has to translate. */}
                            <span className="support-icon" aria-hidden="true">
                                <Image
                                    src={src}
                                    alt=""
                                    width={320}
                                    height={320}
                                    sizes="(max-width: 600px) 96px, 120px"
                                    className="support-emblem"
                                />
                            </span>

                            <h3 className="support-title">{item.title}</h3>

                            <p className="support-text">{item.text}</p>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
