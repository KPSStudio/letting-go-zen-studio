'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

export default function CUDPillars() {
    const t = useTranslations('pillars')
    // The hrefs in the messages are bare (e.g. "/body"); prefix them with the
    // active locale so the links point straight at /pl/body, /en/body, etc.
    const locale = useLocale()

    const pillars = [
        { letter: t('bodyLetter'), name: t('bodyName'), href: `/${locale}${t('bodyHref')}` },
        { letter: t('mindLetter'), name: t('mindName'), href: `/${locale}${t('mindHref')}` },
        { letter: t('soulLetter'), name: t('soulName'), href: `/${locale}${t('soulHref')}` },
    ]

    return (
        <section className="cud-section">

            {/* Section heading */}
            <p className="cud-heading">{t('heading')}</p>

            {/* Small clickable letter row */}
            <div className="cud-mini-row">
                {pillars.map((pillar, index) => (
                    <span key={pillar.letter} className="cud-mini-item">
            <Link
                href={pillar.href}
                aria-label={pillar.name}
                className="cud-mini-letter"
            >
              {pillar.letter}
            </Link>
                        {index < pillars.length - 1 && (
                            <span className="cud-mini-dot" aria-hidden="true">·</span>
                        )}
          </span>
                ))}
            </div>

            {/* Main card grid */}
            <div className="cud-grid">
                {pillars.map((pillar, index) => (
                    <Link
                        key={pillar.letter}
                        href={pillar.href}
                        className={['cud-card', index < pillars.length - 1 ? 'cud-card-border' : ''].join(' ')}
                    >
                        <span className="cud-card-glow" aria-hidden="true" />
                        <span className="cud-card-letter">{pillar.letter}</span>
                        <p className="cud-card-title">{pillar.name}</p>
                        <span className="cud-card-button">{t('explore')}</span>
                    </Link>
                ))}
            </div>

        </section>
    )
}