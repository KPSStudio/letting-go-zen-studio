'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useCart } from '@/lib/CartContext'
import { useCurrency } from '@/lib/CurrencyContext'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const stripeAppearance = {
    theme: 'night' as const,
    variables: {
        colorPrimary: '#D4AF6A',
        colorBackground: '#1a0020',
        colorText: '#E8D7B8',
        colorDanger: '#ff6b6b',
        fontFamily: 'Montserrat, sans-serif',
        borderRadius: '0px',
        colorInputBackground: '#0a0010',
        colorInputText: '#E8D7B8',
        colorInputBorder: 'rgba(184,148,42,0.3)',
        colorInputPlaceholder: 'rgba(232,215,184,0.4)',
    },
    rules: {
        '.Input': {
            border: '1px solid rgba(184,148,42,0.3)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: '#E8D7B8',
        },
        '.Input:focus': {
            border: '1px solid rgba(212,175,106,0.8)',
            boxShadow: '0 0 0 1px rgba(212,175,106,0.3)',
        },
        '.Label': {
            color: '#B8942A',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
        },
        '.Tab': {
            border: '1px solid rgba(184,148,42,0.3)',
            backgroundColor: 'rgba(0,0,0,0.2)',
            color: '#E8D7B8',
        },
        '.Tab--selected': {
            border: '1px solid rgba(212,175,106,0.8)',
            backgroundColor: 'rgba(184,148,42,0.1)',
            color: '#D4AF6A',
        },
        '.Block': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(184,148,42,0.2)',
        },
    },
}

type PendingBookingDetails = {
    serviceId: string
    serviceName: string
    price: number
    token: string
}

function getPendingBookingFromSearchParams(
    params: URLSearchParams
): PendingBookingDetails | null {
    const serviceId = params.get('serviceId') ?? params.get('service') ?? ''
    const serviceName = params.get('serviceName') ?? params.get('service') ?? ''
    const price = parseFloat(params.get('price') ?? '0')
    const token = params.get('token') ?? ''

    if (!serviceId || !serviceName || price <= 0 || !token) {
        return null
    }

    return {
        serviceId,
        serviceName,
        price,
        token,
    }
}

function PaymentForm({
                         onBack,
                         total,
                         formatPrice,
                         pendingBooking,
                     }: {
    onBack: () => void
    total: number
    formatPrice: (n: number) => string
    pendingBooking: PendingBookingDetails | null
}) {
    const stripe = useStripe()
    const elements = useElements()
    const locale = useLocale()
    const t = useTranslations('cartPage')
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handlePay(e: React.FormEvent) {
        e.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setPaying(true)
        setError(null)

        let returnUrl: URL

        if (pendingBooking) {
            returnUrl = new URL(`${window.location.origin}/${locale}/booking-pending`)
            returnUrl.searchParams.set('token', pendingBooking.token)
        } else {
            returnUrl = new URL(`${window.location.origin}/${locale}/koszyk`)
            returnUrl.searchParams.set('success', 'true')
        }

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: returnUrl.toString(),
            },
        })

        if (error) {
            setError(error.message ?? t('payment.fallbackError'))
            setPaying(false)
        }
    }

    return (
        <form onSubmit={handlePay}>
            <div style={{ marginBottom: '2rem' }}>
                <PaymentElement />
            </div>

            {error && (
                <p
                    style={{
                        fontFamily: 'var(--font-raleway)',
                        fontSize: '0.85rem',
                        color: '#ff6b6b',
                        marginBottom: '1rem',
                    }}
                >
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={!stripe || paying}
                className="cart-pay-button"
                style={{
                    opacity: !stripe || paying ? 0.6 : 1,
                    cursor: !stripe || paying ? 'not-allowed' : 'pointer',
                    marginBottom: '1rem',
                }}
            >
                {paying ? t('payment.processing') : `🔒 ${t('payment.pay')} ${formatPrice(total)}`}
            </button>

            <button
                type="button"
                onClick={onBack}
                style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.75rem',
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    color: 'rgba(245,237,216,0.4)',
                    background: 'transparent',
                    border: '1px solid rgba(245,237,216,0.1)',
                    cursor: 'pointer',
                }}
            >
                ← {t('payment.backToCart')}
            </button>

            <p className="cart-security-text" style={{ marginTop: '1rem' }}>
                🔐 {t('payment.ssl')} · Stripe · 🛡️ {t('payment.safePayment')}
            </p>
        </form>
    )
}

