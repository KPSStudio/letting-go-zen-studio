// components/home/Hero.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
    return (
        <section className="hero-section">

            {/* Large decorative orbit around the hero content */}
            <div className="hero-orbit" aria-hidden="true">
                <span className="hero-orbit-dot hero-orbit-dot-one" />
                <span className="hero-orbit-dot hero-orbit-dot-two" />
                <span className="hero-orbit-dot hero-orbit-dot-three" />
            </div>

            {/* Thin animated vertical gold line */}
            <span className="hero-vertical-line" aria-hidden="true" />

            {/* Rising gold dots from the lower C.U.D area */}
            <div className="hero-rising-dots" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
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

                {/* C.U.D line */}
                <div className="hero-tagline-wrap">
                    <span className="hero-tagline-line" />
                    <p className="hero-tagline">
                        Ciało&nbsp;&nbsp; Umysł&nbsp;&nbsp; Dusza
                    </p>
                    <span className="hero-tagline-line" />
                </div>

                {/* Main animated title */}
                <h1 className="hero-title">
                    Letting Go
                </h1>

                {/* Subtitle */}
                <h2 className="hero-subtitle">
                    Zen Studio
                </h2>

                {/* Button */}
                <Link href="/o-mnie" className="hero-button">
                    O Mnie
                </Link>

                {/* Decorative vertical line between Hero and C.U.D cards */}
                <span className="hero-bottom-line" aria-hidden="true" />
            </div>
        </section>
    )
}