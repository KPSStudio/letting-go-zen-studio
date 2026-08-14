'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { HeartIcon, HolisticIcon, StarIcon, InfinityIcon } from './PillarIcons'
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
 */
export default function WhyChooseUs() {
    const t = useTranslations('home')

    const sectionRef = useRef<HTMLElement | null>(null)
    useEntranceReveal(sectionRef, { steps: REVEAL_STEPS, stagger: 80, shift: 10 })

    const benefits = [
        { key: 'why1', Icon: HeartIcon },
        { key: 'why2', Icon: HolisticIcon },
        { key: 'why3', Icon: StarIcon },
        { key: 'why4', Icon: InfinityIcon },
    ] as const

    return (
        <section className="home-why" aria-labelledby="home-why-heading" ref={sectionRef}>
            <div className="home-why-inner">
                <h2 id="home-why-heading" className="home-why-heading">
                    {t('whyHeading')}
                </h2>

                <ul className="home-why-grid">
                    {benefits.map(({ key, Icon }) => (
                        <li key={key} className="home-why-item">
                            <span className="home-why-icon">
                                <Icon />
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
