// middleware.ts
// Handles i18n routing for all pages.
// Stores a language preference ONLY after a deliberate language switch —
// ordinary browsing sets no cookie, because /pl and /en already carry it.
// Excludes /studio and /api routes from locale prefix

import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
    locales: ['pl', 'en'],
    defaultLocale: 'pl',
    // next-intl writes its own NEXT_LOCALE cookie on every localized request
    // by default. That is what was setting the cookie during ordinary
    // browsing even after this file stopped doing so. Turned off, so the ONLY
    // cookie written is the deliberate one below, after a real language
    // choice.
    localeCookie: false,
    // Also off: locale detection sniffs Accept-Language to decide where an
    // unprefixed visitor lands. The saved preference (when one exists) and the
    // /pl default already cover that, without inspecting browser headers.
    localeDetection: false,
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

    // The locale cookie is written ONLY when the visitor deliberately switches
    // language — the language switcher appends ?setLang=<locale> — and never on
    // ordinary navigation.
    //
    // It used to be re-set on every localized request, for a year, which made a
    // persistent identifier out of something the URL already carries: /pl and
    // /en are self-describing, so the cookie is not needed to render the right
    // language. Its only job is remembering the choice for an UNPREFIXED entry
    // URL, which is a genuine user-requested convenience.
    //
    // Not HttpOnly on purpose: the client-side switcher has to be able to clear
    // it (see the "forget my language" control), and it holds no secret — only
    // the literal 'pl' or 'en'. Secure in production so it is never sent over
    // plain HTTP.
    const requestedLocale = request.nextUrl.searchParams.get('setLang')

    if (requestedLocale === 'pl' || requestedLocale === 'en') {
        response.cookies.set('NEXT_LOCALE', requestedLocale, {
            // 180 days rather than a year: long enough to be useful, short
            // enough that a forgotten preference expires on its own.
            maxAge: 60 * 60 * 24 * 180,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        })
    }

    return response
}

export const config = {
    matcher: ['/((?!_next|.*\\..*).*)']
}