// lib/CurrencyContext.tsx
// Stores the selected currency globally across all pages.
// Currency FOLLOWS the site language: Polish pages show złoty, English pages GBP.
// Any component can read it (and still override it) via useCurrency().

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocale } from 'next-intl'

// The two currencies we support
export type Currency = 'GBP' | 'PLN'

// Conversion rates relative to GBP
export const RATES: Record<Currency, number> = {
    GBP: 1,
    PLN: 5.2,
}

// Currency symbols
export const SYMBOLS: Record<Currency, string> = {
    GBP: '£',
    PLN: 'zł',
}

// Which currency a given site language defaults to.
function currencyForLocale(locale: string): Currency {
    return locale === 'pl' ? 'PLN' : 'GBP'
}

// What the context provides to every component
interface CurrencyContextType {
    currency: Currency
    setCurrency: (c: Currency) => void
    formatPrice: (gbp: number) => string
}

// Create the context
const CurrencyContext = createContext<CurrencyContextType | null>(null)

// Provider — wraps the whole app so every component can access currency
export function CurrencyProvider({ children }: { children: ReactNode }) {
    const locale = useLocale()

    // Start in the currency that matches the current language…
    const [currency, setCurrency] = useState<Currency>(() => currencyForLocale(locale))

    // …and keep it in step if the visitor switches language mid-session.
    useEffect(() => {
        setCurrency(currencyForLocale(locale))
    }, [locale])

    // Converts a GBP price to selected currency and formats it
    const formatPrice = (gbp: number): string => {
        const amount = Math.round(gbp * RATES[currency])
        return `${SYMBOLS[currency]}${amount}`
    }

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    )
}

// Hook — call this in any component to get or set the currency
export function useCurrency() {
    const ctx = useContext(CurrencyContext)
    if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
    return ctx
}
