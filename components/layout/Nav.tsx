// components/layout/Nav.tsx
// Main navigation shown on every page.
// Ciało, Umysł, Dusza, Sklep, and Współpraca stay Polish as brand/category names.
// Only general UI labels like Home, O Mnie, and Kontakt use translations.

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

type StaticLink = {
    href: string
    label?: string
    labelKey?: string
}

const staticLinks = [
    { labelKey: 'home',       href: '/' },
    { labelKey: 'body',       href: '/body' },
    { labelKey: 'mind',       href: '/mind' },
    { labelKey: 'soul',       href: '/soul' },
    { labelKey: 'sklep',      href: '/sklep' },
    { labelKey: 'wspolpraca', href: '/wspolpraca' },
    { labelKey: 'omnie',      href: '/o-mnie' },
    { labelKey: 'kontakt',    href: '/kontakt' },
]

export default function Nav() {
    const pathname = usePathname()
    const locale = useLocale()
    const t = useTranslations('nav')

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Removes /pl or /en from the current URL so active-link checking works.
    // Example: /pl/body becomes /body.
    const cleanPathname = pathname.replace(/^\/(pl|en)(?=\/|$)/, '') || '/'

    function closeMobileMenu() {
        setIsMobileMenuOpen(false)
    }

    // Creates the correct href for the active language.
    // Example: "/body" becomes "/pl/body" or "/en/body".
    function getLocalizedHref(href: string): string {
        if (href === '/') {
            return `/${locale}`
        }

        return `/${locale}${href}`
    }

    // Uses translation when labelKey exists.
    // Uses fixed Polish label when label exists.
    function getLabel(link: StaticLink): string {
        if (link.labelKey) {
            return t(link.labelKey)
        }

        return link.label ?? ''
    }

    return (
        <nav className="site-nav">
            <Link
                href={`/${locale}`}
                className="site-nav-brand"
                aria-label={t('home')}
                onClick={closeMobileMenu}
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

            {/* Desktop links */}
            <div className="site-nav-links">
                {staticLinks.map((link) => {
                    const isActive = cleanPathname === link.href

                    return (
                        <Link
                            key={link.href}
                            href={getLocalizedHref(link.href)}
                            className={
                                isActive
                                    ? 'site-nav-link site-nav-link-active'
                                    : 'site-nav-link'
                            }
                        >
                            {getLabel(link)}
                        </Link>
                    )
                })}
            </div>

            {/* Mobile menu button */}
            <button
                type="button"
                className="site-nav-mobile-button"
                aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((value) => !value)}
            >
                {isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
            </button>

            {/* Mobile dropdown */}
            {isMobileMenuOpen && (
                <div className="site-mobile-menu">
                    {staticLinks.map((link) => {
                        const isActive = cleanPathname === link.href

                        return (
                            <Link
                                key={link.href}
                                href={getLocalizedHref(link.href)}
                                onClick={closeMobileMenu}
                                className={
                                    isActive
                                        ? 'site-mobile-menu-link site-mobile-menu-link-active'
                                        : 'site-mobile-menu-link'
                                }
                            >
                                {getLabel(link)}
                            </Link>
                        )
                    })}
                </div>
            )}
        </nav>
    )
}