// app/[locale]/layout.tsx
// Wraps every page with language, currency and cart providers

import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import '../globals.css'
import UtilityBar from '@/components/layout/UtilityBar'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import { CurrencyProvider } from '@/lib/CurrencyContext'
import { CartProvider } from '@/lib/CartContext'
import { getServicesByCategory, getSklepProducts } from '@/sanity/lib/sanity'
import type { SearchItem } from '@/components/layout/NavSearch'

// Fonts (Marcellus for headings, Montserrat for body) are loaded in
// globals.css and assigned to --font-cinzel / --font-raleway there. We used to
// also pull Cinzel/Raleway through next/font, but the CSS overrode them, so
// they downloaded for nothing — removed.

export async function generateMetadata({
                                                   params,
                                               }: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const baseUrl = 'https://www.lettinggozenstudio.com'
    const activeLocale = locale === 'en' ? 'en' : 'pl'
    const canonicalUrl = `${baseUrl}/${activeLocale}`

    const metadataByLocale = {
        pl: {
            title: 'Letting Go Zen Studio | Holistyczne sesje terapeutyczne w UK',
            description: 'Letting Go Zen Studio oferuje holistyczne sesje Ciało, Umysł i Dusza dla osób szukających wsparcia, równowagi i pracy ze stresem w UK.',
            keywords: [
                'Letting Go Zen Studio',
                'holistyczne sesje UK',
                'terapia holistyczna Aberdeen',
                'hipnoterapia UK',
                'EFT UK',
                'biorezonans UK',
                'biofeedback UK',
                'wellbeing UK',
            ],
            openGraphLocale: 'pl_PL',
        },
        en: {
            title: 'Letting Go Zen Studio | Holistic Wellness Sessions in the UK',
            description: 'Letting Go Zen Studio offers holistic Body, Mind and Soul sessions for people seeking support, balance and stress relief in the UK.',
            keywords: [
                'Letting Go Zen Studio',
                'holistic wellness UK',
                'holistic therapy Aberdeen',
                'hypnotherapy UK',
                'EFT UK',
                'bioresonance UK',
                'biofeedback UK',
                'stress relief UK',
            ],
            openGraphLocale: 'en_GB',
        },
    }

    const metadata = metadataByLocale[activeLocale]

    return {
        metadataBase: new URL(baseUrl),
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        openGraph: {
            title: metadata.title,
            description: metadata.description,
            url: canonicalUrl,
            siteName: 'Letting Go Zen Studio',
            locale: metadata.openGraphLocale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: metadata.title,
            description: metadata.description,
        },
        robots: {
            index: true,
            follow: true,
        },
        alternates: {
            canonical: canonicalUrl,
            languages: {
                pl: `${baseUrl}/pl`,
                en: `${baseUrl}/en`,
                'x-default': `${baseUrl}/pl`,
            },
        },
    }
}

export default async function LocaleLayout({
                                               children,
                                           }: {
    children: React.ReactNode
}) {
    // The active locale is resolved by next-intl from the request; getMessages()
    // and the root <html lang> both rely on that, so we don't need it here.
    const messages = await getMessages()

    // Build the site-wide search index (bookable services + shop products).
    // Fetched here so the nav search has data on every page. Wrapped in
    // try/catch so a Sanity hiccup can never take down the whole layout.
    let searchItems: SearchItem[] = []
    try {
        const [bodyServices, mindServices, soulServices, sklepProducts] =
            await Promise.all([
                getServicesByCategory('body'),
                getServicesByCategory('mind'),
                getServicesByCategory('soul'),
                getSklepProducts(),
            ])

        const serviceSearchItems: SearchItem[] = [
            ...bodyServices,
            ...mindServices,
            ...soulServices,
        ]
            .filter(service => service.requiresBooking)
            .map((service): SearchItem => ({
                id: service._id,
                namePl: service.namePl,
                nameEn: service.nameEn,
                descPl: service.descPl,
                descEn: service.descEn,
                includes: service.includes,
                kind: 'service',
                category: service.category,
                href: `/${service.category}`,
            }))

        const productSearchItems: SearchItem[] = sklepProducts.map(
            (product): SearchItem => ({
                id: product._id,
                namePl: product.namePl,
                nameEn: product.nameEn,
                descPl: product.descPl,
                descEn: product.descEn,
                keywords: product.keywords,
                includes: product.includes,
                kind: 'product',
                href: '/sklep',
            })
        )

        searchItems = [...serviceSearchItems, ...productSearchItems]
    } catch {
        searchItems = []
    }

    // No <html>/<body> here — the root layout owns those. We only provide the
    // site chrome and providers, which render inside the root's <body>.
    return (
        <>
            {/* Fixed full-screen background layer — styled by .site-background in globals.css.
                A real fixed element renders correctly on mobile, unlike background-attachment: fixed. */}
            <div className="site-background" aria-hidden="true" />
            <NextIntlClientProvider messages={messages}>
                <CurrencyProvider>
                    <CartProvider>
                        <UtilityBar />
                        <Nav searchItems={searchItems} />
                        <main className="flex-1">
                            {children}
                        </main>
                        <Footer />
                    </CartProvider>
                </CurrencyProvider>
            </NextIntlClientProvider>
        </>
    )
}