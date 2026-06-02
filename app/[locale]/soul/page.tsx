// app/[locale]/soul/page.tsx
// Dusza / Soul page.
// Product names stay Polish, but all visible support text translates with next-intl.

'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useCurrency } from '@/lib/CurrencyContext'
import { useCart } from '@/lib/CartContext'

type ProductType = 'sesja' | 'pakiet' | 'ebook'

type Product = {
    id: string
    namePl: string
    descKey: string
    pdfNoteKey: string | null
    gbp: number
    pln: number
    type: ProductType
    durationKey: string
    availabilityKey: string
    includesKey: string
    whoForKey: string
    warningKey: string | null
}

const soulProducts: Product[] = [
    {
        id: 'soul-1',
        namePl: 'Pakiet Jasność Umysłu',
        descKey: 'products.soul1.desc',
        pdfNoteKey: 'products.soul1.pdfNote',
        gbp: 60,
        pln: 310,
        type: 'sesja',
        durationKey: 'products.soul1.duration',
        availabilityKey: 'products.soul1.availability',
        includesKey: 'products.soul1.includes',
        whoForKey: 'products.soul1.whoFor',
        warningKey: 'products.soul1.warning',
    },
    {
        id: 'soul-2',
        namePl: 'Przeznaczenie — Raport PDF',
        descKey: 'products.soul2.desc',
        pdfNoteKey: 'products.soul2.pdfNote',
        gbp: 60,
        pln: 310,
        type: 'ebook',
        durationKey: 'products.soul2.duration',
        availabilityKey: 'products.soul2.availability',
        includesKey: 'products.soul2.includes',
        whoForKey: 'products.soul2.whoFor',
        warningKey: 'products.soul2.warning',
    },
    {
        id: 'soul-3',
        namePl: 'Zdjęcie i Analiza Aury + Chakr',
        descKey: 'products.soul3.desc',
        pdfNoteKey: null,
        gbp: 30,
        pln: 155,
        type: 'sesja',
        durationKey: 'products.soul3.duration',
        availabilityKey: 'products.soul3.availability',
        includesKey: 'products.soul3.includes',
        whoForKey: 'products.soul3.whoFor',
        warningKey: null,
    },
]

export default function SoulPage() {
    const t = useTranslations('soul')
    const locale = useLocale()
    const { currency, formatPrice } = useCurrency()
    const { addItem, items } = useCart()
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    function handleAddToCart(product: Product) {
        addItem({
            id: product.id,
            name: product.namePl,
            type: product.type,
            gbp: product.gbp,
            pln: product.pln,
        })
    }

    function getTypeLabel(type: ProductType): string {
        if (type === 'pakiet') {
            return t('type.package')
        }

        if (type === 'ebook') {
            return t('type.pdf')
        }

        return t('type.session')
    }

    return (
        <main className="body-page">
            <Link href={`/${locale}`} className="body-back-link">
                {t('back')}
            </Link>

            <section className="body-header">
                <h1 className="body-title">
                    {t('titleStart')} <span>{t('titleGold')}</span>
                </h1>

                <p className="body-intro">
                    {t('intro')}
                </p>

                <p className="body-count">
                    {soulProducts.length} {t('serviceCount')}
                </p>
            </section>

            <section className="body-info-banner">
                <span className="body-info-banner-icon">📄</span>

                <p className="body-info-banner-text">
                    <span>{t('bannerStrong')} </span>
                    {t('bannerText')}
                </p>
            </section>

            <section className="body-product-grid">
                {soulProducts.map((product) => {
                    const inCart = items.some((item) => item.id === product.id)

                    return (
                        <article key={product.id} className="body-product-card">
                            <h2 className="body-product-name">
                                {product.namePl}
                            </h2>

                            <p className="body-product-desc">
                                {t(product.descKey)}
                            </p>

                            {product.pdfNoteKey && (
                                <p className="body-product-pdf">
                                    📄 {t(product.pdfNoteKey)}
                                </p>
                            )}

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

                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className={`body-cart-button ${inCart ? 'body-cart-button-added' : ''}`}
                                >
                                    {inCart ? t('button.inCart') : t('button.addToCart')}
                                </button>

                                <button
                                    onClick={() => setSelectedProduct(product)}
                                    className="body-info-button"
                                >
                                    {t('button.moreInfo')}
                                </button>
                            </div>
                        </article>
                    )
                })}
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

                        <h2 className="body-modal-title">
                            {selectedProduct.namePl}
                        </h2>

                        <p className="body-modal-meta">
                            {getTypeLabel(selectedProduct.type)} · {t(selectedProduct.durationKey)}
                        </p>

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                📍 {t('modal.availability')}
                            </p>

                            <p className="body-modal-text">
                                {t(selectedProduct.availabilityKey)}
                            </p>
                        </div>

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                {t('modal.includes')}
                            </p>

                            <ul className="body-modal-list">
                                {t.raw(selectedProduct.includesKey).map((item: string) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                {t('modal.whoFor')}
                            </p>

                            <ul className="body-modal-list">
                                {t.raw(selectedProduct.whoForKey).map((item: string) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        {selectedProduct.warningKey && (
                            <div className="body-warning-box">
                                <p className="body-modal-label">
                                    ⚠️ {t('modal.warning')}
                                </p>

                                <p className="body-warning-text">
                                    {t(selectedProduct.warningKey)}
                                </p>
                            </div>
                        )}

                        <div className="body-modal-actions">
                            <button
                                onClick={() => {
                                    handleAddToCart(selectedProduct)
                                    setSelectedProduct(null)
                                }}
                                className="body-modal-cart-button"
                            >
                                {t('button.addToCartFull')} · {formatPrice(selectedProduct.gbp)}
                            </button>

                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="body-modal-secondary-button"
                            >
                                {t('button.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}