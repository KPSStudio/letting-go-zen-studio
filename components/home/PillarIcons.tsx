// components/home/PillarIcons.tsx
//
// Three original line-art icons for the Body / Mind / Soul cards: a seated
// figure, a lotus and a mandala.
//
// They are inline SVG rather than image files on purpose:
//   • they stay crisp at any size and on any DPI, with no srcset to maintain;
//   • they cost no extra network request;
//   • they inherit `currentColor`, so the card's hover state can warm them from
//     gold to bright gold with a single CSS transition instead of a filter hack.
//
// Drawn in the same restrained stroke language as the rest of the site's
// ornaments, on a shared 48x48 grid so the three read as one set. Purely
// decorative — each card already has a real text title — so they are hidden
// from assistive technology.

type IconProps = { className?: string }

const shared = {
    viewBox: '0 0 48 48',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.1,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
}

/** BODY — a seated figure: head, folded arms, crossed legs, on a ground line. */
export function BodyIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <circle cx="24" cy="11" r="4.2" />
            {/* Torso and shoulders */}
            <path d="M24 15.6c-3.6 0-6.4 2.5-7 6l-.6 3.4" />
            <path d="M24 15.6c3.6 0 6.4 2.5 7 6l.6 3.4" />
            {/* Arms resting on the knees */}
            <path d="M16.4 25c-2.6 1.1-4.3 3-4.9 5.6" />
            <path d="M31.6 25c2.6 1.1 4.3 3 4.9 5.6" />
            {/* Crossed legs */}
            <path d="M11.5 30.6c3.3 3.4 7.5 5.1 12.5 5.1s9.2-1.7 12.5-5.1" />
            <path d="M17.6 35.2c1.6-2 3.7-3 6.4-3s4.8 1 6.4 3" />
            {/* Ground */}
            <path d="M13 39.4h22" opacity="0.55" />
        </svg>
    )
}

/** MIND — a lotus: a centre petal flanked by two pairs, over a still waterline. */
export function MindIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            {/* Centre petal */}
            <path d="M24 9.5c3 3.6 4.5 7.4 4.5 11.4S27 28.3 24 31.6c-3-3.3-4.5-7-4.5-10.7S21 13.1 24 9.5Z" />
            {/* Inner pair */}
            <path d="M24 31.6c-4.2.3-7.6-.8-10.2-3.3s-3.9-5.8-3.8-9.8c3.8 1.1 6.8 2.9 8.9 5.4a17 17 0 0 1 3.4 7c1.3-.6 1.9-.5 1.7.7Z" />
            <path d="M24 31.6c4.2.3 7.6-.8 10.2-3.3s3.9-5.8 3.8-9.8c-3.8 1.1-6.8 2.9-8.9 5.4a17 17 0 0 0-3.4 7c-1.3-.6-1.9-.5-1.7.7Z" />
            {/* Waterline */}
            <path d="M12 35.4c3.4 1.6 7.4 2.4 12 2.4s8.6-.8 12-2.4" opacity="0.6" />
        </svg>
    )
}

/** SOUL — a mandala: concentric rings with eight radiating petals. */
export function SoulIcon({ className }: IconProps) {
    // Eight petals, drawn as a teardrop repeated around the centre.
    const petals = Array.from({ length: 8 }, (_, i) => i * 45)

    return (
        <svg {...shared} className={className}>
            <circle cx="24" cy="24" r="16.2" opacity="0.55" />
            <circle cx="24" cy="24" r="11.4" />
            <circle cx="24" cy="24" r="4.1" />
            <circle cx="24" cy="24" r="1.5" fill="currentColor" stroke="none" />
            {petals.map((angle) => (
                <path
                    key={angle}
                    d="M24 8.6c2.1 2.2 3.2 4.4 3.2 6.6s-1.1 4.3-3.2 6.2c-2.1-1.9-3.2-4-3.2-6.2s1.1-4.4 3.2-6.6Z"
                    transform={`rotate(${angle} 24 24)`}
                    opacity="0.85"
                />
            ))}
        </svg>
    )
}

