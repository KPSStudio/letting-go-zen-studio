'use client'

import { useState } from 'react'
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
        },
        '.Tab--selected': {
            border: '1px solid rgba(212,175,106,0.8)',
            backgroundColor: 'rgba(184,148,42,0.1)',
            color: '#D4AF6A',
        },
    },
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

    async function handlePay(e: React.FormEvent) {
        e.preventDefault()
        if (!stripe || !elements) return
        if (!email) {
            setError('Proszę podać adres email.')
            return
        }

        setPaying(true)
        setError(null)

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/${locale}/sklep?success=true&product=${encodeURIComponent(product.namePl)}`,
                payment_method_data: {
                    billing_details: {
                        email,
                    }
                }
            },
        })

        if (error) {
            setError(error.message ?? 'Wystąpił błąd płatności.')
            setPaying(false)
        }
    }

    return (
        <form onSubmit={handlePay}>

            {/* Email field */}
            <div style={{ marginBottom: '1rem' }}>
                <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    color: 'var(--gold)',
                    marginBottom: '0.5rem',
                }}>
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
                        boxSizing: 'border-box' as const,
                        marginBottom: '0.5rem',
                    }}
                />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <PaymentElement />
            </div>

            {error && (
                <p style={{
                    fontFamily: 'var(--font-raleway)',
                    fontSize: '0.85rem',
                    color: '#ff6b6b',
                    marginBottom: '1rem',
                }}>
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={!stripe || paying || !email}
                className="shop-buy-button"
                style={{
                    opacity: !stripe || paying || !email ? 0.6 : 1,
                    cursor: !stripe || paying || !email ? 'not-allowed' : 'pointer',
                }}
            >
                {paying ? 'Przetwarzanie...' : `🔒 Zapłać ${formatPrice(product.priceGBP)}`}
            </button>

            <button
                type="button"
                onClick={onBack}
                style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.75rem',
                    marginTop: '0.5rem',
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    color: 'rgba(245,237,216,0.4)',
                    background: 'transparent',
                    border: '1px solid rgba(245,237,216,0.1)',
                    cursor: 'pointer',
                }}
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
    const [checkoutProduct, setCheckoutProduct] = useState<SanitySklepProduct | null>(null)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loading, setLoading] = useState<string | null>(null)

    const isSuccess = typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('success') === 'true'

    function getProductName(product: SanitySklepProduct) {
        return locale === 'en' && product.nameEn ? product.nameEn : product.namePl
    }

    function getProductDesc(product: SanitySklepProduct) {
        return locale === 'en' && product.descEn ? product.descEn : product.descPl
    }

    async function handleBuyNow(product: SanitySklepProduct) {
        setLoading(product._id)
        try {
            const res = await fetch('/api/checkout/sklep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    productName: product.namePl,
                    fileName: product.fileName,
                    priceGBP: product.priceGBP,
                    pricePLN: product.pricePLN,
                    currency,
                    locale,
                }),
            })

            const data = await res.json()

            if (data.clientSecret) {
                setClientSecret(data.clientSecret)
                setCheckoutProduct(product)
                setSelectedProduct(null)
            } else {
                alert('Wystąpił błąd. Spróbuj ponownie.')
            }
        } catch {
            alert('Wystąpił błąd. Spróbuj ponownie.')
        } finally {
            setLoading(null)
        }
    }

    // Success page
    if (isSuccess) {
        return (
            <main className="body-page">
                <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✨</div>
                    <h1 style={{
                        fontFamily: 'var(--font-cinzel)',
                        fontSize: '2rem',
                        color: 'var(--gold-lt)',
                        marginBottom: '1rem',
                    }}>
                        Dziękujemy!
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-raleway)',
                        fontSize: '1rem',
                        color: 'var(--cream)',
                        opacity: 0.8,
                        marginBottom: '0.5rem',
                    }}>
                        Link do pobrania został wysłany na Twój email.
                    </p>
                    <p style={{
                        fontFamily: 'var(--font-raleway)',
                        fontSize: '0.85rem',
                        color: 'var(--cream)',
                        opacity: 0.6,
                        marginBottom: '2rem',
                    }}>
                        Link wygasa po 24 godzinach.
                    </p>
                </div>
            </main>
        )
    }

    // Checkout view
    if (clientSecret && checkoutProduct) {
        return (
            <main className="body-page">
                <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(184,148,42,0.2)',
                        padding: '2.5rem',
                    }}>
                        <p style={{
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '0.7rem',
                            letterSpacing: '0.3em',
                            color: 'var(--gold)',
                            marginBottom: '0.5rem',
                        }}>
                            📄 PDF · NATYCHMIASTOWE POBRANIE
                        </p>
                        <h2 style={{
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '1rem',
                            color: 'var(--gold-lt)',
                            marginBottom: '0.5rem',
                        }}>
                            {getProductName(checkoutProduct)}
                        </h2>
                        <p style={{
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '1.5rem',
                            color: 'var(--cream)',
                            marginBottom: '1.5rem',
                        }}>
                            {formatPrice(checkoutProduct.priceGBP)}
                        </p>

                        <Elements
                            stripe={stripePromise}
                            options={{ clientSecret, appearance: stripeAppearance }}
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
                <p className="body-intro">{t('intro')}</p>
            </section>

            {products.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(184,148,42,0.15)',
                }}>
                    <p style={{
                        fontFamily: 'var(--font-cinzel)',
                        fontSize: '0.85rem',
                        letterSpacing: '0.2em',
                        color: 'rgba(245,237,216,0.4)',
                    }}>
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

                            <h2 className="body-product-name">{getProductName(product)}</h2>
                            <p className="body-product-desc">{getProductDesc(product)}</p>
                            <p className="body-product-pdf">📄 {product.deliveryNote}</p>

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
                                    onClick={() => handleBuyNow(product)}
                                    disabled={loading === product._id}
                                    className="shop-buy-button"
                                    style={{
                                        opacity: loading === product._id ? 0.6 : 1,
                                        cursor: loading === product._id ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {loading === product._id
                                        ? 'Ładowanie...'
                                        : `🔒 ${t('buyNow')} — ${formatPrice(product.priceGBP)}`
                                    }
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
                <div onClick={() => setSelectedProduct(null)} className="body-modal-backdrop">
                    <div onClick={e => e.stopPropagation()} className="body-modal-panel">
                        <button type="button" onClick={() => setSelectedProduct(null)} className="body-modal-close">×</button>

                        <p style={{
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '0.65rem',
                            letterSpacing: '0.2em',
                            color: 'var(--gold)',
                            marginBottom: '0.75rem',
                        }}>
                            📄 PDF · NATYCHMIASTOWE POBRANIE
                        </p>

                        <h2 className="body-modal-title">{getProductName(selectedProduct)}</h2>

                        {selectedProduct.includes && selectedProduct.includes.length > 0 && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">{t('includesLabel')}</p>
                                <ul className="body-modal-list">
                                    {selectedProduct.includes.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="body-modal-actions">
                            <button
                                type="button"
                                onClick={() => handleBuyNow(selectedProduct)}
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