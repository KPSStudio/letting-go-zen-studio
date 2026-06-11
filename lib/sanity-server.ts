// lib/sanity-server.ts
// Server-only Sanity client for payment validation.
// useCdn: false — always fetches fresh data, never a cached price.
// NEVER import this in client components.

import { createClient } from '@sanity/client'

const sanityServerClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2024-01-01',
    useCdn: false,
})

type ServicePrice = {
    priceGBP: number
    pricePLN?: number
}

// Look up the REAL price of a service by its Polish name.
// Returns null if the service doesn't exist or is inactive —
// in that case the checkout must be rejected.
export async function getServicePriceByName(
    namePl: string
): Promise<ServicePrice | null> {
    const result = await sanityServerClient.fetch<ServicePrice | null>(
        `*[_type == "service" && namePl == $namePl && isActive == true][0]{ priceGBP, pricePLN }`,
        { namePl }
    )
    return result ?? null
}

// Look up the REAL price of a Sklep product by its Sanity document ID.
export async function getSklepProductById(
    productId: string
): Promise<{ priceGBP: number; pricePLN?: number; fileName: string; namePl: string } | null> {
    const result = await sanityServerClient.fetch(
        `*[_type == "sklepProduct" && _id == $productId && isActive == true][0]{ priceGBP, pricePLN, fileName, namePl }`,
        { productId }
    )
    return result ?? null
}

// Convert GBP to PLN using the same rate as the frontend CartContext
export function gbpToPln(gbp: number): number {
    return Math.round(gbp * 5.2)
}