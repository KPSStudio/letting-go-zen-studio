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

            {/* Decorative floating ornaments. Purely atmospheric — they carry no
                information, so the whole group is hidden from assistive tech.
                The class names say what each one actually depicts. */}
            <div className="hero-mystic-symbols" aria-hidden="true">
                <span className="hero-mystic-symbol hero-mystic-fibonacci" />
                <span className="hero-mystic-symbol hero-mystic-biofeedback" />
                <span className="hero-mystic-symbol hero-mystic-aura" />
                <span className="hero-mystic-symbol hero-mystic-pendulum" />
                <span className="hero-mystic-symbol hero-mystic-quantum" />
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
                    {/* width/height must describe the size the logo is ACTUALLY
                        rendered at, not a smaller nominal value. globals.css
                        sizes .hero-logo with clamp(170px, 48vw, 240px) on phones
                        and clamp(300px, 22vw, 410px) above that; the old
                        width={125} made Next preload a 128px file and the
                        browser upscaled it to as much as 410px, which is why the
                        logo looked soft on desktop. `sizes` mirrors those same
                        clamps so Next picks the right file per viewport. */}
                    <Image
                        src="/images/logo.png"
                        alt="Letting Go Zen Studio"
                        width={410}
                        height={410}
                        sizes="(max-width: 600px) 48vw, (max-width: 768px) 56vw, 22vw"
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