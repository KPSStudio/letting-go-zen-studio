// components/home/ShopCta.tsx
//
// A supporting call-to-action for the online shop, placed AFTER the Body /
// Mind / Soul trio.
//
// It is deliberately not a fourth pillar. Ciało · Umysł · Dusza is a conceptual
// trio — adding a shop tile beside them would both break that idea and imply
// the shop is a fourth kind of therapy. So this reads as a different thing at a
// different rhythm: one line of gold rule, a glyph, a short pitch and a link.
//
// No box. The rule above it and the spacing around it are the separation.

'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ShopIcon } from './PillarIcons'
import { useEntranceReveal } from '@/lib/useEntranceReveal'

const REVEAL_STEPS = ['.shop-cta-inner']
const DRAW_SELECTOR = '.shop-cta-icon svg path, .shop-cta-icon svg circle, .shop-cta-icon svg rect'

export default function ShopCta() {
    const t = useTranslations('home.shopCta')
    const locale = useLocale()

    const sectionRef = useRef<HTMLElement | null>(null)
    useEntranceReveal(sectionRef, {
        steps: REVEAL_STEPS,
        drawSelector: DRAW_SELECTOR,
        shift: 10,
    })

    return (
        <section className="shop-cta" aria-labelledby="shop-cta-title" ref={sectionRef}>
            <div className="shop-cta-inner">
                {/* Decorative: the heading beside it names the shop. */}
                <span className="shop-cta-icon" aria-hidden="true">
                    <ShopIcon />
                </span>

                <div className="shop-cta-body">
                    <p className="shop-cta-label">{t('label')}</p>

                    <h2 id="shop-cta-title" className="shop-cta-title">
                        {t('title')}
                    </h2>

                    <p className="shop-cta-text">{t('text')}</p>
                </div>

                <Link href={`/${locale}/sklep`} className="shop-cta-button">
                    {t('button')}
                </Link>
            </div>
        </section>
    )
}
