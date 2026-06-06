// middleware.ts
// Handles i18n routing for all pages
// Saves user language choice to cookie so it persists across navigation
// Excludes /studio and /api routes from locale prefix

import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
    locales: ['pl', 'en'],
    defaultLocale: 'pl',
    localeDetection: true,
})

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Skip i18n for Sanity Studio and API routes
    if (pathname.startsWith('/studio') || pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    // Read saved language preference from cookie
    const savedLocale = request.cookies.get('NEXT_LOCALE')?.value

    // If user has a saved preference and URL doesn't have a locale prefix,
    // redirect them to their preferred language
    if (savedLocale && !pathname.startsWith('/pl') && !pathname.startsWith('/en')) {
        const url = request.nextUrl.clone()
        url.pathname = `/${savedLocale}${pathname}`
        return NextResponse.redirect(url)
    }

    const response = intlMiddleware(request)

    // Save the current locale to cookie whenever user navigates
    // so it persists across all page visits
    const currentLocale = pathname.startsWith('/en') ? 'en' : 'pl'
    response.cookies.set('NEXT_LOCALE', currentLocale, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax',
    })

    return response
}

export const config = {
    matcher: ['/((?!_next|.*\\..*).*)']
}