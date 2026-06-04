'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useCurrency } from '@/lib/CurrencyContext'
import { SanitySklepProduct } from '@/sanity/lib/sanity'

interface Props {
    products: SanitySklepProduct[]
}

export default function SklepClient({ products }: Props) {
    const t = useTranslations('sklep')
    const locale = useLocale()
    const { currency, formatPrice } = useCurrency()
    const [selectedProduct, setSelectedProduct] = useState<SanitySklepProduct | null>(null)

    function getProductName(product: SanitySklepProduct) {
        return locale === 'en' && product.nameEn ? product.nameEn : product.namePl
    }

    function getProductDesc(product: SanitySklepProduct) {
        return locale === 'en' && product.descEn ? product.descEn : product.descPl
    }

    return (
        <main className="body-page">

            {/* Page label */}
            <p className="shop-label">
                <span />
                {t('label')}
            </p>

            {/* Page hero */}
            <section className="body-header">
                <h1 className="body-title">
                    {t('titleMain')} <span>{t('titleGold')}</span>
                </h1>
                <p className="body-intro">{t('intro')}</p>
            </section>

            {/* Empty state */}
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

            {/* Product grid */}
            {products.length > 0 && (
                <div className="body-product-grid">
                    {products.map(product => (
                        <article key={product._id} className="body-product-card">

                            {/* Delivery badge */}
                            <p className="shop-delivery-badge">
                                <span>📄</span>
                                {product.deliveryNote?.toUpperCase() ?? t('label')}
                            </p>

                            <h2 className="body-product-name">{getProductName(product)}</h2>

                            <p className="body-product-desc">{getProductDesc(product)}</p>

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

                                {/* Buy Now — gold filled button */}
                                <button
                                    type="button"
                                    className="shop-buy-button"
                                >
                                    🔒 {t('buyNow')} — {formatPrice(product.priceGBP)}
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

            {/* Modal */}
            {selectedProduct && (
                <div onClick={() => setSelectedProduct(null)} className="body-modal-backdrop">
                    <div onClick={e => e.stopPropagation()} className="body-modal-panel">
                        <button type="button" onClick={() => setSelectedProduct(null)} className="body-modal-close">×</button>

                        <p className="shop-modal-badge">
                            <span>📄</span>
                            {t('modalBadge').toUpperCase()}
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
                            <button type="button" className="shop-modal-buy-button">
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