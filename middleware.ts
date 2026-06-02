// middleware.ts
// Runs on every page load before anything else
// Detects the visitor's language and routes them correctly
// pl = Polish (default), en = English

import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
    locales: ['pl', 'en'],
    defaultLocale: 'pl',
})

export const config = {
    matcher: ['/((?!_next|.*\\..*).*)']
}
