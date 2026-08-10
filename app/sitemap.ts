import { MetadataRoute } from 'next'
import { SITE_BASE_URL } from '@/lib/pageMetadata'

// Public, indexable routes only.
//
// Deliberately excluded: /koszyk and /zgoda-rezerwacja. Both are transactional
// pages tied to one visitor's in-progress state — there is nothing there for a
// search visitor, and both are also marked noindex in their route layouts.
// (/studio is excluded by robots.ts.)
const PUBLIC_ROUTES = [
    '',
    '/body',
    '/mind',
    '/soul',
    '/sklep',
    '/o-mnie',
    '/kontakt',
    '/wspolpraca',
    '/regulamin',
    '/polityka-prywatnosci',
    '/zasady-uslug',
    // Publicly linked from the cart's terms checkbox, so it should be
    // reachable and indexable like the other legal pages.
    '/zgoda-swiadoma',
] as const

// A fixed date for the current content revision.
//
// This used to be `new Date()`, which stamped EVERY route with "modified right
// now" on every single request. That is a claim we cannot support, and search
// engines discount lastModified entirely once it proves untrustworthy — so the
// field became worse than useless. Bump this by hand when page content actually
// changes; leave it alone for code-only deploys.
const CONTENT_LAST_MODIFIED = new Date('2026-08-10T00:00:00.000Z')

const LOCALES = ['pl', 'en'] as const

export default function sitemap(): MetadataRoute.Sitemap {
    return LOCALES.flatMap(locale =>
        PUBLIC_ROUTES.map(route => ({
            url: `${SITE_BASE_URL}/${locale}${route}`,
            lastModified: CONTENT_LAST_MODIFIED,
            changeFrequency: (route === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
            priority: route === '' ? 1 : 0.8,
            // Tells crawlers these two URLs are the same page in two languages.
            alternates: {
                languages: {
                    pl: `${SITE_BASE_URL}/pl${route}`,
                    en: `${SITE_BASE_URL}/en${route}`,
                },
            },
        }))
    )
}
