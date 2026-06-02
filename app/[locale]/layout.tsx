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

export const metadata: Metadata = {
    title: 'Letting Go Zen Studio',
    description: 'Ciało · Umysł · Dusza — Holistyczne sesje terapeutyczne w UK',
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