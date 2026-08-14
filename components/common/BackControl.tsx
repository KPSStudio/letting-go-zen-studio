// components/common/BackControl.tsx
//
// The floating back glyph shared by the Ciało, Umysł and Dusza pages.
//
// It is a navigation glyph, not a button containing text:
//
//   • No visible rectangle. The only decoration is a soft circular aura
//     behind the arrow, which is deliberately round so it never reads as
//     another content box.
//   • Fixed to the left edge and vertically centred on desktop, so it sits
//     clear of the content column and cannot overlap a service card. On
//     phones it drops into normal flow near the top-left instead, where it
//     obscures neither the navigation nor the cards.
//   • The hit area is a full 44x44px even though the drawn arrow is smaller,
//     so it meets the touch-target minimum without a drawn container.
//   • It does not follow the pointer and does not appear and disappear as the
//     page scrolls — it is simply always there.
//   • The label is exposed as an aria-label and revealed as a tooltip on
//     hover/focus, rather than sitting on screen permanently.
//   • The destination is a real locale-prefixed href, never `history.back()`,
//     so someone arriving from a search result or a shared link still lands
//     somewhere sensible instead of leaving the site.

'use client'

import Link from 'next/link'

type Props = {
    /** Locale-prefixed destination, e.g. `/pl` or `/en/body`. */
    href: string
    /** Already-translated tooltip text — this component holds no copy. */
    label: string
    /**
     * Already-translated accessible name ("Wróć" / "Go back"). Kept separate
     * from `label` because the visible tooltip is set in uppercase, and some
     * screen readers spell uppercase words out letter by letter.
     */
    ariaLabel: string
}

export default function BackControl({ href, label, ariaLabel }: Props) {
    return (
        <Link href={href} className="back-control" aria-label={ariaLabel}>
            {/* The aura and the tooltip are decorative; the accessible name
                comes from aria-label above. */}
            <span className="back-control-aura" aria-hidden="true" />

            <svg
                className="back-control-glyph"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
            >
                <path d="M14.5 5 7.5 12l7 7" />
            </svg>

            <span className="back-control-tip" aria-hidden="true">
                {label}
            </span>
        </Link>
    )
}
