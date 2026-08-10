// app/[locale]/koszyk/layout.tsx
// This route's page is a client component, and a client component cannot
// export metadata. This server layout carries the route's title, description
// and canonical instead.
//
// noIndex: this is a transactional page tied to one visitor's in-progress
// state. It has nothing to offer a search visitor and should never appear in
// results, so it is excluded from the sitemap AND marked noindex here.

import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "/koszyk",
        noIndex: true,
        pl: {
            title: "Koszyk | Letting Go Zen Studio",
            description: "Twój koszyk w Letting Go Zen Studio.",
        },
        en: {
            title: "Cart | Letting Go Zen Studio",
            description: "Your Letting Go Zen Studio cart.",
        },
    })
}

export default function RouteLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
