'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useCurrency } from '@/lib/CurrencyContext'
import { SanitySklepProduct } from '@/sanity/lib/sanity'
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
    },
    rules: {
        '.Input': {
            border: '1px solid rgba(184,148,42,0.3)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: '#E8D7B8',
            boxShadow: 'inset 0 0 18px rgba(184,148,42,0.04)',
        },
        '.Input:hover': {
            border: '1px solid rgba(212,175,106,0.5)',
            backgroundColor: 'rgba(0,0,0,0.38)',
            boxShadow: '0 0 16px rgba(212,175,106,0.1)',
        },
        '.Input:focus': {
            border: '1px solid rgba(212,175,106,0.8)',
            boxShadow: '0 0 0 1px rgba(212,175,106,0.3)',
        },
        '.Label': {
            color: '#B8942A',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
        },
        '.Tab': {
            border: '1px solid rgba(184,148,42,0.3)',
            backgroundColor: 'rgba(0,0,0,0.2)',
            color: '#E8D7B8',
            boxShadow: 'inset 0 0 18px rgba(184,148,42,0.04)',
        },
        '.Tab:hover': {
            border: '1px solid rgba(212,175,106,0.55)',
            backgroundColor: 'rgba(184,148,42,0.08)',
            color: '#D4AF6A',
            boxShadow: '0 0 18px rgba(212,175,106,0.12)',
        },
        '.Tab--selected': {
            border: '1px solid rgba(212,175,106,0.8)',
            backgroundColor: 'rgba(184,148,42,0.1)',
            color: '#D4AF6A',
            boxShadow: '0 0 22px rgba(212,175,106,0.16)',
        },
    },
}

type DigitalLegalAcceptance = {
    termsAccepted: boolean
    privacyAccepted: boolean
    immediateDeliveryConsent: boolean
    withdrawalAcknowledged: boolean
    acceptedAt: string
}

