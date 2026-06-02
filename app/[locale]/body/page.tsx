// app/[locale]/body/page.tsx
// Ciało / Body page.
// Product text comes from messages/pl.json and messages/en.json.
// Product names stay Polish in both languages.

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/lib/CurrencyContext'
import { useCart } from '@/lib/CartContext'

type ProductType = 'sesja' | 'pakiet'

interface ProductText {
    id: string
    namePl: string
    desc: string
    pdfNote: string | null
    pdfDelivery: string | null
    type: ProductType
    duration: string
    availability: string
    includes: string[]
    whoFor: string[]
    warning: string | null
}

interface ProductPrice {
    id: string
    gbp: number
    pln: number
}

type Product = ProductText & ProductPrice

const productPrices: ProductPrice[] = [
    { id: 'body-1', gbp: 60, pln: 310 },
    { id: 'body-2', gbp: 80, pln: 415 },
    { id: 'body-3', gbp: 30, pln: 155 },
    { id: 'body-4', gbp: 30, pln: 155 },
    { id: 'body-5', gbp: 60, pln: 310 },
    { id: 'body-6', gbp: 30, pln: 155 },
    { id: 'body-7', gbp: 50, pln: 260 },
    { id: 'body-8', gbp: 120, pln: 625 },
    { id: 'body-9', gbp: 180, pln: 935 },
]

export default function BodyPage() {
    const t = useTranslations('body')
    const { currency, formatPrice } = useCurrency()
    const { addItem, items } = useCart()
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    const productTexts = t.raw('products') as ProductText[]

    const bodyProducts: Product[] = productTexts.map((productText) => {
        const price = productPrices.find((productPrice) => productPrice.id === productText.id)

        if (!price) {
            throw new Error(`Missing price for product: ${productText.id}`)
        }

        return {
            ...productText,
            ...price,
        }
    })

    function handleAddToCart(product: Product) {
        addItem({
            id: product.id,
            name: product.namePl,
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
                    {t('titleMain')} <span>{t('titleGold')}</span>
                </h1>

                <p className="body-intro">
                    {t('intro')}
                </p>

                <p className="body-count">
                    {t('count', { count: bodyProducts.length })}
                </p>
            </section>

            <section className="body-product-grid">
                {bodyProducts.map((product) => {
                    const inCart = items.some((item) => item.id === product.id)

                    return (
                        <article key={product.id} className="body-product-card">
                            <h2 className="body-product-name">
                                {product.namePl}
                            </h2>

                            <p className="body-product-desc">
                                {product.desc}
                            </p>

                            {product.pdfNote && (
                                <p className="body-product-pdf">
                                    📄 {product.pdfNote}
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
                                    {inCart ? t('inCart') : t('addToCartShort')}
                                </button>

                                <button
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
                            {selectedProduct.type === 'pakiet' ? t('package') : t('session')} · {selectedProduct.duration}
                        </p>

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                📍 {t('availability')}
                            </p>

                            <p className="body-modal-text">
                                {selectedProduct.availability}
                            </p>
                        </div>

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                {t('includes')}
                            </p>

                            <ul className="body-modal-list">
                                {selectedProduct.includes.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="body-modal-section">
                            <p className="body-modal-label">
                                {t('whoFor')}
                            </p>

                            <ul className="body-modal-list">
                                {selectedProduct.whoFor.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        {selectedProduct.pdfDelivery && (
                            <div className="body-modal-section">
                                <p className="body-modal-label">
                                    📄 {t('pdfDelivery')}
                                </p>

                                <p className="body-modal-text">
                                    {selectedProduct.pdfDelivery}
                                </p>
                            </div>
                        )}

                        {selectedProduct.warning && (
                            <div className="body-warning-box">
                                <p className="body-modal-label">
                                    ⚠️ {t('importantInfo')}
                                </p>

                                <p className="body-warning-text">
                                    {selectedProduct.warning}
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
                                {t('addToCartFull')} · {formatPrice(selectedProduct.gbp)}
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