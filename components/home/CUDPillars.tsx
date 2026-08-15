'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { BodyIcon, MindIcon, SoulIcon } from './PillarIcons'
import { useEntranceReveal } from '@/lib/useEntranceReveal'

// Module-level so the identities are stable across renders and the reveal
// effect does not re-run. Order = icon, then heading, then description.
const REVEAL_STEPS = ['.cud-card-icon', '.cud-card-title', '.cud-card-text']
// Only the geometry inside the three pillar icons, never any other SVG.
const DRAW_SELECTOR = '.cud-card-icon svg path, .cud-card-icon svg circle, .cud-card-icon svg rect'

/**
 * "Czym się zajmujemy?" — the introduction, then the three Body / Mind / Soul
 * cards in one centred row divided by thin gold rules.
 *
 * Each card is a single link wrapping its icon, title and description, so the
 * whole tile is one keyboard stop with a meaningful accessible name rather than
 * a tile containing a separate "explore" link. The C / U / D letter row and the
 * per-card "ODKRYJ →" button that used to sit here were removed: the row
 * duplicated the card titles, and the button duplicated the card's own link.
 */
export default function CUDPillars() {
    const t = useTranslations('pillars')
    // The hrefs in the messages are bare (e.g. "/body"); prefix them with the
    // active locale so the links point straight at /pl/body, /en/body, etc.
    const locale = useLocale()

    // The introduction is three paragraphs rather than one sentence, so it is
    // stored as an array. t.raw() is the only way next-intl hands an array back
    // unformatted — same approach as journeyParagraphs on the About page.
    const introParagraphs = t.raw('introParagraphs') as string[]

    // The entrance animation is scoped to this section only.
    const sectionRef = useRef<HTMLElement | null>(null)
    useEntranceReveal(sectionRef, {
        steps: REVEAL_STEPS,
        drawSelector: DRAW_SELECTOR,
    })

    const pillars = [
        {
            key: 'body',
            name: t('bodyName'),
            text: t('bodyText'),
            href: `/${locale}${t('bodyHref')}`,
            Icon: BodyIcon,
        },
        {
            key: 'mind',
            name: t('mindName'),
            text: t('mindText'),
            href: `/${locale}${t('mindHref')}`,
            Icon: MindIcon,
        },
        {
            key: 'soul',
            name: t('soulName'),
            text: t('soulText'),
            href: `/${locale}${t('soulHref')}`,
            Icon: SoulIcon,
        },
    ]

    return (
        // `services` is a stable, language-neutral scroll target so the same
        // anchor works on /pl and /en; scroll-margin-top in globals.css keeps
        // the sticky nav from covering the heading on arrival.
        <section id="services" className="cud-section" ref={sectionRef}>

            <h2 className="cud-heading">{t('heading')}</h2>

            {/* The group owns the gap down to the cards; the paragraphs only
                space themselves from each other. Putting that margin on every
                paragraph would open a 4.75rem hole after each one. */}
            <div className="cud-intro-group">
                {introParagraphs.map((paragraph) => (
                    <p key={paragraph} className="cud-intro">
                        {paragraph}
                    </p>
                ))}
            </div>

            <div className="cud-grid">
                {pillars.map(({ key, name, text, href, Icon }) => (
                    <Link key={key} href={href} className="cud-card">
                        <span className="cud-card-glow" aria-hidden="true" />

                        <span className="cud-card-icon">
                            <Icon />
                        </span>

                        <h3 className="cud-card-title">{name}</h3>

                        <p className="cud-card-text">{text}</p>
                    </Link>
                ))}
            </div>

        </section>
    )
}
