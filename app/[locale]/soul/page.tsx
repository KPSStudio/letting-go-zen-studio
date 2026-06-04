import { getServicesByCategory } from '@/sanity/lib/sanity'
import SoulClient from '@/components/soul/soulClient'

export default async function SoulPage() {
    const products = await getServicesByCategory('soul')
    return <SoulClient products={products} />
}