/* ── Benefit icons for the "Why choose us?" band ─────────────────────────────
   Same 48x48 grid, same stroke language and the same currentColor contract as
   the three pillar icons above, so the two sets read as one family. */

/* HeartIcon was removed at the client's request: no heart motif appears
   anywhere on the site. Its four call sites now use SessionIcon, PersonIcon,
   ConversationIcon and QuillIcon respectively. Deleted rather than left unused
   so it cannot quietly return via an import. */

/** A holistic view — a figure held within a circle. */
export function HolisticIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <circle cx="24" cy="24" r="15.6" opacity="0.5" />
            <circle cx="24" cy="16.6" r="3.5" />
            <path d="M24 20.1v11.2" />
            <path d="M17.4 24.2c2 1.5 4.2 2.3 6.6 2.3s4.6-.8 6.6-2.3" />
            <path d="M24 31.3 19.6 37" />
            <path d="M24 31.3 28.4 37" />
        </svg>
    )
}

/**
 * A person held within a spiral — the holistic mark.
 *
 * Replaces the four-point star that used to sit on "Starannie dobrane metody"
 * and on the About page's metaphysics entry. The star was removed at the
 * client's request in favour of something holistic, so — as with HeartIcon —
 * it is deleted rather than left unused, and no star motif remains on the site.
 *
 * The curve is a logarithmic spiral, r = rIn * e^(b0), sampled every 30 degrees
 * over one and a half turns and smoothed into cubics. It shared that
 * construction with the hero's snail-spiral ornament, which has since been
 * removed along with the rest of the drifting symbols — the maths is recorded
 * here so the curve can be regenerated without it.
 *
 * Two numbers matter if this is ever redrawn: the spiral's own bounding box is
 * translated so it sits centred in the 48 grid (the raw curve is not), and its
 * inner turn clears the centre by 8.11 units against the figure's 5.41 reach,
 * leaving 1.6 units of daylight once the 1.1 stroke is painted on both sides.
 * Shrink that clearance and the figure's shoulders touch the spiral.
 */
export function SpiralFigureIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M22.54 13.57 C23.3 13.72 25.73 13.79 27.1 14.47 C28.46 15.15 29.85 16.33 30.73 17.64 C31.6 18.96 32.24 20.74 32.34 22.37 C32.44 24.01 32.09 25.93 31.34 27.45 C30.58 28.97 29.27 30.52 27.8 31.49 C26.34 32.46 24.36 33.17 22.54 33.29 C20.72 33.4 18.57 33.01 16.88 32.17 C15.19 31.33 13.46 29.87 12.38 28.24 C11.3 26.6 10.5 24.4 10.38 22.37 C10.25 20.34 10.68 17.96 11.62 16.07 C12.56 14.18 14.19 12.26 16.01 11.06 C17.82 9.85 20.28 8.97 22.54 8.83 C24.8 8.69 27.46 9.17 29.56 10.21 C31.66 11.26 33.8 13.07 35.14 15.1 C36.48 17.12 37.46 19.86 37.62 22.37 C37.78 24.89 37.24 27.85 36.08 30.19 C34.91 32.53 32.9 34.91 30.64 36.41 C28.38 37.9 25.24 38.25 22.54 39.17" />

            {/* The figure at the centre — same anatomy as HolisticIcon, drawn
                smaller so it sits inside the innermost turn. */}
            <circle cx="24" cy="20.9" r="1.55" />
            <path d="M24 22.6v4.2" />
            <path d="M21.2 24.5c.85.65 1.8 1 2.8 1s1.95-.35 2.8-1" />
            <path d="M24 26.8 22.2 29.1" />
            <path d="M24 26.8 25.8 29.1" />
        </svg>
    )
}

/** A calm space — an unbroken loop. */
export function InfinityIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M24 24c2.6-3.4 4.9-5.1 7-5.1 3.4 0 6.1 2.3 6.1 5.1s-2.7 5.1-6.1 5.1c-2.1 0-4.4-1.7-7-5.1Z" />
            <path d="M24 24c-2.6 3.4-4.9 5.1-7 5.1-3.4 0-6.1-2.3-6.1-5.1s2.7-5.1 6.1-5.1c2.1 0 4.4 1.7 7 5.1Z" />
        </svg>
    )
}

