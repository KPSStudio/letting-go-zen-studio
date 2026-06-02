// app/[locale]/sklep/page.tsx
// Sklep page — shows digital products with instant-download checkout placeholder.
// All visible text comes from next-intl so the PL/EN button can translate it.

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/lib/CurrencyContext'

// This type defines the shape of one digital shop product.
interface SklepProduct {
    id: string
    namePl: string
    descKey: string
    deliveryNoteKey: string
    gbp: number
    pln: number
    includesKeys: string[]
}

// Product names stay in Polish.
// Descriptions and bullet points use translation keys.
const sklepProducts: SklepProduct[] = [
    {
        id: 'sklep-1',
        namePl: 'Przewodnik Energetyczny — PDF',
        descKey: 'products.energyGuide.desc',
        deliveryNoteKey: 'products.energyGuide.deliveryNote',
        gbp: 15,
        pln: 78,
        includesKeys: [
            'products.energyGuide.includes.energy',
            'products.energyGuide.includes.chakras',
            'products.energyGuide.includes.practice',
            'products.energyGuide.includes.instantPdf',
        ],
    },
]

export default function SklepPage() {
    const t = useTranslations('sklep')
    const { currency, formatPrice } = useCurrency()
    const [selectedProduct, setSelectedProduct] = useState<SklepProduct | null>(null)

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

            <section className="body-product-grid">
                {sklepProducts.map((product) => (
                    <article key={product.id} className="body-product-card">
                        <p className="shop-delivery-badge">
                            <span>📄</span>
                            {t(product.deliveryNoteKey).toUpperCase()}
                        </p>

                        <h2 className="body-product-name">
                            {product.namePl}
                        </h2>

                        <p className="body-product-desc">
                            {t(product.descKey)}
                        </p>

                        <p className="body-product-pdf">
                            📄 {t(product.deliveryNoteKey)}
                        </p>

                        <div className="body-product-bottom">
                            <div className="body-price-row">
                                <span className="body-product-price">
                                    {formatPrice(product.gbp)}
                                </span>

                                {currency !== 'PLN' && (
                                    <span className="body-product-price-note">
                                        ≈ zł{product.pln}
                                    </span>
                                )}
                            </div>

                            <button className="shop-buy-button">
                                🔒 {t('buyNow')} — {formatPrice(product.gbp)}
                            </button>

                            <button
                                onClick={() => setSelectedProduct(product)}
                                className="body-info-button"
                            >
                                {t('moreInfo')}
                            </button>
                        </div>
                    </article>
                ))}
            </section>

            {selectedProduct && (
                <div
                    onClick={() => setSelectedProduct(null)}
                    className="body-modal-backdrop"
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="body-modal-panel"
                    >
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="body-modal-close"
                        >
                            ×
                        </button>

                        <p className="shop-modal-badge">
                            📄 {t('modalBadge')}
                        </p>

                        <h2 className="body-modal-title">
                            {selectedProduct.namePl}
                        </h2>

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                {t('includesLabel')}
                            </p>

                            <ul className="body-modal-list">
                                {selectedProduct.includesKeys.map((itemKey) => (
                                    <li key={itemKey}>{t(itemKey)}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="body-modal-actions">
                            <button className="shop-modal-buy-button">
                                🔒 {t('buyNow')} — {formatPrice(selectedProduct.gbp)}
                            </button>

                            <button
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