// i18n/request.ts
// This file tells next-intl which translation messages to load
// for /pl and /en pages.

import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

const locales = ['pl', 'en'] as const

type Locale = (typeof locales)[number]

function isValidLocale(locale: string): locale is Locale {
    return locales.includes(locale as Locale)
}

export default getRequestConfig(async ({ requestLocale }) => {
    const locale = await requestLocale

    if (!locale || !isValidLocale(locale)) {
        notFound()
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    }
})