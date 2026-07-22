'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useCurrency } from '@/lib/CurrencyContext'
import { SanitySklepProduct } from '@/sanity/lib/sanity'
import { normalizeText } from '@/lib/normalizeText'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImageSource } from '@sanity/image-url'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    PaymentElement,
    AddressElement,
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

// The price the customer actually pays: the product price plus the flat shipping
// fee on physical / bundle orders. Matches what the checkout route charges, so
// the totals shown at checkout include postage.
function productTotalGBP(product: SanitySklepProduct): number {
    const ships =
        product.productType === 'physical' || product.productType === 'bundle'
    return product.priceGBP + (ships ? product.shippingFeeGBP ?? 0 : 0)
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
    const t = useTranslations('sklep')
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
            setError(t('payment.emailRequired'))
            return
        }

        setPaying(true)
        setError(null)

        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/${locale}/sklep?success=true&product=${encodeURIComponent(product.namePl)}`,
                // receipt_email puts the address on the PaymentIntent, which is
                // what the webhook reads (pi.receipt_email) to send the download
                // link. Also kept on billing_details for the Stripe charge.
                receipt_email: email,
                payment_method_data: {
                    billing_details: {
                        email,
                    },
                },
            },
        })

        if (stripeError) {
            setError(stripeError.message ?? t('payment.error'))
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
                    {t('payment.emailLabel')}
                </label>

                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('payment.emailPlaceholder')}
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

            {/* Shipping address — physical and bundle products only. Stripe
                attaches this to the payment automatically when confirmed. */}
            {(product.productType === 'physical' ||
                product.productType === 'bundle') && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <p
                        style={{
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '0.7rem',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'var(--gold)',
                            marginBottom: '0.5rem',
                        }}
                    >
                        {t('payment.shippingHeading')}
                    </p>

                    <AddressElement
                        options={{
                            mode: 'shipping',
                            allowedCountries: ['GB', 'PL'],
                            fields: { phone: 'always' },
                        }}
                    />

                    <p
                        style={{
                            fontFamily: 'var(--font-raleway)',
                            fontSize: '0.75rem',
                            color: 'rgba(245,237,216,0.55)',
                            marginTop: '0.5rem',
                        }}
                    >
                        {t('payment.shippingNote')}
                    </p>
                </div>
            )}

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
                {paying
                    ? t('payment.processing')
                    : t('payment.pay', { price: formatPrice(productTotalGBP(product)) })}
            </button>

            <button
                type="button"
                onClick={onBack}
                className="shop-legal-back-button"
            >
                {t('payment.cancel')}
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

    // ── SEARCH STATE ──
    const [query, setQuery] = useState('')

    // If arrived from search (?item=<id>), scroll to that card and flash it.
    useEffect(() => {
        const itemId = new URLSearchParams(window.location.search).get('item')
        if (!itemId) return

        const timer = setTimeout(() => {
            const card = document.getElementById(`item-${itemId}`)
            if (!card) return
            card.scrollIntoView({ behavior: 'smooth', block: 'center' })
            card.classList.add('item-flash')
            setTimeout(() => card.classList.remove('item-flash'), 2000)
        }, 300)

        return () => clearTimeout(timer)
    }, [])

    // Whether the customer has just returned from a successful payment
    // (?success=true). We read the URL AFTER mount rather than during render:
    // the server has no `window`, so reading it while rendering would make the
    // server and first client render disagree and break hydration.
    const [isSuccess, setIsSuccess] = useState(false)
    useEffect(() => {
        setIsSuccess(
            new URLSearchParams(window.location.search).get('success') === 'true'
        )
    }, [])

    function getProductName(product: SanitySklepProduct) {
        return locale === 'en' && product.nameEn ? product.nameEn : product.namePl
    }

    function getProductDesc(product: SanitySklepProduct) {
        return locale === 'en' && product.descEn ? product.descEn : product.descPl
    }

    // Bilingual content: use the English fields on /en when filled, otherwise
    // fall back to the Polish ones (so existing products keep working).
    function getDeliveryNote(product: SanitySklepProduct) {
        return locale === 'en' && product.deliveryNoteEn
            ? product.deliveryNoteEn
            : product.deliveryNote
    }

    function getIncludes(product: SanitySklepProduct) {
        return locale === 'en' && product.includesEn?.length
            ? product.includesEn
            : product.includes ?? []
    }

    // ── SEARCH: filter + rank the products we already have in memory ──
    // We match against name, keywords, "includes" and description (both languages),
    // and weight matches so the most relevant product floats to the top.
    const filteredProducts = useMemo(() => {
        const cleaned = normalizeText(query.trim())
        if (!cleaned) return products

        // Split the query into words so "vitamins energy" matches either word.
        const terms = cleaned.split(/\s+/).filter(Boolean)

        function scoreProduct(product: SanitySklepProduct): number {
            const name = normalizeText(`${product.namePl} ${product.nameEn ?? ''}`)
            const keywords = normalizeText((product.keywords ?? []).join(' '))
            const includes = normalizeText((product.includes ?? []).join(' '))
            const desc = normalizeText(`${product.descPl ?? ''} ${product.descEn ?? ''}`)

            let score = 0
            for (const term of terms) {
                if (name.includes(term)) score += 5      // name match = most relevant
                if (keywords.includes(term)) score += 4  // deliberate keyword tag
                if (includes.includes(term)) score += 2  // "what's included" list
                if (desc.includes(term)) score += 1      // somewhere in the description
            }
            return score
        }

        return products
            .map(product => ({ product, score: scoreProduct(product) }))
            .filter(entry => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(entry => entry.product)
    }, [products, query])

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
                alert(t('genericError'))
            }
        } catch {
            alert(t('genericError'))
        } finally {
            setLoading(null)
        }
    }

    function continueToPayment() {
        if (!legalProduct) return

        if (!shopTermsAccepted) {
            setLegalError(t('legalStep.errorTerms'))
            return
        }

        if (!digitalDeliveryAccepted) {
            setLegalError(t('legalStep.errorDelivery'))
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
                    <h1 className="thankyou-title">{t('success.title')}</h1>
                    <div className="thankyou-divider" />
                    <p className="thankyou-text">
                        {t('success.text')}
                    </p>
                    <p className="thankyou-subtext">
                        {t('success.subtext')}
                    </p>
                    <a href={`/${locale}`} className="thankyou-button">
                        {t('success.button')}
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
                            {t('legalStep.title')}
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
                            {t('legalStep.intro')}
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
                                {t('legalStep.acceptPrefix')}{' '}
                                <a
                                    href={`/${locale}/regulamin`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--gold-lt)' }}
                                >
                                    {t('legalStep.termsLink')}
                                </a>
                                {' '}{t('legalStep.and')}{' '}
                                <a
                                    href={`/${locale}/polityka-prywatnosci`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--gold-lt)' }}
                                >
                                    {t('legalStep.privacyLink')}
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
                                {legalProduct.productType === 'physical'
                                    ? t('legalStep.shippingConsent')
                                    : legalProduct.productType === 'bundle'
                                    ? t('legalStep.bundleConsent')
                                    : t('legalStep.deliveryConsent')}
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
                                ? t('loading')
                                : t('legalStep.continueToPayment', { price: formatPrice(productTotalGBP(legalProduct)) })}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setLegalProduct(null)
                                setLegalError(null)
                            }}
                            className="shop-legal-back-button"
                        >
                            {t('legalStep.back')}
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
                            📄 {t('modalBadge')}
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
                            {formatPrice(productTotalGBP(checkoutProduct))}
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

            {/* ── SEARCH BOX (only when there are products to search) ── */}
            {products.length > 0 && (
                <div className="shop-search">
                    <label htmlFor="sklep-search" className="shop-search-label">
                        {t('search.label')}
                    </label>

                    <div className="shop-search-field">
                        <svg
                            className="shop-search-icon"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <line x1="16.5" y1="16.5" x2="21" y2="21" />
                        </svg>

                        <input
                            id="sklep-search"
                            type="search"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder={t('search.placeholder')}
                            className="shop-search-input"
                        />

                        {query.trim() && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="shop-search-clear"
                                aria-label={t('search.clear')}
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {query.trim() && (
                        <p className="shop-search-count">
                            {t('search.results', { count: filteredProducts.length })}
                        </p>
                    )}
                </div>
            )}

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
                        {t('comingSoon')}
                    </p>
                </div>
            )}

            {/* No search matches */}
            {products.length > 0 && query.trim() && filteredProducts.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(184,148,42,0.15)',
                        maxWidth: '640px',
                        margin: '0 auto',
                    }}
                >
                    <p
                        style={{
                            fontFamily: 'var(--font-raleway)',
                            fontSize: '0.95rem',
                            color: 'var(--cream)',
                            opacity: 0.7,
                        }}
                    >
                        {t('search.none')}
                    </p>
                </div>
            )}

            {filteredProducts.length > 0 && (
                <div className="body-product-grid">
                    {filteredProducts.map(product => (
                        <article
                            key={product._id}
                            id={`item-${product._id}`}
                            className="body-product-card"
                        >
                            {product.images && product.images.length > 0 && (
                                <div className="shop-card-image">
                                    <Image
                                        src={urlFor(product.images[0] as SanityImageSource)
                                            .width(640)
                                            .height(480)
                                            .fit('crop')
                                            .auto('format')
                                            .url()}
                                        alt={product.images[0].alt || getProductName(product)}
                                        fill
                                        sizes="(max-width: 720px) 100vw, 360px"
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                            )}

                            <p className="shop-delivery-badge">
                                <span>📄</span>
                                {getDeliveryNote(product)?.toUpperCase() ?? t('modalBadge')}
                            </p>

                            <h2 className="body-product-name">
                                {getProductName(product)}
                            </h2>

                            <p className="body-product-desc">
                                {getProductDesc(product)}
                            </p>

                            <p className="body-product-pdf">
                                📄 {getDeliveryNote(product)}
                            </p>

                            <div className="body-product-bottom">
                                <div className="body-price-row">
                                    <span className="body-product-price">
                                        {formatPrice(product.priceGBP)}
                                    </span>
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
                                        ? t('loading')
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
                            📄 {t('modalBadge')}
                        </p>

                        <h2 className="body-modal-title">
                            {getProductName(selectedProduct)}
                        </h2>

                        {getIncludes(selectedProduct).length > 0 && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">
                                    {t('includesLabel')}
                                </p>

                                <ul className="body-modal-list">
                                    {getIncludes(selectedProduct).map((item, i) => (
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
