// app/[locale]/mind/page.tsx
// Umysł / Mind page.
// This page uses next-intl so all visible text changes when PL / EN is selected.

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/lib/CurrencyContext'
import { useCart } from '@/lib/CartContext'

type ProductType = 'sesja' | 'pakiet' | 'ebook'

interface Product {
    id: string
    gbp: number
    pln: number
    type: ProductType
    duration: string
    availability: string
    hasFreeConsultation: boolean
    hasPdfNote: boolean
    hasWarning: boolean
}

interface MindProductCopy {
    name: string
    desc: string
    pdfNote: string | null
    freeConsultation: string | null
    includes: string[]
    whoFor: string[]
    warning: string | null
}

const mindProducts: Product[] = [
    {
        id: 'mind-1',
        gbp: 120,
        pln: 625,
        type: 'sesja',
        duration: '2-3h',
        availability: 'Studio | Online',
        hasFreeConsultation: true,
        hasPdfNote: false,
        hasWarning: true,
    },
    {
        id: 'mind-2',
        gbp: 60,
        pln: 310,
        type: 'sesja',
        duration: '1h',
        availability: 'Online | Studio',
        hasFreeConsultation: false,
        hasPdfNote: false,
        hasWarning: false,
    },
    {
        id: 'mind-3',
        gbp: 30,
        pln: 155,
        type: 'sesja',
        duration: '30 min',
        availability: 'Studio | Online',
        hasFreeConsultation: false,
        hasPdfNote: false,
        hasWarning: false,
    },
    {
        id: 'mind-4',
        gbp: 120,
        pln: 625,
        type: 'pakiet',
        duration: '5 x 30 min',
        availability: 'Studio | Online',
        hasFreeConsultation: false,
        hasPdfNote: false,
        hasWarning: false,
    },
]

export default function MindPage() {
    const t = useTranslations('mindPage')
    const { currency, formatPrice } = useCurrency()
    const { addItem, items } = useCart()
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    function getProductCopy(productId: string): MindProductCopy {
        return t.raw(`products.${productId}`) as MindProductCopy
    }

    function handleAddToCart(product: Product) {
        const copy = getProductCopy(product.id)

        addItem({
            id: product.id,
            name: copy.name,
            type: product.type,
            gbp: product.gbp,
            pln: product.pln,
        })
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

                <p className="body-intro">
                    {t('intro')}
                </p>

                <p className="body-count">
                    {t('serviceCount', { count: mindProducts.length })}
                </p>
            </section>

            <section className="body-product-grid">
                {mindProducts.map((product) => {
                    const inCart = items.some((item) => item.id === product.id)
                    const copy = getProductCopy(product.id)

                    return (
                        <article key={product.id} className="body-product-card">
                            <h2 className="body-product-name">
                                {copy.name}
                            </h2>

                            <p className="body-product-desc">
                                {copy.desc}
                            </p>

                            {product.hasPdfNote && copy.pdfNote && (
                                <p className="body-product-pdf">
                                    📄 {copy.pdfNote}
                                </p>
                            )}

                            {product.hasFreeConsultation && copy.freeConsultation && (
                                <p className="body-product-pdf">
                                    ✓ {copy.freeConsultation}
                                </p>
                            )}

                            <div className="body-product-bottom">
                                <div className="body-price-row">
                                    <span className="body-product-price">
                                        {formatPrice(product.gbp)}
                                    </span>

                                    {currency !== 'PLN' && (
                                        <span className="body-product-price-note">
                                            {t('approxPln', { amount: product.pln })}
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className={`body-cart-button ${inCart ? 'body-cart-button-added' : ''}`}
                                >
                                    {inCart ? t('buttons.inCart') : t('buttons.addToCart')}
                                </button>

                                <button
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
                            {getProductCopy(selectedProduct.id).name}
                        </h2>

                        <p className="body-modal-meta">
                            {selectedProduct.type === 'pakiet' ? t('types.package') : t('types.session')} · {selectedProduct.duration}
                        </p>

                        {selectedProduct.hasFreeConsultation && getProductCopy(selectedProduct.id).freeConsultation && (
                            <div className="body-warning-box">
                                <p className="body-modal-label">
                                    ✓ {t('modal.consultation')}
                                </p>

                                <p className="body-warning-text">
                                    {getProductCopy(selectedProduct.id).freeConsultation}
                                </p>
                            </div>
                        )}

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                📍 {t('modal.availability')}
                            </p>

                            <p className="body-modal-text">
                                {selectedProduct.availability}
                            </p>
                        </div>

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                {t('modal.includes')}
                            </p>

                            <ul className="body-modal-list">
                                {getProductCopy(selectedProduct.id).includes.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                {t('modal.whoFor')}
                            </p>

                            <ul className="body-modal-list">
                                {getProductCopy(selectedProduct.id).whoFor.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        {selectedProduct.hasWarning && getProductCopy(selectedProduct.id).warning && (
                            <div className="body-warning-box">
                                <p className="body-modal-label">
                                    ⚠️ {t('modal.warning')}
                                </p>

                                <p className="body-warning-text">
                                    {getProductCopy(selectedProduct.id).warning}
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
                                {t('buttons.addToCartLong', {
                                    price: formatPrice(selectedProduct.gbp),
                                })}
                            </button>

                            <button
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