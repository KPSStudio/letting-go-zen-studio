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

// Main desktop navigation shown on every page.
export default function Nav() {
    const pathname = usePathname()

    // Removes language prefix from paths like /pl/body or /en/body.
    // This lets active links still work after i18n is added.
    const cleanPathname = pathname.replace(/^\/(pl|en)/, '') || '/'

    return (
        <nav className="flex w-full items-center justify-between border-b border-brand-gold/15 bg-black/80 px-8 py-0">
            <Link
                href="/"
                className="flex items-center gap-3 no-underline"
            >
        <span className="font-cinzel text-[0.85rem] tracking-[0.2em] text-brand-gold-lt">
          LETTING GO
        </span>

                <Image
                    src="/images/logo.png"
                    alt="Letting Go Zen Studio logo"
                    width={36}
                    height={36}
                    priority
                />

                <span className="font-cinzel text-[0.85rem] tracking-[0.2em] text-brand-gold-lt">
          ZEN STUDIO
        </span>
            </Link>

            <div className="flex items-stretch gap-8">
                {navLinks.map((link) => {
                    const isActive = cleanPathname === link.href

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`
                relative flex h-[60px] items-center font-cinzel text-[0.7rem]
                tracking-[0.15em] no-underline transition-colors duration-200
                after:absolute after:bottom-0 after:left-0 after:h-[2px]
                after:bg-brand-gold-lt after:transition-all after:duration-300
                hover:text-brand-gold-lt hover:after:w-full
                ${isActive
                                ? 'text-brand-gold-lt after:w-full'
                                : 'text-brand-cream after:w-0'
                            }
              `}
                        >
                            {link.label}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}