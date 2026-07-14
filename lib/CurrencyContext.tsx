// lib/CurrencyContext.tsx
// Stores the selected currency globally across all pages
// Any component can read or change the currency using useCurrency()

'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

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
    const [currency, setCurrency] = useState<Currency>('GBP')

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