function SklepPaymentForm({
                              product,
                              onBack,
                              formatPrice,
                          }: {
    product: SanitySklepProduct
    onBack: () => void
    formatPrice: (n: number) => string
}) {
    const stripe = useStripe()
    const elements = useElements()
    const locale = useLocale()

    const [paying, setPaying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [email, setEmail] = useState('')

    const canPay = Boolean(stripe && !paying && email)

    async function handlePay(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!stripe || !elements) return

        if (!email) {
            setError('Proszę podać adres email.')
            return
        }

        setPaying(true)
        setError(null)

        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/${locale}/sklep?success=true&product=${encodeURIComponent(product.namePl)}`,
                payment_method_data: {
                    billing_details: {
                        email,
                    },
                },
            },
        })

        if (stripeError) {
            setError(stripeError.message ?? 'Wystąpił błąd płatności.')
            setPaying(false)
        }
    }

    return (
        <form onSubmit={handlePay}>
            {/* Email field required before Stripe can confirm payment */}
            <div style={{ marginBottom: '1rem' }}>
                <label
                    style={{
                        display: 'block',
                        fontFamily: 'var(--font-cinzel)',
                        fontSize: '0.7rem',
                        letterSpacing: '0.15em',
                        color: 'var(--gold)',
                        marginBottom: '0.5rem',
                    }}
                >
                    EMAIL
                </label>

                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="twoj@email.com"
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(184,148,42,0.3)',
                        color: 'var(--cream)',
                        fontFamily: 'var(--font-raleway)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                />
            </div>

            {/* Stripe-controlled payment methods */}
            <div style={{ marginBottom: '1.5rem' }}>
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
                disabled={!canPay}
                className="shop-buy-button"
                style={{
                    opacity: !canPay ? 0.5 : 1,
                    cursor: !canPay ? 'not-allowed' : 'pointer',
                }}
            >
                {paying ? 'Przetwarzanie...' : `🔒 Zapłać ${formatPrice(product.priceGBP)}`}
            </button>

            <button
                type="button"
                onClick={onBack}
                className="shop-legal-back-button"
            >
                ← Anuluj
            </button>
        </form>
    )
}

interface Props {
    products: SanitySklepProduct[]
}

export default function SklepClient({ products }: Props) {
    const t = useTranslations('sklep')
    const locale = useLocale()
    const { currency, formatPrice } = useCurrency()

    const [selectedProduct, setSelectedProduct] = useState<SanitySklepProduct | null>(null)
    const [legalProduct, setLegalProduct] = useState<SanitySklepProduct | null>(null)
    const [checkoutProduct, setCheckoutProduct] = useState<SanitySklepProduct | null>(null)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loading, setLoading] = useState<string | null>(null)

    const [shopTermsAccepted, setShopTermsAccepted] = useState(false)
    const [digitalDeliveryAccepted, setDigitalDeliveryAccepted] = useState(false)
    const [legalError, setLegalError] = useState<string | null>(null)

    const isSuccess =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('success') === 'true'

    function getProductName(product: SanitySklepProduct) {
        return locale === 'en' && product.nameEn ? product.nameEn : product.namePl
    }

    function getProductDesc(product: SanitySklepProduct) {
        return locale === 'en' && product.descEn ? product.descEn : product.descPl
    }

    function openLegalStep(product: SanitySklepProduct) {
        setSelectedProduct(null)
        setLegalProduct(product)
        setShopTermsAccepted(false)
        setDigitalDeliveryAccepted(false)
        setLegalError(null)
    }

    async function handleBuyNow(
        product: SanitySklepProduct,
        legalAcceptance: DigitalLegalAcceptance
    ) {
        setLoading(product._id)

        try {
            const res = await fetch('/api/checkout/sklep', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: product._id,
                    productName: product.namePl,
                    fileName: product.fileName,
                    priceGBP: product.priceGBP,
                    pricePLN: product.pricePLN,
                    currency,
                    locale,

                    termsAccepted: legalAcceptance.termsAccepted,
                    privacyAccepted: legalAcceptance.privacyAccepted,
                    immediateDeliveryConsent: legalAcceptance.immediateDeliveryConsent,
                    withdrawalAcknowledged: legalAcceptance.withdrawalAcknowledged,
                    acceptedAt: legalAcceptance.acceptedAt,
                }),
            })

            const data = await res.json()

            if (data.clientSecret) {
                setClientSecret(data.clientSecret)
                setCheckoutProduct(product)
                setSelectedProduct(null)
                setLegalProduct(null)
            } else {
                alert('Wystąpił błąd. Spróbuj ponownie.')
            }
        } catch {
            alert('Wystąpił błąd. Spróbuj ponownie.')
        } finally {
            setLoading(null)
        }
    }

    function continueToPayment() {
        if (!legalProduct) return

        if (!shopTermsAccepted) {
            setLegalError('Musisz zaakceptować Regulamin Sklepu i Politykę Prywatności.')
            return
        }

        if (!digitalDeliveryAccepted) {
            setLegalError('Musisz wyrazić zgodę na natychmiastowe dostarczenie treści cyfrowej.')
            return
        }

        void handleBuyNow(legalProduct, {
            termsAccepted: true,
            privacyAccepted: true,
            immediateDeliveryConsent: true,
            withdrawalAcknowledged: true,
            acceptedAt: new Date().toISOString(),
        })
    }

    // Success page
    if (isSuccess) {
        return (
            <div className="thankyou-page">
                <div className="thankyou-orbit">
                    <div className="thankyou-orbit-dot" />
                    <div className="thankyou-orbit-dot" />
                    <div className="thankyou-orbit-dot" />
                </div>
                <div className="thankyou-aura" />
                <div className="thankyou-rising-dots">
                    <span /><span /><span /><span /><span />
                </div>
                <div className="thankyou-content">
                    <div className="thankyou-symbol">✦</div>
                    <p className="thankyou-label">
                        <span />
                        Letting Go Zen Studio
                        <span />
                    </p>
                    <h1 className="thankyou-title">Dziękujemy</h1>
                    <div className="thankyou-divider" />
                    <p className="thankyou-text">
                        Link do pobrania został wysłany na Twój email.
                    </p>
                    <p className="thankyou-subtext">
                        PDF · Dostawa Natychmiastowa · 24h Link
                    </p>
                    <a href={`/${locale}`} className="thankyou-button">
                        Wróć na Stronę Główną
                    </a>
                </div>
            </div>
        )
    }

    // Legal consent view shown before Stripe payment is created.
    if (legalProduct) {
        return (
            <main className="body-page">
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(184,148,42,0.2)',
                            padding: '2.5rem',
                        }}
                    >
                        <p
                            style={{
                                fontFamily: 'var(--font-cinzel)',
                                fontSize: '0.7rem',
                                letterSpacing: '0.3em',
                                color: 'var(--gold)',
                                marginBottom: '0.75rem',
                            }}
                        >
                            ZGODY PRAWNE
                        </p>

                        <h2
                            style={{
                                fontFamily: 'var(--font-cinzel)',
                                fontSize: '1.2rem',
                                color: 'var(--gold-lt)',
                                marginBottom: '0.75rem',
                            }}
                        >
                            {getProductName(legalProduct)}
                        </h2>

                        <p
                            style={{
                                fontFamily: 'var(--font-raleway)',
                                fontSize: '0.9rem',
                                color: 'var(--cream)',
                                opacity: 0.8,
                                lineHeight: 1.7,
                                marginBottom: '1.5rem',
                            }}
                        >
                            Przed przejściem do płatności potwierdź wymagane zgody dotyczące zakupu produktu cyfrowego.
                        </p>

                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.65rem',
                                fontFamily: 'var(--font-raleway)',
                                fontSize: '0.8rem',
                                lineHeight: 1.6,
                                color: 'var(--cream)',
                                cursor: 'pointer',
                                marginBottom: '1rem',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={shopTermsAccepted}
                                onChange={e => {
                                    setShopTermsAccepted(e.target.checked)
                                    setLegalError(null)
                                }}
                                style={{
                                    marginTop: '0.2rem',
                                    accentColor: 'var(--gold)',
                                    flexShrink: 0,
                                }}
                            />

                            <span>
                                Zapoznałem/am się i akceptuję{' '}
                                <a
                                    href={`/${locale}/regulamin`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--gold-lt)' }}
                                >
                                    Regulamin Sklepu
                                </a>
                                {' '}oraz{' '}
                                <a
                                    href={`/${locale}/polityka-prywatnosci`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--gold-lt)' }}
                                >
                                    Politykę Prywatności
                                </a>.
                            </span>
                        </label>

                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.65rem',
                                fontFamily: 'var(--font-raleway)',
                                fontSize: '0.8rem',
                                lineHeight: 1.6,
                                color: 'var(--cream)',
                                cursor: 'pointer',
                                marginBottom: '1.25rem',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={digitalDeliveryAccepted}
                                onChange={e => {
                                    setDigitalDeliveryAccepted(e.target.checked)
                                    setLegalError(null)
                                }}
                                style={{
                                    marginTop: '0.2rem',
                                    accentColor: 'var(--gold)',
                                    flexShrink: 0,
                                }}
                            />

                            <span>
                                Wyrażam zgodę na natychmiastowe dostarczenie treści cyfrowej i przyjmuję do wiadomości, że po uzyskaniu dostępu do produktu tracę prawo odstąpienia od umowy w zakresie dozwolonym przez obowiązujące prawo.
                            </span>
                        </label>

                        {legalError && (
                            <p
                                style={{
                                    fontFamily: 'var(--font-raleway)',
                                    fontSize: '0.85rem',
                                    color: '#ff6b6b',
                                    marginBottom: '1rem',
                                }}
                            >
                                {legalError}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={continueToPayment}
                            disabled={
                                loading === legalProduct._id ||
                                !shopTermsAccepted ||
                                !digitalDeliveryAccepted
                            }
                            className="shop-buy-button"
                            style={{
                                opacity:
                                    loading === legalProduct._id ||
                                    !shopTermsAccepted ||
                                    !digitalDeliveryAccepted
                                        ? 0.5
                                        : 1,
                                cursor:
                                    loading === legalProduct._id ||
                                    !shopTermsAccepted ||
                                    !digitalDeliveryAccepted
                                        ? 'not-allowed'
                                        : 'pointer',
                            }}
                        >
                            {loading === legalProduct._id
                                ? 'Ładowanie...'
                                : `Przejdź do płatności — ${formatPrice(legalProduct.priceGBP)}`}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setLegalProduct(null)
                                setLegalError(null)
                            }}
                            className="shop-legal-back-button"
                        >
                            ← Wróć
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    // Checkout view
    if (clientSecret && checkoutProduct) {
        return (
            <main className="body-page">
                <div className="shop-checkout-wrap">
                    <div className="shop-checkout-card">
                        <p
                            style={{
                                fontFamily: 'var(--font-cinzel)',
                                fontSize: '0.7rem',
                                letterSpacing: '0.3em',
                                color: 'var(--gold)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            📄 PDF · NATYCHMIASTOWE POBRANIE
                        </p>

                        <h2
                            style={{
                                fontFamily: 'var(--font-cinzel)',
                                fontSize: '1rem',
                                color: 'var(--gold-lt)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            {getProductName(checkoutProduct)}
                        </h2>

                        <p
                            style={{
                                fontFamily: 'var(--font-cinzel)',
                                fontSize: '1.5rem',
                                color: 'var(--cream)',
                                marginBottom: '1.5rem',
                            }}
                        >
                            {formatPrice(checkoutProduct.priceGBP)}
                        </p>

                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: stripeAppearance,
                            }}
                        >
                            <SklepPaymentForm
                                product={checkoutProduct}
                                onBack={() => {
                                    setClientSecret(null)
                                    setCheckoutProduct(null)
                                }}
                                formatPrice={formatPrice}
                            />
                        </Elements>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="body-page">
            <p className="shop-label">
                <span />
                {t('label')}
            </p>

            <section className="body-header">
                <h1 className="body-title">
                    {t('titleMain')} <span>{t('titleGold')}</span>
                </h1>

                <p className="body-intro">
                    {t('intro')}
                </p>
            </section>

            {products.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '4rem',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(184,148,42,0.15)',
                    }}
                >
                    <p
                        style={{
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '0.85rem',
                            letterSpacing: '0.2em',
                            color: 'rgba(245,237,216,0.4)',
                        }}
                    >
                        Produkty Wkrótce
                    </p>
                </div>
            )}

            {products.length > 0 && (
                <div className="body-product-grid">
                    {products.map(product => (
                        <article key={product._id} className="body-product-card">
                            <p className="shop-delivery-badge">
                                <span>📄</span>
                                {product.deliveryNote?.toUpperCase() ?? 'PDF · NATYCHMIASTOWE POBRANIE'}
                            </p>

                            <h2 className="body-product-name">
                                {getProductName(product)}
                            </h2>

                            <p className="body-product-desc">
                                {getProductDesc(product)}
                            </p>

                            <p className="body-product-pdf">
                                📄 {product.deliveryNote}
                            </p>

                            <div className="body-product-bottom">
                                <div className="body-price-row">
                                    <span className="body-product-price">
                                        {formatPrice(product.priceGBP)}
                                    </span>

                                    {currency !== 'PLN' && product.pricePLN && (
                                        <span className="body-product-price-note">
                                            ≈ zł{product.pricePLN}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => openLegalStep(product)}
                                    disabled={loading === product._id}
                                    className="shop-buy-button"
                                    style={{
                                        opacity: loading === product._id ? 0.6 : 1,
                                        cursor: loading === product._id ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {loading === product._id
                                        ? 'Ładowanie...'
                                        : `🔒 ${t('buyNow')} — ${formatPrice(product.priceGBP)}`}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedProduct(product)}
                                    className="body-info-button"
                                >
                                    {t('moreInfo')}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {selectedProduct && (
                <div
                    onClick={() => setSelectedProduct(null)}
                    className="body-modal-backdrop"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="body-modal-panel"
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedProduct(null)}
                            className="body-modal-close"
                        >
                            ×
                        </button>

                        <p
                            style={{
                                fontFamily: 'var(--font-cinzel)',
                                fontSize: '0.65rem',
                                letterSpacing: '0.2em',
                                color: 'var(--gold)',
                                marginBottom: '0.75rem',
                            }}
                        >
                            📄 PDF · NATYCHMIASTOWE POBRANIE
                        </p>

                        <h2 className="body-modal-title">
                            {getProductName(selectedProduct)}
                        </h2>

                        {selectedProduct.includes && selectedProduct.includes.length > 0 && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">
                                    {t('includesLabel')}
                                </p>

                                <ul className="body-modal-list">
                                    {selectedProduct.includes.map((item, i) => (
                                        <li key={i}>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="body-modal-actions">
                            <button
                                type="button"
                                onClick={() => openLegalStep(selectedProduct)}
                                className="shop-modal-buy-button"
                            >
                                🔒 {t('buyNow')} — {formatPrice(selectedProduct.priceGBP)}
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedProduct(null)}
                                className="body-modal-secondary-button"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}