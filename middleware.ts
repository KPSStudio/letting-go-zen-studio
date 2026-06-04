// middleware.ts
// Handles i18n routing for all pages
// Excludes /studio and /api routes from locale prefix

import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
    locales: ['pl', 'en'],
    defaultLocale: 'pl',
})

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Skip i18n for Sanity Studio and API routes
    if (pathname.startsWith('/studio') || pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    return intlMiddleware(request)
}

export const config = {
    matcher: ['/((?!_next|.*\\..*).*)']
}