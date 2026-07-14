// components/layout/UtilityBar.tsx
'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCurrency, Currency } from '@/lib/CurrencyContext'
import { useCart } from '@/lib/CartContext'
import { buildLocaleHref } from '@/lib/localeRouting'

export default function UtilityBar() {
    const { currency, setCurrency } = useCurrency()
    const { count } = useCart()
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const t = useTranslations('utility')

    // Preserve route + query params so changing PL/EN does not reset an active
    // consent, payment, or booking flow.
    const switchLocale = (newLocale: 'pl' | 'en') => {
        router.push(buildLocaleHref(pathname, window.location.search, newLocale))
    }

    return (
        <div className="utility-bar">

            {/* Left — phone */}
            <div className="utility-left">
                <a href="tel:07590572043" className="utility-phone">
                    📱 {t('phone')}
                </a>
            </div>

            {/* Right — language, currency, cart */}
            <div
                className="utility-right"
                style={{
                    gap: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >

                {/* Language toggles */}
                {(['pl', 'en'] as const).map((l) => (
                    <button
                        key={l}
                        type="button"
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
                {(['GBP', 'PLN'] as Currency[]).map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className="utility-pill utility-currency"
                        style={{
                            color: currency === c ? 'var(--gold-lt)' : undefined,
                            borderColor: currency === c ? 'rgba(212,175,106,0.8)' : undefined,
                        }}
                    >
                        {c === 'GBP' ? '£' : 'zł'}
                    </button>
                ))}

                <div className="utility-gap" />
                <div className="utility-divider" />
                <div className="utility-gap" />

                {/* Cart */}
                <Link href={`/${locale}/koszyk`} className="utility-cart">
                    🛒 {t('cart')}
                    <span className="utility-cart-count">{count}</span>
                </Link>

            </div>
        </div>
    )
}