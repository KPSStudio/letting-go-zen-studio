import { getServicesByCategory } from '@/sanity/lib/sanity'
import MindClient from '@/components/mind/mindClient'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export default async function MindPage() {
    const products = await getServicesByCategory('mind')
    return <MindClient products={products} />
}
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "/mind",
        pl: {
            title: "Umysł — hipnoterapia i konsultacje energetyczne | Letting Go Zen Studio",
            description: "Praca z podświadomością w Aberdeen: hipnoterapia, konsultacja energetyczna i sesje Alchemik. Poznaj szczegóły każdej sesji i zarezerwuj dogodny termin.",
        },
        en: {
            title: "Mind — Hypnotherapy and Energy Consultations | Letting Go Zen Studio",
            description: "Subconscious and energy work in Aberdeen: hypnotherapy, energy consultations and Alchemik sessions. Read what each session involves and book a time.",
        },
    })
}
