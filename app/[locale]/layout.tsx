// app/[locale]/layout.tsx
// Wraps every page with language, currency and cart providers

import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import '../globals.css'
import UtilityBar from '@/components/layout/UtilityBar'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import SiteLightRay from '@/components/layout/SiteLightRay'
import { CurrencyProvider } from '@/lib/CurrencyContext'
import { CartProvider } from '@/lib/CartContext'
import { getServicesByCategory, getSklepProducts } from '@/sanity/lib/sanity'
import type { SearchItem } from '@/components/layout/NavSearch'
import { SITE_BASE_URL, SITE_NAME } from '@/lib/pageMetadata'

// Fonts (Marcellus for headings, Montserrat for body) are loaded in
// globals.css and assigned to --font-cinzel / --font-raleway there. We used to
// also pull Cinzel/Raleway through next/font, but the CSS overrode them, so
// they downloaded for nothing — removed.

// Only site-wide defaults live here now.
//
// This layout used to declare the full homepage metadata — title, description
// AND a canonical of `${baseUrl}/${locale}`. Because Next.js inherits layout
// metadata into any child route that does not declare its own, every page on
// the site served the homepage title and a canonical pointing at the homepage.
// Each route now owns its metadata via lib/pageMetadata.ts, and this layout
// keeps only what genuinely is site-wide.
export const metadata: Metadata = {
    metadataBase: new URL(SITE_BASE_URL),
    title: {
        // Used only if a route somehow declares no title of its own.
        default: SITE_NAME,
        template: `%s`,
    },
    applicationName: SITE_NAME,
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

            {/* Site-wide ray of warm light, drawn purely with CSS gradients on
                .site-light-ray::before. It sits between the background gradient
                (z-index -3) and the sparkle layer (-1), so it is always beneath
                every piece of content. Decorative only, so it is hidden from
                assistive tech. Rendered here rather than in the root layout so
                that /studio — which has its own layout — is untouched.

                The component adds a desktop-only scroll parallax; on phones and
                under reduced motion it renders the same inert div as before. */}
            <SiteLightRay />

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