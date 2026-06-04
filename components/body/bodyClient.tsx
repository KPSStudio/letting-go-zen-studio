// components/body/BodyClient.tsx
// Client component — handles translations, cart and modal
// Receives products from server component

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/lib/CurrencyContext'
import { useCart } from '@/lib/CartContext'
import { SanityService } from '@/sanity/lib/sanity'

interface Props {
    products: SanityService[]
    locale: string
}

export default function bodyClient({ products, locale }: Props) {
    const t = useTranslations('body')
    const { currency, formatPrice } = useCurrency()
    const { addItem, items } = useCart()
    const [selectedProduct, setSelectedProduct] = useState<SanityService | null>(null)

    function handleAddToCart(product: SanityService) {
        addItem({
            id: product._id,
            name: product.namePl,
            type: product.type,
            gbp: product.priceGBP,
            pln: product.pricePLN ?? Math.round(product.priceGBP * 5.2),
        })
    }

    // Pick name and description based on locale
    function getProductName(product: SanityService) {
        return locale === 'en' && product.nameEn ? product.nameEn : product.namePl
    }

    function getProductDesc(product: SanityService) {
        return locale === 'en' && product.descEn ? product.descEn : product.descPl
    }

    return (
        <main className="body-page">

            <Link href="/" className="body-back-link">
                {t('back')}
            </Link>

            <section className="body-header">
                <h1 className="body-title">
                    {t('titleMain')} <span>{t('titleGold')}</span>
                </h1>
                <p className="body-intro">{t('intro')}</p>
                <p className="body-count">
                    {t('count', { count: products.length })}
                </p>
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
                        {t('emptyState')}
                    </p>
                </div>
            )}

            {products.length > 0 && (
                <section className="body-product-grid">
                    {products.map(product => {
                        const inCart = items.some(i => i.id === product._id)
                        return (
                            <article key={product._id} className="body-product-card">

                                <h2 className="body-product-name">{getProductName(product)}</h2>

                                <p className="body-product-desc">{getProductDesc(product)}</p>

                                {product.pdfNote && (
                                    <p className="body-product-pdf">📄 {product.pdfNote}</p>
                                )}

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
                                        onClick={() => handleAddToCart(product)}
                                        className={`body-cart-button ${inCart ? 'body-cart-button-added' : ''}`}
                                    >
                                        {inCart ? t('inCart') : t('addToCartShort')}
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

                        <h2 className="body-modal-title">{getProductName(selectedProduct)}</h2>

                        <p className="body-modal-meta">
                            {selectedProduct.type === 'pakiet' ? t('package') : t('session')} · {selectedProduct.duration}
                        </p>

                        {selectedProduct.freeConsultation && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">✓ {selectedProduct.freeConsultation}</p>
                            </div>
                        )}

                        {selectedProduct.availability && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">📍 {t('availability')}</p>
                                <p className="body-modal-text">{selectedProduct.availability}</p>
                            </div>
                        )}

                        {selectedProduct.includes && selectedProduct.includes.length > 0 && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">{t('includes')}</p>
                                <ul className="body-modal-list">
                                    {selectedProduct.includes.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedProduct.whoFor && selectedProduct.whoFor.length > 0 && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">{t('whoFor')}</p>
                                <ul className="body-modal-list">
                                    {selectedProduct.whoFor.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedProduct.warning && (
                            <div className="body-warning-box">
                                <p className="body-modal-label">⚠️ {t('importantInfo')}</p>
                                <p className="body-warning-text">{selectedProduct.warning}</p>
                            </div>
                        )}

                        <div className="body-modal-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    handleAddToCart(selectedProduct)
                                    setSelectedProduct(null)
                                }}
                                className="body-modal-cart-button"
                            >
                                {t('addToCartFull')} · {formatPrice(selectedProduct.priceGBP)}
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