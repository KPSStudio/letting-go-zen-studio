// lib/currency-server.ts
// The single server-side authority on which currencies we will actually charge.
//
// Why this exists: both checkout routes used to do the equivalent of
//
//     const isPln = currency === 'PLN'
//     const amount = isPln ? plnPrice * 100 : gbpPrice * 100
//     stripe.paymentIntents.create({ amount, currency: currency.toLowerCase() })
//
// which means ANY other string — 'JPY', 'usd', 'xyz' — took the GBP branch for
// the amount but was still passed straight through to Stripe as the currency
// code. A direct POST could therefore mint a PaymentIntent for "£90" charged as
// 90 JPY (or 90 USD). The client picks the currency, so the client must not be
// trusted to name it.
//
// Anything not on this list is now rejected with a 400 rather than quietly
// reinterpreted.

export const SUPPORTED_CURRENCIES = ['GBP', 'PLN'] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

/**
 * Normalises and validates a client-supplied currency.
 *
 * Accepts case-insensitively ('gbp', 'Gbp', ' GBP ') because the browser sends
 * whatever the CurrencyContext holds and casing is not a security property —
 * membership of the allowlist is. Returns null for anything unsupported,
 * missing, or not a string, and the caller must turn that into a 400.
 */
export function parseCurrency(value: unknown): SupportedCurrency | null {
    if (typeof value !== 'string') return null

    const normalized = value.trim().toUpperCase()

    return (SUPPORTED_CURRENCIES as readonly string[]).includes(normalized)
        ? (normalized as SupportedCurrency)
        : null
}

/**
 * Validates a price coming out of the CMS before it is turned into money.
 *
 * Sanity fields are editable by hand, so a price can legitimately arrive as
 * undefined, null, a string, NaN, negative, or Infinity. Any of those would
 * otherwise become a nonsense Stripe amount.
 */
export function isChargeablePrice(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Converts a major-unit amount (pounds, złoty) into the integer minor units
 * Stripe requires. Rounds once, at the end, and refuses anything that is not a
 * safe positive integer afterwards.
 */
export function toMinorUnits(majorUnits: number): number | null {
    if (!Number.isFinite(majorUnits) || majorUnits <= 0) return null

    const minor = Math.round(majorUnits * 100)

    if (!Number.isSafeInteger(minor) || minor <= 0) return null

    return minor
}
