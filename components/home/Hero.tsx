'use client'

import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
    // t() looks up text from messages/pl.json or messages/en.json
    // depending on which language is active
    const t = useTranslations('hero')
    // Internal links must carry the active locale (e.g. /pl/o-mnie), otherwise
    // middleware has to redirect them on every click.
    const locale = useLocale()

    return (
        <section className="hero-section">

            {/* Mystical floating symbols */}
            <div className="hero-mystic-symbols" aria-hidden="true">
                <span className="hero-mystic-symbol hero-mystic-eye" />
                <span className="hero-mystic-symbol hero-mystic-circle" />
                <span className="hero-mystic-symbol hero-mystic-pyramid" />
                <span className="hero-mystic-symbol hero-mystic-eye-two" />
                <span className="hero-mystic-symbol hero-mystic-circle-two" />
            </div>

            {/* Large decorative orbit around the hero content */}
            <div className="hero-orbit" aria-hidden="true">
                <span className="hero-orbit-dot hero-orbit-dot-one" />
                <span className="hero-orbit-dot hero-orbit-dot-two" />
                <span className="hero-orbit-dot hero-orbit-dot-three" />
            </div>

            {/* Thin animated vertical gold line */}
            <span className="hero-vertical-line" aria-hidden="true" />

            {/* Rising gold dots */}
            <div className="hero-rising-dots" aria-hidden="true">
                <span /><span /><span /><span /><span />
            </div>

            {/* Main hero content */}
            <div className="hero-content">

                {/* Logo */}
                <div className="hero-logo-wrap">
                    <Image
                        src="/images/logo.png"
                        alt="Letting Go Zen Studio"
                        width={125}
                        height={125}
                        priority
                        className="hero-logo"
                    />
                </div>

                {/* Tagline */}
                <div className="hero-tagline-wrap">
                    <span className="hero-tagline-line" />
                    <p className="hero-tagline">{t('tagline')}</p>
                    <span className="hero-tagline-line" />
                </div>

                {/* Main title */}
                <h1 className="hero-title">{t('title1')}</h1>

                {/* Subtitle */}
                <h2 className="hero-subtitle">{t('title2')}</h2>

                {/* Button */}
                <Link href={`/${locale}/o-mnie`} className="hero-button">
                    {t('button')}
                </Link>

                {/* Decorative line */}
                <span className="hero-bottom-line" aria-hidden="true" />

            </div>
        </section>
    )
}