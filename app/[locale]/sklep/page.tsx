import { getSklepProducts } from '@/sanity/lib/sanity'
import SklepClient from '@/components/sklep/sklepClient'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export default async function SklepPage() {
    const products = await getSklepProducts()
    return <SklepClient products={products} />
}
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "/sklep",
        pl: {
            title: "Sklep — materiały i produkty cyfrowe | Letting Go Zen Studio",
            description: "Materiały do samodzielnej pracy z Letting Go Zen Studio. Produkty cyfrowe dostarczamy natychmiast po zakupie, linkiem ważnym przez 30 dni.",
        },
        en: {
            title: "Shop — Materials and Digital Products | Letting Go Zen Studio",
            description: "Materials for your own practice from Letting Go Zen Studio. Digital products are delivered immediately after purchase, with a link valid for 30 days.",
        },
    })
}