export default function KoszykPage() {
    const t = useTranslations('cartPage')
    const locale = useLocale()
    const { items, addItem, removeItem, clearCart, count, totalGBP, totalPLN } = useCart()
    const { currency, formatPrice } = useCurrency()
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [pendingBooking, setPendingBooking] = useState<PendingBookingDetails | null>(null)

    const currentSearchParams = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null

    const isPaymentSuccess = currentSearchParams?.get('success') === 'true'
    const isBookingComplete = currentSearchParams?.get('bookingComplete') === 'true'

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const bookingDetails = getPendingBookingFromSearchParams(params)
        setPendingBooking(bookingDetails)

        if (params.get('booked') === 'true' && bookingDetails) {
            addItem({
                id: bookingDetails.serviceId,
                name: bookingDetails.serviceName,
                type: 'sesja',
                gbp: bookingDetails.price,
                pln: Math.round(bookingDetails.price * 5.2),
            })
        }
    }, [addItem, locale])

    const total = currency === 'PLN' ? totalPLN : totalGBP

    const currencySymbol =
        currency === 'GBP' ? '£' :
            currency === 'PLN' ? 'zł' :
                currency === 'EUR' ? '€' : '$'

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

    async function handleCheckout() {
        if (!termsAccepted) {
            alert(t('errors.acceptTerms'))
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/checkout/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    currency,
                    locale,
                    token: pendingBooking?.token ?? '',
                }),
            })

            const data = await res.json()

            if (data.clientSecret) {
                setClientSecret(data.clientSecret)
            } else {
                alert(data.error ?? t('errors.generic'))
            }
        } catch {
            alert(t('errors.generic'))
        } finally {
            setLoading(false)
        }
    }

    if (isBookingComplete) {
        return (
            <div className="thankyou-page">
                <div className="thankyou-orbit">
                    <div className="thankyou-orbit-dot" />
                    <div className="thankyou-orbit-dot" />
                    <div className="thankyou-orbit-dot" />
                </div>

                <div className="thankyou-aura" />

                <div className="thankyou-rising-dots">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                </div>

                <div className="thankyou-content">
                    <div className="thankyou-symbol">✦</div>

                    <p className="thankyou-label">
                        <span />
                        {t('thankYou.label')}
                        <span />
                    </p>

                    <h1 className="thankyou-title">{t('thankYou.title')}</h1>

                    <div className="thankyou-divider" />

                    <p className="thankyou-text">
                        {t('thankYou.bookingText')}
                    </p>

                    <p className="thankyou-subtext">
                        {t('thankYou.subtext')}
                    </p>

                    <Link href={`/${locale}`} className="thankyou-button">
                        {t('thankYou.homeButton')}
                    </Link>
                </div>
            </div>
        )
    }

    if (isPaymentSuccess) {
        return (
            <div className="thankyou-page">
                <div className="thankyou-orbit">
                    <div className="thankyou-orbit-dot" />
                    <div className="thankyou-orbit-dot" />
                    <div className="thankyou-orbit-dot" />
                </div>

                <div className="thankyou-aura" />

                <div className="thankyou-rising-dots">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                </div>

                <div className="thankyou-content">
                    <div className="thankyou-symbol">✦</div>

                    <p className="thankyou-label">
                        <span />
                        {t('thankYou.label')}
                        <span />
                    </p>

                    <h1 className="thankyou-title">{t('thankYou.title')}</h1>

                    <div className="thankyou-divider" />

                    <p className="thankyou-text">
                        {t('thankYou.paymentText')}
                    </p>

                    <p className="thankyou-subtext">
                        {t('thankYou.subtext')}
                    </p>

                    <Link href={`/${locale}`} className="thankyou-button">
                        {t('thankYou.homeButton')}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <main className="cart-page">
            <p className="cart-label">
                <span />
                {t('label')}
            </p>

            <section className="cart-header">
                <h1 className="cart-title">{t('title')}</h1>
            </section>

            {count === 0 && !clientSecret && (
                <section className="cart-empty-card">
                    <div className="cart-empty-icon">🛒</div>
                    <h2 className="cart-empty-title">{t('emptyTitle')}</h2>
                    <p className="cart-empty-text">{t('emptyText')}</p>

                    <Link href={`/${locale}`} className="cart-primary-link">
                        {t('browseButton')}
                    </Link>
                </section>
            )}

            {count > 0 && !clientSecret && (
                <section className="cart-layout">
                    <div className="cart-items-column">
                        <div className="cart-items-card">
                            {items.map((item, index) => (
                                <article
                                    key={item.id}
                                    className={`cart-item ${index < items.length - 1 ? 'cart-item-border' : ''}`}
                                >
                                    <div className="cart-item-main">
                                        <p className="cart-item-name">{item.name}</p>

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

                        <button onClick={clearCart} className="cart-clear-button">
                            {t('clearCart')}
                        </button>
                    </div>

                    <aside className="cart-summary-card">
                        <p className="cart-summary-label">
                            {t('summary.title')}
                        </p>

                        <div className="cart-summary-rows">
                            {[
                                { label: t('summary.products'), value: count.toString() },
                                { label: t('summary.currency'), value: `${currency} ${currencySymbol}` },
                                { label: t('summary.delivery'), value: t('summary.deliveryValue') },
                            ].map(row => (
                                <div key={row.label} className="cart-summary-row">
                                    <span>{row.label}</span>
                                    <strong>{row.value}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="cart-total-row">
                            <span>{t('totalLabel')}</span>
                            <strong>{formatPrice(total)}</strong>
                        </div>

                        <label className="cart-terms-row">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={e => setTermsAccepted(e.target.checked)}
                            />

                            <span>
                                {t('terms.accept')}{' '}

                                <Link href={`/${locale}/regulamin`} className="cart-terms-link">
                                    {t('terms.regulamin')}
                                </Link>

                                {', '}

                                <Link href={`/${locale}/polityka-prywatnosci`} className="cart-terms-link">
                                    {t('terms.privacy')}
                                </Link>

                                {', '}

                                <Link href={`/${locale}/zasady-uslug`} className="cart-terms-link">
                                    {t('terms.serviceRules')}
                                </Link>

                                {' '}

                                {t('terms.and')}

                                {' '}

                                <Link href={`/${locale}/zgoda-swiadoma`} className="cart-terms-link">
                                    {t('terms.informedConsent')}
                                </Link>
                            </span>
                        </label>

                        <button
                            onClick={handleCheckout}
                            disabled={!termsAccepted || loading}
                            className="cart-pay-button"
                            style={{
                                opacity: !termsAccepted || loading ? 0.5 : 1,
                                cursor: !termsAccepted || loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {loading ? t('payment.loading') : `🔒 ${t('payButton')}`}
                        </button>

                        <p className="cart-security-text">
                            🔐 {t('security.ssl')} · Stripe · 🛡️ {t('security.safePayment')}
                        </p>
                    </aside>
                </section>
            )}

            {clientSecret && (
                <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(184,148,42,0.2)',
                            padding: '2.5rem',
                            marginBottom: '1rem',
                        }}
                    >
                        <p
                            style={{
                                fontFamily: 'var(--font-cinzel)',
                                fontSize: '0.7rem',
                                letterSpacing: '0.3em',
                                color: 'var(--gold)',
                                marginBottom: '1.5rem',
                            }}
                        >
                            {t('payment.title').toUpperCase()} · {formatPrice(total)}
                        </p>

                        <div
                            style={{
                                borderBottom: '1px solid rgba(184,148,42,0.15)',
                                marginBottom: '1.5rem',
                                paddingBottom: '1.5rem',
                            }}
                        >
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: 'var(--font-raleway)',
                                            fontSize: '0.85rem',
                                            color: 'var(--cream)',
                                            opacity: 0.8,
                                        }}
                                    >
                                        {item.name}
                                    </span>

                                    <span
                                        style={{
                                            fontFamily: 'var(--font-cinzel)',
                                            fontSize: '0.85rem',
                                            color: 'var(--gold-lt)',
                                        }}
                                    >
                                        {formatPrice(item.gbp)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <Elements
                            stripe={stripePromise}
                            options={{ clientSecret, appearance: stripeAppearance }}
                        >
                            <PaymentForm
                                onBack={() => setClientSecret(null)}
                                total={total}
                                formatPrice={formatPrice}
                                pendingBooking={pendingBooking}
                            />
                        </Elements>
                    </div>
                </div>
            )}
        </main>
    )
}