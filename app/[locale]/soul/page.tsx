import { getServicesByCategory } from '@/sanity/lib/sanity'
import SoulClient from '@/components/soul/soulClient'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export default async function SoulPage() {
    const products = await getServicesByCategory('soul')
    return <SoulClient products={products} />
}
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "/soul",
        pl: {
            title: "Dusza — analiza aury, chakr i Przeznaczenie | Letting Go Zen Studio",
            description: "Sesje dla duszy: pakiet Jasność Umysłu, raport Przeznaczenie oraz zdjęcie i analiza aury i chakr. Sprawdź, co zawiera każda z propozycji.",
        },
        en: {
            title: "Soul — Aura and Chakra Analysis, Destiny Report | Letting Go Zen Studio",
            description: "Soul sessions: the Clarity of Mind package, the Destiny report, and aura and chakra photography with analysis. See what each one includes.",
        },
    })
}
