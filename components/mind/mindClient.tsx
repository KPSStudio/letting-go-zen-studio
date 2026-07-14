'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useCurrency } from '@/lib/CurrencyContext'
import { useCart } from '@/lib/CartContext'
import { SanityService } from '@/sanity/lib/sanity'
import { getCalSlug } from '@/lib/calcom'

interface Props {
    products: SanityService[]
}

export default function MindClient({ products }: Props) {
    const t = useTranslations('mindPage')
    const locale = useLocale()
    const { formatPrice } = useCurrency()
    const { addItem, items } = useCart()
    const [selectedProduct, setSelectedProduct] = useState<SanityService | null>(null)

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

    function handleAddToCart(product: SanityService) {
        addItem({
            id: product._id,
            name: product.namePl,
            type: product.type,
            gbp: product.priceGBP,
            pln: product.pricePLN ?? Math.round(product.priceGBP * 5.2),
        })
    }

    function getProductName(product: SanityService) {
        return locale === 'en' && product.nameEn ? product.nameEn : product.namePl
    }

    function getProductDesc(product: SanityService) {
        return locale === 'en' && product.descEn ? product.descEn : product.descPl
    }

    function getConsentHref(product: SanityService) {
        const serviceSlug = product.calComSlug ?? getCalSlug(product.namePl) ?? ''
        const serviceName = product.namePl
        const price = product.priceGBP.toString()

        return `/${locale}/zgoda-rezerwacja?service=${encodeURIComponent(serviceSlug)}&serviceName=${encodeURIComponent(serviceName)}&price=${price}&locale=${locale}`
    }

    return (
        <main className="body-page">
            <Link href="/" className="body-back-link">
                {t('back')}
            </Link>

            <section className="body-header">
                <h1 className="body-title">
                    {t('titleBefore')} <span>{t('titleGold')}</span>
                </h1>

                <p className="body-intro">{t('intro')}</p>

                <p className="body-count">
                    {products.length} {t('serviceCount', { count: products.length })}
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
                        Wkrótce...
                    </p>
                </div>
            )}

            {products.length > 0 && (
                <section className="body-product-grid">
                    {products.map((product) => {
                        const inCart = items.some((i) => i.id === product._id)

                        return (
                            <article
                                key={product._id}
                                id={`item-${product._id}`}
                                className="body-product-card"
                            >
                                <h2 className="body-product-name">
                                    {getProductName(product)}
                                </h2>

                                <p className="body-product-desc">
                                    {getProductDesc(product)}
                                </p>

                                {product.pdfNote && (
                                    <p className="body-product-pdf">
                                        📄 {product.pdfNote}
                                    </p>
                                )}

                                <div className="body-product-bottom">
                                    <div className="body-price-row">
                                        <span className="body-product-price">
                                            {formatPrice(product.priceGBP)}
                                        </span>
                                    </div>

                                    {product.requiresBooking ? (
                                        <Link
                                            href={getConsentHref(product)}
                                            className="body-cart-button"
                                            style={{
                                                display: 'block',
                                                textAlign: 'center',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            ZAREZERWUJ
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleAddToCart(product)}
                                            className={`body-cart-button ${
                                                inCart ? 'body-cart-button-added' : ''
                                            }`}
                                        >
                                            {inCart
                                                ? t('buttons.inCart')
                                                : t('buttons.addToCart')}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setSelectedProduct(product)}
                                        className="body-info-button"
                                    >
                                        {t('buttons.moreInfo')}
                                    </button>
                                </div>
                            </article>
                        )
                    })}
                </section>
            )}

            {selectedProduct && (
                <div
                    onClick={() => setSelectedProduct(null)}
                    className="body-modal-backdrop"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="body-modal-panel"
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedProduct(null)}
                            className="body-modal-close"
                        >
                            ×
                        </button>

                        <h2 className="body-modal-title">
                            {getProductName(selectedProduct)}
                        </h2>

                        <p className="body-modal-meta">
                            {selectedProduct.type === 'pakiet'
                                ? t('types.package')
                                : t('types.session')}{' '}
                            · {selectedProduct.duration}
                        </p>

                        {selectedProduct.freeConsultation && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">
                                    ✓ {selectedProduct.freeConsultation}
                                </p>
                            </div>
                        )}

                        {selectedProduct.availability && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">
                                    📍 {t('modal.availability')}
                                </p>
                                <p className="body-modal-text">
                                    {selectedProduct.availability}
                                </p>
                            </div>
                        )}

                        {selectedProduct.includes &&
                            selectedProduct.includes.length > 0 && (
                                <div className="body-modal-section">
                                    <p className="body-modal-label">
                                        {t('modal.includes')}
                                    </p>
                                    <ul className="body-modal-list">
                                        {selectedProduct.includes.map(
                                            (item: string, i: number) => (
                                                <li key={i}>{item}</li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}

                        {selectedProduct.whoFor &&
                            selectedProduct.whoFor.length > 0 && (
                                <div className="body-modal-section">
                                    <p className="body-modal-label">
                                        {t('modal.whoFor')}
                                    </p>
                                    <ul className="body-modal-list">
                                        {selectedProduct.whoFor.map(
                                            (item: string, i: number) => (
                                                <li key={i}>{item}</li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}

                        {selectedProduct.warning && (
                            <div className="body-warning-box">
                                <p className="body-modal-label">
                                    ⚠️ {t('modal.warning')}
                                </p>
                                <p className="body-warning-text">
                                    {selectedProduct.warning}
                                </p>
                            </div>
                        )}

                        <div className="body-modal-actions">
                            {selectedProduct.requiresBooking ? (
                                <Link
                                    href={getConsentHref(selectedProduct)}
                                    className="body-modal-cart-button"
                                    onClick={() => setSelectedProduct(null)}
                                >
                                    ZAREZERWUJ · {formatPrice(selectedProduct.priceGBP)}
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAddToCart(selectedProduct)
                                        setSelectedProduct(null)
                                    }}
                                    className="body-modal-cart-button"
                                >
                                    {t('buttons.addToCartLong', {
                                        price: formatPrice(selectedProduct.priceGBP),
                                    })}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setSelectedProduct(null)}
                                className="body-modal-secondary-button"
                            >
                                {t('buttons.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}