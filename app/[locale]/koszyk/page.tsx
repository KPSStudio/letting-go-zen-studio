// app/[locale]/koszyk/page.tsx
// Koszyk page — shows cart items, totals, and Stripe checkout placeholder.

'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useCart } from '@/lib/CartContext'
import { useCurrency } from '@/lib/CurrencyContext'

export default function KoszykPage() {
    const t = useTranslations('cartPage')
    const locale = useLocale()

    const { items, removeItem, clearCart, count, totalGBP, totalPLN } = useCart()
    const { currency, formatPrice } = useCurrency()

    const total = currency === 'PLN' ? totalPLN : totalGBP

    const currencySymbol =
        currency === 'GBP'
            ? '£'
            : currency === 'PLN'
                ? 'zł'
                : currency === 'EUR'
                    ? '€'
                    : '$'

    const typeLabels: Record<string, string> = {
        sesja: t('types.session'),
        session: t('types.session'),
        pakiet: t('types.package'),
        package: t('types.package'),
        pdf: t('types.pdf'),
        ebook: t('types.ebook'),
        produkt: t('types.product'),
        product: t('types.product'),
    }

    return (
        <main className="cart-page">
            <p className="cart-label">
                <span />
                {t('label')}
            </p>

            <section className="cart-header">
                <h1 className="cart-title">
                    {t('title')}
                </h1>
            </section>

            {count === 0 && (
                <section className="cart-empty-card">
                    <div className="cart-empty-icon">
                        🛒
                    </div>

                    <h2 className="cart-empty-title">
                        {t('emptyTitle')}
                    </h2>

                    <p className="cart-empty-text">
                        {t('emptyText')}
                    </p>

                    <Link href={`/${locale}`} className="cart-primary-link">
                        {t('browseButton')}
                    </Link>
                </section>
            )}

            {count > 0 && (
                <section className="cart-layout">
                    <div className="cart-items-column">
                        <div className="cart-items-card">
                            {items.map((item, index) => (
                                <article
                                    key={item.id}
                                    className={`cart-item ${index < items.length - 1 ? 'cart-item-border' : ''}`}
                                >
                                    <div className="cart-item-main">
                                        <p className="cart-item-name">
                                            {item.name}
                                        </p>

                                        <p className="cart-item-type">
                                            {typeLabels[item.type] ?? item.type}
                                        </p>
                                    </div>

                                    <p className="cart-item-price">
                                        {formatPrice(item.gbp)}
                                    </p>

                                    <button
                                        onClick={() => removeItem(item.id)}
                                        aria-label={t('removeItem')}
                                        className="cart-remove-button"
                                    >
                                        ×
                                    </button>
                                </article>
                            ))}
                        </div>

                        <button
                            onClick={clearCart}
                            className="cart-clear-button"
                        >
                            {t('clearCart')}
                        </button>
                    </div>

                    <aside className="cart-summary-card">
                        <p className="cart-summary-label">
                            PODSUMOWANIE
                        </p>

                        <div className="cart-summary-rows">
                            {[
                                { label: t('summary.products'), value: count.toString() },
                                { label: t('summary.currency'), value: `${currency} ${currencySymbol}` },
                                { label: t('summary.delivery'), value: t('summary.deliveryValue') },
                            ].map((row) => (
                                <div key={row.label} className="cart-summary-row">
                                    <span>{row.label}</span>
                                    <strong>{row.value}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="cart-total-row">
                            <span>
                                {t('totalLabel')}
                            </span>

                            <strong>
                                {formatPrice(total)}
                            </strong>
                        </div>

                        <label className="cart-terms-row">
                            <input type="checkbox" />
                            <span>
                                Akceptuję regulamin i politykę prywatności
                            </span>
                        </label>

                        <button className="cart-pay-button">
                            🔒 {t('payButton')}
                        </button>

                        <p className="cart-security-text">
                            🔐 {t('security.ssl')} · Stripe · 🛡️ {t('security.safePayment')}
                        </p>
                    </aside>
                </section>
            )}
        </main>
    )
}