// components/layout/Footer.tsx
// Footer appears on every page.
// It matches the approved demo style: slim, dark, balanced, and understated.

import Image from 'next/image'
import Link from 'next/link'

const navLinks = [
    { label: 'CIAŁO', href: '/body' },
    { label: 'UMYSŁ', href: '/mind' },
    { label: 'DUSZA', href: '/soul' },
    { label: 'SKLEP', href: '/sklep' },
    { label: 'WSPÓŁPRACA', href: '/wspolpraca' },
    { label: 'O MNIE', href: '/o-mnie' },
    { label: 'KONTAKT', href: '/kontakt' },
]

const socialLinks = [
    { label: 'f', href: 'https://facebook.com/lettinggozenstudio' },
    { label: '◎', href: 'https://instagram.com/lettinggozenstudio' },
    { label: '♪', href: 'https://tiktok.com/@lettinggozenstudio' },
]

export default function Footer() {
    return (
        <footer className="site-footer">
            {/* Top row — brand, navigation, social links */}
            <div className="footer-top-row">
                <Link
                    href="/"
                    className="footer-brand"
                    aria-label="Letting Go Zen Studio homepage"
                >
                    <Image
                        src="/images/logo.png"
                        alt="Letting Go Zen Studio logo"
                        width={20}
                        height={20}
                        className="footer-logo"
                    />

                    <span className="footer-brand-name">
                        LETTING GO ZEN STUDIO
                    </span>
                </Link>

                <nav
                    aria-label="Footer navigation"
                    className="footer-nav"
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="footer-nav-link"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="footer-social-row">
                    {socialLinks.map((social) => (
                        <a
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${social.label}`}
                            className="footer-social-link"
                        >
                            {social.label}
                        </a>
                    ))}
                </div>
            </div>

            {/* Bottom row — copyright and legal links */}
            <div className="footer-bottom-row">
                <span className="footer-copyright">
                    © 2025 Letting Go Zen Studio · Joanna Witkowska
                </span>

                <div className="footer-legal-links">
                    <Link
                        href="/regulamin"
                        className="footer-bottom-link"
                    >
                        REGULAMIN
                    </Link>

                    <Link
                        href="/polityka-prywatnosci"
                        className="footer-bottom-link"
                    >
                        POLITYKA PRYWATNOŚCI
                    </Link>
                </div>
            </div>
        </footer>
    )
}