import { getSklepProducts } from '@/sanity/lib/sanity'
import SklepClient from '@/components/sklep/sklepClient'

export default async function SklepPage() {
    const products = await getSklepProducts()
    return <SklepClient products={products} />
}