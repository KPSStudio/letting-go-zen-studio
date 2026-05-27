'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
    { label: 'HOME', href: '/' },
    { label: 'CIAŁO', href: '/body' },
    { label: 'UMYSŁ', href: '/mind' },
    { label: 'DUSZA', href: '/soul' },
    { label: 'SKLEP', href: '/sklep' },
    { label: 'WSPÓŁPRACA', href: '/wspolpraca' },
    { label: 'O MNIE', href: '/o-mnie' },
    { label: 'KONTAKT', href: '/kontakt' },
]

// Main navigation shown on every page.
// Desktop shows full links. Mobile hides links and shows a MENU button.
export default function Nav() {
    const pathname = usePathname()

    // Removes language prefix from paths like /pl/body or /en/body.
    const cleanPathname = pathname.replace(/^\/(pl|en)/, '') || '/'

    return (
        <nav className="site-nav">
            <Link
                href="/"
                className="site-nav-brand"
                aria-label="Go to homepage"
            >
                <span className="site-nav-brand-word">LETTING GO</span>

                <Image
                    src="/images/logo.png"
                    alt="Letting Go Zen Studio logo"
                    width={38}
                    height={38}
                    priority
                    className="site-nav-logo"
                />

                <span className="site-nav-brand-word">ZEN STUDIO</span>
            </Link>

            <div className="site-nav-links">
                {navLinks.map((link) => {
                    const isActive = cleanPathname === link.href

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={isActive ? 'site-nav-link site-nav-link-active' : 'site-nav-link'}
                        >
                            {link.label}
                        </Link>
                    )
                })}
            </div>

            <button
                type="button"
                className="site-nav-mobile-button"
                aria-label="Open mobile menu"
            >
                MENU
            </button>
        </nav>
    )
}