/**
 * PHONE — a handset outline with two signal arcs.
 *
 * Used by the Kontakt page's WhatsApp/telephone card, which previously drew a
 * colour emoji. An emoji renders in the font's own palette (blue on most
 * platforms), which fought the gold line-art everywhere else and could not
 * respond to hover. This inherits currentColor like the rest of the set.
 */
export function PhoneIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            {/* Handset body */}
            <rect x="16.5" y="7.5" width="15" height="33" rx="3.2" />
            {/* Earpiece and the home indicator, so it reads as a phone at 24px */}
            <path d="M21.4 12.4h5.2" opacity="0.7" />
            <path d="M21.8 35.9h4.4" opacity="0.7" />
            {/* Signal arcs */}
            <path d="M35.6 17.4a8.6 8.6 0 0 1 0 13.2" opacity="0.55" />
            <path d="M12.4 17.4a8.6 8.6 0 0 0 0 13.2" opacity="0.55" />
        </svg>
    )
}

/** MAIL — an envelope with the flap drawn as an open fold. */
export function MailIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <rect x="7.5" y="12.5" width="33" height="23" rx="2.6" />
            {/* Flap */}
            <path d="M7.5 15.4 24 26.6l16.5-11.2" />
            {/* Back creases, dropped back so the flap stays the focal line */}
            <path d="M7.9 34.8 19 24.9" opacity="0.45" />
            <path d="M40.1 34.8 29 24.9" opacity="0.45" />
        </svg>
    )
}

/**
 * SHOP — a shopping cart.
 *
 * This was an open book with a small spark above it, chosen so the icon would
 * describe PDF reports as well as any physical stock. In practice the spark sat
 * directly over the book as a vertical stroke crossed by a horizontal one, and
 * at the size it renders that reads unmistakably as a crucifix on a bible.
 * Changed at the client's request: this is a holistic-therapy studio, and a
 * religious reading of the shop link is worse than a slightly literal one.
 *
 * A cart is also the term the site already uses — the nav says KOSZYK — so the
 * icon and the wording now agree.
 *
 * Same 48x48 grid, 1.1 stroke and round caps as the Body / Mind / Soul icons,
 * and it stays legible down to about 24px: five strokes, no fine detail.
 */
export function ShopIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            {/* Handle, hooking down into the basket's top-left corner */}
            <path d="M8 12.5H11.8L13.5 17.1" />
            {/* Basket: a trapezoid, wider at the rim than at the base */}
            <path d="M13.5 17.1H40L36 29.1H17.5Z" />
            {/* One shelf line, the same restrained touch the old spine had */}
            <path d="M15.6 23.1H37.9" opacity="0.55" />
            {/* Wheels, close enough under the base to read as attached */}
            <circle cx="21" cy="32.7" r="2.2" />
            <circle cx="33" cy="32.7" r="2.2" />
        </svg>
    )
}


/* ── Współpraca journey stages ─────────────────────────────────────
   Five stages, one set, same stroke language as the pillar icons. They
   mark the steps of working together; each one sits beside a real text
   heading, so all of them are decorative and hidden from assistive
   technology by the component that renders them. */

/** STAGE 1 — CONVERSATION: two listening arcs facing each other. */
export function ConversationIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M9 14.5h18a2.6 2.6 0 0 1 2.6 2.6v9a2.6 2.6 0 0 1-2.6 2.6H16.4L10.6 33v-4.3H9A2.6 2.6 0 0 1 6.4 26v-9A2.6 2.6 0 0 1 9 14.5Z" />
            <path d="M33.6 19.4h5.4a2.6 2.6 0 0 1 2.6 2.6v8.2a2.6 2.6 0 0 1-2.6 2.6h-1.2v3.9l-4.7-3.9h-4.3" opacity="0.6" />
        </svg>
    )
}

