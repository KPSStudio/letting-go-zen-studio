// components/home/CUDPillars.tsx
// This component shows the three C · U · D homepage cards.
// Each mini letter and card links to its matching page.

import Link from 'next/link'

interface Pillar {
    letter: string
    name: string
    href: string
}

const pillars: Pillar[] = [
    { letter: 'C', name: 'CIAŁO', href: '/body' },
    { letter: 'U', name: 'UMYSŁ', href: '/mind' },
    { letter: 'D', name: 'DUSZA', href: '/soul' },
]

export default function CUDPillars() {
    return (
        <section className="cud-section">
            {/* Section heading */}
            <p className="cud-heading">
                Wybierz swoją ścieżkę
            </p>

            {/* Small clickable C · U · D row under the heading */}
            <div className="cud-mini-row">
                {pillars.map((pillar, index) => (
                    <span key={pillar.letter} className="cud-mini-item">
                        <Link
                            href={pillar.href}
                            aria-label={`Przejdź do sekcji ${pillar.name}`}
                            className="cud-mini-letter"
                        >
                            {pillar.letter}
                        </Link>

                        {index < pillars.length - 1 && (
                            <span className="cud-mini-dot" aria-hidden="true">
                                ·
                            </span>
                        )}
                    </span>
                ))}
            </div>

            {/* Main C.U.D card grid */}
            <div className="cud-grid">
                {pillars.map((pillar, index) => {
                    const hasRightBorder = index < pillars.length - 1

                    return (
                        <Link
                            key={pillar.letter}
                            href={pillar.href}
                            className={[
                                'cud-card',
                                hasRightBorder ? 'cud-card-border' : '',
                            ].join(' ')}
                        >
                            {/* Decorative gold glow layer */}
                            <span className="cud-card-glow" aria-hidden="true" />

                            {/* Large C / U / D letter */}
                            <span className="cud-card-letter">
                                {pillar.letter}
                            </span>

                            {/* Card label */}
                            <p className="cud-card-title">
                                {pillar.name}
                            </p>

                            {/* Card button */}
                            <span className="cud-card-button">
                                EXPLORE →
                            </span>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}