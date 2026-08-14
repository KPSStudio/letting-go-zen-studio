// components/common/SocialIcons.tsx
//
// Brand marks for the three social links on the Contact page, replacing the
// previous placeholder glyphs ('f', a camera emoji and a musical note). The
// emoji in particular rendered in the font's own colour palette, so it fought
// the gold line art and could not respond to hover.
//
// Brand logos are recognised by their filled silhouette rather than by stroke
// weight, so these are the one deliberate exception to the site's line-art
// style — they use `fill: currentColor` and inherit the link's colour, which
// keeps them gold and lets them warm on hover like everything else.
//
// All three are decorative: each link already has a visible text label, so the
// accessible name comes from that and these are hidden from assistive tech.

type IconProps = { className?: string }

const shared = {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
    focusable: false,
}

export function FacebookIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M14.5 8.5V6.9c0-.7.5-.9.8-.9h2V3h-2.7c-2.6 0-3.2 1.9-3.2 3.2v2.3H9v3h2.4V21h3.1v-9.5h2.3l.3-3h-2.6Z" />
        </svg>
    )
}

export function InstagramIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.9-.1Zm0 2c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.2.4-.3 1-.4 2.1C2.7 8.5 2.7 8.9 2.7 12s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.4a6.4 6.4 0 1 1 0 12.8 6.4 6.4 0 0 1 0-12.8Zm0 2a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Zm6.6-3.6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
    )
}

export function TikTokIcon({ className }: IconProps) {
    return (
        <svg {...shared} className={className}>
            <path d="M16.6 2h-3.1v13.2a2.6 2.6 0 1 1-2.6-2.6c.2 0 .5 0 .7.1V9.5a5.9 5.9 0 0 0-.7 0 5.7 5.7 0 1 0 5.7 5.7V8.6a6.7 6.7 0 0 0 4 1.3V6.8a3.7 3.7 0 0 1-2.8-1.3A3.8 3.8 0 0 1 16.6 2Z" />
        </svg>
    )
}
