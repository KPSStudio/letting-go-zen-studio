// components/layout/Nav.tsx
// Main navigation shown on every page.
// Desktop shows full nav links.
// Mobile shows hamburger menu with nav links and PL/EN language switcher.

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { buildLocaleHref } from '@/lib/localeRouting'
import NavSearch, { type SearchItem } from './NavSearch'

type StaticLink = {
    href: string
    label?: string
    labelKey?: string
}

const staticLinks: StaticLink[] = [
    { labelKey: 'home', href: '/' },
    { labelKey: 'body', href: '/body' },
    { labelKey: 'mind', href: '/mind' },
    { labelKey: 'soul', href: '/soul' },
    { labelKey: 'sklep', href: '/sklep' },
    { labelKey: 'wspolpraca', href: '/wspolpraca' },
    { labelKey: 'omnie', href: '/o-mnie' },
    { labelKey: 'kontakt', href: '/kontakt' },
]

export default function Nav({ searchItems }: { searchItems: SearchItem[] }) {
    const pathname = usePathname()
    const router = useRouter()
    const locale = useLocale()
    const t = useTranslations('nav')

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Tracks whether the page has been scrolled, so the fixed nav can pick up a
    // frosted background + soft shadow once it sits over the page content.
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        function onScroll() {
            setScrolled(window.scrollY > 8)
        }
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Removes /pl or /en from current URL so active-link checking works.
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

    // Switches the current page between Polish and English.
    // Preserve query params so mobile PL/EN switching does not reset consent,
    // payment, or booking flow state.
    function switchLocale(newLocale: 'pl' | 'en') {
        setIsMobileMenuOpen(false)
        router.push(buildLocaleHref(pathname, window.location.search, newLocale))
    }

    // Uses translation when labelKey exists.
    // Uses fixed label when label exists.
    function getLabel(link: StaticLink): string {
        if (link.labelKey) {
            return t(link.labelKey)
        }

        return link.label ?? ''
    }

    return (
        <nav className={scrolled ? 'site-nav site-nav-scrolled' : 'site-nav'}>
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

                <NavSearch items={searchItems} mode="icon" />
            </div>

            {/* Mobile menu button */}
            <button
                type="button"
                className="site-nav-mobile-button"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((value) => !value)}
            >
                {isMobileMenuOpen ? '×' : '☰'}
            </button>

            {/* Mobile dropdown */}
            {isMobileMenuOpen && (
                <div className="site-mobile-menu">
                    <NavSearch items={searchItems} mode="inline" onNavigate={closeMobileMenu} />

                    {/* Mobile language switcher */}
                    <div className="site-mobile-language-row">
                        {(['pl', 'en'] as const).map((language) => (
                            <button
                                key={language}
                                type="button"
                                onClick={() => switchLocale(language)}
                                className={
                                    locale === language
                                        ? 'site-mobile-language-button site-mobile-language-button-active'
                                        : 'site-mobile-language-button'
                                }
                            >
                                {language === 'pl' ? '🇵🇱 PL' : '🇬🇧 EN'}
                            </button>
                        ))}
                    </div>

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