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
import { useTranslations } from 'next-intl'
import {
    SessionIcon,
    PreparationIcon,
    MindIcon,
    StarIcon,
    InfinityIcon,
} from '@/components/home/PillarIcons'
import { useEntranceReveal } from '@/lib/useEntranceReveal'

type SupportItem = { title: string; text: string }

// Session, leaf, lotus, star, energy flow — in the order the copy is written.
// The first slot pairs with "Sesje terapeutyczne & NLP", so SessionIcon is the
// literal match; it replaced a heart, which is no longer used anywhere.
const ICONS = [SessionIcon, PreparationIcon, MindIcon, StarIcon, InfinityIcon] as const

const REVEAL_STEPS = ['.support-item']
const DRAW_SELECTOR =
    '.support-icon svg path, .support-icon svg circle, .support-icon svg rect'

export default function SupportGrid() {
    const t = useTranslations('aboutPage')
    const items = t.raw('supportItems') as SupportItem[]

    const sectionRef = useRef<HTMLElement | null>(null)
    useEntranceReveal(sectionRef, {
        steps: REVEAL_STEPS,
        drawSelector: DRAW_SELECTOR,
        stagger: 75,
        shift: 10,
    })

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
                    const Icon = ICONS[index] ?? ICONS[ICONS.length - 1]

                    return (
                        <li key={item.title} className="support-item">
                            {/* Decorative: the title beside it carries the meaning. */}
                            <span className="support-icon" aria-hidden="true">
                                <Icon />
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
