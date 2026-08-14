// components/wspolpraca/JourneyStages.tsx
//
// The five-step booking journey on the Współpraca page.
//
// The steps describe the REAL flow, verified in code rather than taken from the
// design reference: choose a service → complete the consent record → the
// Cal.com calendar opens → payment is taken inside Cal.com where the event is
// paid → Cal.com sends the confirmation. The earlier copy listed booking AFTER
// the session and never mentioned payment, which no longer matched the app.
//
// Layout: one connected horizontal sequence on wide screens, a two-row grid on
// tablets, and a vertical timeline on phones. The connecting line is decorative
// — each step carries a visible two-digit number, so the order is never
// communicated by the line (or by colour) alone.

'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
    ConversationIcon,
    QuillIcon,
    BookingIcon,
    LockIcon,
    SessionIcon,
} from '@/components/home/PillarIcons'
import { useEntranceReveal } from '@/lib/useEntranceReveal'

const REVEAL_STEPS = ['.journey-stage']
const DRAW_SELECTOR =
    '.journey-icon svg path, .journey-icon svg circle, .journey-icon svg rect'

// service choice · consent + signature · calendar · secure payment · session
const STAGES = [
    { key: 's1', Icon: ConversationIcon },
    { key: 's2', Icon: QuillIcon },
    { key: 's3', Icon: BookingIcon },
    { key: 's4', Icon: LockIcon },
    { key: 's5', Icon: SessionIcon },
] as const

export default function JourneyStages() {
    const t = useTranslations('wspolpraca.journey')

    const sectionRef = useRef<HTMLElement | null>(null)
    useEntranceReveal(sectionRef, {
        steps: REVEAL_STEPS,
        drawSelector: DRAW_SELECTOR,
        stagger: 90,
        shift: 12,
    })

    return (
        <section
            className="journey"
            aria-labelledby="journey-heading"
            ref={sectionRef}
        >
            <h2 id="journey-heading" className="journey-heading">
                {t('heading')}
            </h2>

            <p className="journey-intro">{t('intro')}</p>

            <ol className="journey-list">
                {STAGES.map(({ key, Icon }, index) => (
                    <li key={key} className="journey-stage">
                        <span className="journey-icon" aria-hidden="true">
                            <Icon />
                        </span>

                        {/* Decorative: the list is ordered, so a screen reader
                            already announces the position. */}
                        <span className="journey-step" aria-hidden="true">
                            {String(index + 1).padStart(2, '0')}
                        </span>

                        <h3 className="journey-title">{t(`${key}Title`)}</h3>

                        <p className="journey-text">{t(`${key}Text`)}</p>
                    </li>
                ))}
            </ol>
        </section>
    )
}
