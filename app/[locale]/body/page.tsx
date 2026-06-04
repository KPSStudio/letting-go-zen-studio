// app/[locale]/body/page.tsx
// Server component — fetches from Sanity
// Passes data to client components for interactivity and translations

import { getServicesByCategory } from '@/sanity/lib/sanity'
import BodyClient from '@/components/body/bodyClient'

export default async function BodyPage({
                                           params,
                                       }: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const products = await getServicesByCategory('body')

    return <BodyClient products={products} locale={locale} />
}