/** STAGE 2 — PREPARATION: a seedling, for the groundwork before a session. */
export function PreparationIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M24 39.5V20.8" />
            <path d="M24 26.4c-4.6 0-8.3-3.4-8.3-8.6 5 0 8.3 3.4 8.3 8.6Z" />
            <path d="M24 22.6c4.2 0 7.6-3.1 7.6-7.9-4.6 0-7.6 3.1-7.6 7.9Z" />
            {/* Ground */}
            <path d="M14.5 39.5h19" opacity="0.55" />
        </svg>
    )
}

/** STAGE 3 — THE SESSION: cupped hands holding a small light. */
export function SessionIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <circle cx="24" cy="17.4" r="4.6" />
            {/* Rays */}
            <path d="M24 8.2v2.6" opacity="0.6" />
            <path d="M16.8 11.2l1.8 1.8" opacity="0.6" />
            <path d="M31.2 11.2l-1.8 1.8" opacity="0.6" />
            {/* Cupped hands */}
            <path d="M10.4 26.2c0 7 6.1 12.4 13.6 12.4s13.6-5.4 13.6-12.4" />
            <path d="M10.4 26.2c0-2.2 1.5-3.8 3.4-3.8s3.4 1.6 3.4 3.8" opacity="0.75" />
            <path d="M37.6 26.2c0-2.2-1.5-3.8-3.4-3.8s-3.4 1.6-3.4 3.8" opacity="0.75" />
        </svg>
    )
}

/** STAGE 4 — INTEGRATION: a ripple settling outward on still water. */
export function IntegrationIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <circle cx="24" cy="24" r="3.2" />
            <circle cx="24" cy="24" r="8.4" opacity="0.7" />
            <circle cx="24" cy="24" r="13.6" opacity="0.45" />
        </svg>
    )
}

/** STAGE 5 — BOOKING: a calendar leaf with a chosen day marked. */
export function BookingIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <rect x="8.5" y="12.4" width="31" height="27.1" rx="2.6" />
            <path d="M8.5 20.2h31" opacity="0.7" />
            <path d="M16.6 8.5v6.4" />
            <path d="M31.4 8.5v6.4" />
            {/* The chosen day */}
            <path d="M19.2 29.6l3.4 3.4 6.2-6.2" />
        </svg>
    )
}

/* ── Booking-consent row glyphs ────────────────────────────────────
   One per declaration, in the same 48x48 / 1.1-stroke language as the
   rest of the set. Each sits beside a full text declaration, so all of
   them are decorative and hidden from assistive technology. */

/** SHIELD — "this is not medical treatment". */
export function ShieldIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M24 6.5 38.5 12v11.4c0 8.2-5.7 15.5-14.5 18.1-8.8-2.6-14.5-9.9-14.5-18.1V12L24 6.5Z" />
            <path d="M18.4 23.8l4 4 7.2-7.2" opacity="0.8" />
        </svg>
    )
}

/** PERSON — "the health information I have given is true". */
export function PersonIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <circle cx="24" cy="16.4" r="6.4" />
            <path d="M11.5 39.5c0-6.9 5.6-12.5 12.5-12.5s12.5 5.6 12.5 12.5" />
        </svg>
    )
}

/** CYCLE — "I may stop at any moment": an open circular arrow. */
export function CycleIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M38.4 24a14.4 14.4 0 1 1-4.6-10.5" />
            <path d="M38.9 6.6v7.9h-7.9" />
        </svg>
    )
}

/** LOCK — data processing. */
export function LockIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <rect x="10.5" y="21.4" width="27" height="18.1" rx="2.8" />
            <path d="M16.6 21.4v-5.2a7.4 7.4 0 0 1 14.8 0v5.2" />
            <path d="M24 28.6v4.8" opacity="0.8" />
        </svg>
    )
}

/** QUILL — the typed signature field. */
export function QuillIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M9.5 38.5c0-9.4 4.2-16.8 12.6-22.2 4.6-3 9.8-4.9 15.6-5.8-.6 6.4-2.4 11.9-5.4 16.4-5.2 7.9-12.3 11.9-21.3 11.9" />
            <path d="M14.6 38.5c3.6-6.5 8.7-11.7 15.4-15.6" opacity="0.7" />
            <path d="M6.5 41.5c1.2-1.4 2.2-2.4 3-3" opacity="0.55" />
        </svg>
    )
}
