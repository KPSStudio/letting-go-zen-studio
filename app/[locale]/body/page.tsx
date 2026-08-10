// app/[locale]/body/page.tsx
// Server component — fetches from Sanity
// Passes data to client components for interactivity and translations

import { getServicesByCategory } from '@/sanity/lib/sanity'
import BodyClient from '@/components/body/bodyClient'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export default async function BodyPage({
                                           params,
                                       }: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const products = await getServicesByCategory('body')

    return <BodyClient products={products} locale={locale} />
}
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "/body",
        pl: {
            title: "Ciało — biorezonans, biofeedback, presoterapia | Letting Go Zen Studio",
            description: "Sesje dla ciała w Aberdeen: biorezonans, biofeedback, presoterapia i inhalacje wodorowe. Zobacz opisy, czas trwania i ceny, i zarezerwuj termin online.",
        },
        en: {
            title: "Body — Bioresonance, Biofeedback, Pressotherapy | Letting Go Zen Studio",
            description: "Body sessions in Aberdeen: bioresonance, biofeedback, pressotherapy and hydrogen inhalation. See what each involves, how long it takes, and book online.",
        },
    })
}
