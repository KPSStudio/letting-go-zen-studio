// components/layout/Nav.tsx
// The main navigation bar showing the logo and page links

import Link from 'next/link'

export default function Nav() {
    return (
        <nav className="w-full px-6 py-4 flex justify-between items-center"
             style={{ borderBottom: '1px solid rgba(184,148,42,0.15)' }}>

            {/* Left side — Logo */}
            <Link href="/" className="flex items-center gap-3">
        <span className="font-cinzel text-brand-gold-lt text-xl tracking-widest">
          LETTING GO
        </span>
                <span className="font-cinzel text-brand-cream text-xl tracking-widest">
          ZEN STUDIO
        </span>
            </Link>

            {/* Right side — Nav links */}
            <div className="hidden md:flex items-center gap-8">
                <Link href="/" className="font-cinzel text-sm text-brand-cream hover:text-brand-gold transition-colors tracking-wider">
                    Strona Główna
                </Link>
                <Link href="/body" className="font-cinzel text-sm text-brand-cream hover:text-brand-gold transition-colors tracking-wider">
                    Ciało
                </Link>
                <Link href="/mind" className="font-cinzel text-sm text-brand-cream hover:text-brand-gold transition-colors tracking-wider">
                    Umysł
                </Link>
                <Link href="/soul" className="font-cinzel text-sm text-brand-cream hover:text-brand-gold transition-colors tracking-wider">
                    Dusza
                </Link>
                <Link href="/o-mnie" className="font-cinzel text-sm text-brand-cream hover:text-brand-gold transition-colors tracking-wider">
                    O Mnie
                </Link>
                <Link href="/kontakt" className="font-cinzel text-sm text-brand-cream hover:text-brand-gold transition-colors tracking-wider">
                    Kontakt
                </Link>
            </div>

        </nav>
    )
}