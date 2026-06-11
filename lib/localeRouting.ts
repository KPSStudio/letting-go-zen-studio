// lib/localeRouting.ts
// Shared locale-navigation helpers used by desktop and mobile language switchers.

type SearchParamsLike = string | {
    toString: () => string
}

const SUPPORTED_LOCALES = new Set(['pl', 'en'])

export function buildLocaleHref(
    pathname: string,
    searchParams: SearchParamsLike | null | undefined,
    newLocale: 'pl' | 'en'
): string {
    const segments = pathname.split('/')

    if (SUPPORTED_LOCALES.has(segments[1])) {
        segments[1] = newLocale
    } else {
        segments.splice(1, 0, newLocale)
    }

    const nextPathname = segments.join('/') || `/${newLocale}`
    const rawSearchParams = typeof searchParams === 'string'
        ? searchParams.replace(/^\?/, '')
        : searchParams?.toString() ?? ''
    const params = new URLSearchParams(rawSearchParams)

    // Preserve active checkout/consent/booking flow state while keeping the
    // explicit locale query value aligned with the newly selected URL locale.
    if (params.has('locale')) {
        params.set('locale', newLocale)
    }

    const query = params.toString()
    return query ? `${nextPathname}?${query}` : nextPathname
}
