// app/[locale]/layout.tsx
// Wraps every page with language, currency and cart providers

import type { Metadata } from 'next'
import { Cinzel, Raleway } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import '../globals.css'
import UtilityBar from '@/components/layout/UtilityBar'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import { CurrencyProvider } from '@/lib/CurrencyContext'
import { CartProvider } from '@/lib/CartContext'

const cinzel = Cinzel({
    variable: '--font-cinzel',
    subsets: ['latin'],
    weight: ['400', '500', '600'],
})

const raleway = Raleway({
    variable: '--font-raleway',
    subsets: ['latin'],
    weight: ['200', '300', '400'],
})

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
                                               params,
                                           }: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const messages = await getMessages()

    return (
        <html lang={locale} className={`${cinzel.variable} ${raleway.variable} h-full`}>
        <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
            <CurrencyProvider>
                <CartProvider>
                    <UtilityBar />
                    <Nav />
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer />
                </CartProvider>
            </CurrencyProvider>
        </NextIntlClientProvider>
        </body>
        </html>
    )
}