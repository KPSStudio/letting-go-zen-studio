// lib/pageMetadata.ts
// One builder for every page's <title>, description, canonical and hreflang.
//
// WHY THIS EXISTS
// Metadata used to be declared once, in app/[locale]/layout.tsx, with a
// canonical hard-coded to `${baseUrl}/${locale}`. Next.js inherits layout
// metadata into every child route that does not declare its own, and no page
// did — so /pl/sklep, /pl/kontakt, /pl/koszyk and every other route served the
// HOMEPAGE title, the homepage description, and a canonical pointing at the
// homepage. Google was being told, on every page, "the real version of this
// page is the front page", which is a direct instruction to drop the rest of
// the site from the index.
//
// Now each route calls buildPageMetadata() with its own path and copy.

import type { Metadata } from 'next'

export const SITE_BASE_URL = 'https://www.lettinggozenstudio.com'
export const SITE_NAME = 'Letting Go Zen Studio'

export type SupportedLocale = 'pl' | 'en'

export function normaliseLocale(locale: string): SupportedLocale {
    return locale === 'en' ? 'en' : 'pl'
}

type LocalisedCopy = {
    title: string
    description: string
}

type BuildPageMetadataOptions = {
    locale: string
    /**
     * Route path WITHOUT the locale prefix, starting with a slash.
     * Use '' for the locale root (the homepage).
     */
    path: string
    pl: LocalisedCopy
    en: LocalisedCopy
    keywords?: string[]
    /**
     * Transactional or private-state pages (cart, booking consent) that must
     * never be indexed. They still get a correct canonical so that any link
     * pointing at them resolves sensibly.
     */
    noIndex?: boolean
}

export function buildPageMetadata({
    locale,
    path,
    pl,
    en,
    keywords,
    noIndex = false,
}: BuildPageMetadataOptions): Metadata {
    const activeLocale = normaliseLocale(locale)
    const copy = activeLocale === 'pl' ? pl : en

    // Self-canonical for THIS route, not the site root.
    const canonicalUrl = `${SITE_BASE_URL}/${activeLocale}${path}`

    // Reciprocal alternates: each language points at the SAME route in the
    // other language, so the pair is a genuine translation set.
    const plUrl = `${SITE_BASE_URL}/pl${path}`
    const enUrl = `${SITE_BASE_URL}/en${path}`

    return {
        metadataBase: new URL(SITE_BASE_URL),
        title: copy.title,
        description: copy.description,
        ...(keywords ? { keywords } : {}),
        openGraph: {
            title: copy.title,
            description: copy.description,
            url: canonicalUrl,
            siteName: SITE_NAME,
            locale: activeLocale === 'pl' ? 'pl_PL' : 'en_GB',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: copy.title,
            description: copy.description,
        },
        robots: noIndex
            ? {
                  index: false,
                  follow: false,
                  googleBot: { index: false, follow: false },
              }
            : { index: true, follow: true },
        alternates: {
            canonical: canonicalUrl,
            languages: {
                pl: plUrl,
                en: enUrl,
                // Polish is the default locale in middleware.ts, so it is the
                // right x-default target.
                'x-default': plUrl,
            },
        },
    }
}
