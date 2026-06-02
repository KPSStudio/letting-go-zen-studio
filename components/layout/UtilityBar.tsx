// components/layout/UtilityBar.tsx
'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useCurrency, Currency } from '@/lib/CurrencyContext'
import { useCart } from '@/lib/CartContext'

export default function UtilityBar() {
    const { currency, setCurrency } = useCurrency()
    const { count } = useCart()
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    // Switches language by replacing the locale prefix in the URL
    // e.g. /pl/body → /en/body
    const switchLocale = (newLocale: string) => {
        const segments = pathname.split('/')
        segments[1] = newLocale
        router.push(segments.join('/'))
    }

    return (
        <div className="utility-bar">

            {/* Left — phone */}
            <div className="utility-left">
                <a href="tel:07590572043" className="utility-phone">
                    📱 07590 572 043
                </a>
            </div>

            {/* Right — language, currency, cart */}
            <div className="utility-right" style={{ gap: '0.35rem', display: 'flex', alignItems: 'center' }}>

                {/* Language toggles */}
                {(['pl', 'en'] as const).map((l) => (
                    <button
                        key={l}
                        onClick={() => switchLocale(l)}
                        className="utility-pill"
                        style={{
                            color: locale === l ? 'var(--gold-lt)' : undefined,
                            borderColor: locale === l ? 'rgba(212,175,106,0.8)' : undefined,
                        }}
                    >
                        {l === 'pl' ? '🇵🇱 PL' : '🇬🇧 EN'}
                    </button>
                ))}

                <div className="utility-divider" />
                <div className="utility-gap" />

                {/* Currency toggles */}
                {(['GBP', 'PLN', 'EUR', 'USD'] as Currency[]).map((c) => (
                    <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className="utility-pill utility-currency"
                        style={{
                            color: currency === c ? 'var(--gold-lt)' : undefined,
                            borderColor: currency === c ? 'rgba(212,175,106,0.8)' : undefined,
                        }}
                    >
                        {c === 'GBP' ? '£' : c === 'PLN' ? 'zł' : c === 'EUR' ? '€' : '$'}
                    </button>
                ))}

                <div className="utility-gap" />
                <div className="utility-divider" />
                <div className="utility-gap" />

                {/* Cart */}
                <Link href="/koszyk" className="utility-cart">
                    🛒 Koszyk
                    <span className="utility-cart-count">{count}</span>
                </Link>

            </div>
        </div>
    )
}