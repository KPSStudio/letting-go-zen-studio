import { getServicesByCategory } from '@/sanity/lib/sanity'
import MindClient from '@/components/mind/mindClient'

export default async function MindPage() {
    const products = await getServicesByCategory('mind')
    return <MindClient products={products} />
}