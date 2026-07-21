// app/layout.tsx
// Root layout — the ONE place <html> and <body> are rendered, for every route
// (the localized site AND /studio). Nested layouts must NOT render their own
// html/body, or the tags end up invalidly nested and hydration breaks.
//
// The language comes from next-intl's getLocale(): on /pl and /en it reflects
// the active locale; on /studio (which skips i18n) it falls back to the
// default locale, which is fine for the admin-only Studio.

import { getLocale } from 'next-intl/server'

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // getLocale() reads next-intl's request config, which calls notFound() for
    // routes OUTSIDE the locale system (e.g. /studio). We only need a value for
    // the <html lang> attribute, so fall back to the default locale there rather
    // than letting those routes 404. (This is what broke the Sanity Studio.)
    let locale = 'pl'
    try {
        locale = await getLocale()
    } catch {
        locale = 'pl'
    }

    return (
        <html lang={locale} className="h-full">
        <body className="min-h-full flex flex-col">{children}</body>
        </html>
    )
}
