// components/common/BotanicalOrnament.tsx
//
// A restrained botanical / sacred-geometry line ornament, shared by the About
// portrait backdrop and the Contact page motif — the one decorative primitive
// both pages genuinely have in common.
//
// It is drawn in the same stroke language as the Body / Mind / Soul icons
// (currentColor, round caps, thin weight) so it reads as part of the same hand.
// Everything about it is subordinate: it carries no meaning, sits at low
// opacity behind real content, and is hidden from assistive technology.
//
// `overflow: visible` is deliberately NOT used — the artwork stays inside its
// viewBox so a parent can clip it and it can never widen the page.

type Props = {
    className?: string
    /** `bloom` sits behind the portrait; `sprig` is the lighter corner accent. */
    variant?: 'bloom' | 'sprig'
}

const shared = {
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 0.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
}

export default function BotanicalOrnament({ className, variant = 'bloom' }: Props) {
    if (variant === 'sprig') {
        return (
            <svg {...shared} viewBox="0 0 120 120" className={className}>
                {/* A single stem with paired leaves — the quiet version. */}
                <path d="M18 108C34 86 50 64 60 40c6-15 10-25 12-30" />
                <path d="M60 40c-9-3-16-1-21 6s-5 15 0 22c9-3 16-9 19-16 2-5 3-9 2-12Z" opacity="0.85" />
                <path d="M72 22c-8 1-14 5-17 12s-2 14 3 20c7-5 11-11 13-18 1-6 1-11 1-14Z" opacity="0.7" />
                <path d="M45 74c-8-2-14 0-18 6s-4 13 0 19c7-3 12-8 15-14 2-5 3-9 3-11Z" opacity="0.55" />
            </svg>
        )
    }

    return (
        <svg {...shared} viewBox="0 0 240 240" className={className}>
            {/* Concentric guide circles — the sacred-geometry half of the motif. */}
            <circle cx="120" cy="120" r="104" opacity="0.45" />
            <circle cx="120" cy="120" r="86" opacity="0.25" />

            {/* Eight petals radiating from the centre. Drawn as one mirrored pair
                rotated by the group transform, so the file stays small. */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <path
                    key={angle}
                    d="M120 120c9 -20 9 -38 0 -56 -9 18 -9 36 0 56Z"
                    transform={`rotate(${angle} 120 120)`}
                    opacity="0.55"
                />
            ))}

            {/* Inner ring and centre. */}
            <circle cx="120" cy="120" r="22" opacity="0.7" />
            <circle cx="120" cy="120" r="6" opacity="0.9" />
        </svg>
    )
}
