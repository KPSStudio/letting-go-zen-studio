// components/layout/Footer.tsx
// Footer appears on every page.
// All footer navigation labels translate through next-intl.

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

type FooterLink = {
    labelKey: string
    href: string
}

const navLinks: FooterLink[] = [
    { labelKey: 'body', href: '/body' },
    { labelKey: 'mind', href: '/mind' },
    { labelKey: 'soul', href: '/soul' },
    { labelKey: 'sklep', href: '/sklep' },
    { labelKey: 'wspolpraca', href: '/wspolpraca' },
    { labelKey: 'omnie', href: '/o-mnie' },
    { labelKey: 'kontakt', href: '/kontakt' },
]

const legalLinks: FooterLink[] = [
    { labelKey: 'terms', href: '/regulamin' },
    { labelKey: 'privacy', href: '/polityka-prywatnosci' },
    { labelKey: 'serviceTerms', href: '/zasady-uslug' },
    { labelKey: 'consent', href: '/zgoda-swiadoma' },
]

const socialLinks = [
    { label: 'f', href: 'https://www.facebook.com/lettinggostudiozen/' },
    { label: '◎', href: 'https://instagram.com/lettinggozenstudio' },
    { label: '♪', href: 'https://www.tiktok.com/@lettinggozenstudi' },
]

export default function Footer() {
    const locale = useLocale()
    const t = useTranslations('footer')

    function getLocalizedHref(href: string): string {
        if (href === '/') {
            return `/${locale}`
        }

        return `/${locale}${href}`
    }

    return (
        <footer className="site-footer">
            <div className="footer-top-row">
                <Link
                    href={`/${locale}`}
                    className="footer-brand"
                    aria-label={t('homepageAria')}
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
                    aria-label={t('navigationAria')}
                    className="footer-nav"
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={getLocalizedHref(link.href)}
                            className="footer-nav-link"
                        >
                            {t(link.labelKey)}
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
                            aria-label={t('socialAria', { platform: social.label })}
                            className="footer-social-link"
                        >
                            {social.label}
                        </a>
                    ))}
                </div>
            </div>

            <div className="footer-bottom-row">
                <span className="footer-copyright">
                    © 2026 Letting Go Zen Studio · Joanna Witkowska
                </span>

                <div className="footer-legal-links">
                    {legalLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={getLocalizedHref(link.href)}
                            className="footer-bottom-link"
                        >
                            {t(link.labelKey)}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    )
}