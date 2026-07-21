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

type BookableService = ServicePrice & {
    namePl: string
    calComSlug?: string
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

// Look up the priced service and its booking slug together. Booking routes
// use this so the paid service and the Cal.com event come from one Sanity row.
export async function getBookableServiceByName(
    namePl: string
): Promise<BookableService | null> {
    const result = await sanityServerClient.fetch<BookableService | null>(
        `*[_type == "service" && namePl == $namePl && isActive == true && requiresBooking == true][0]{ namePl, priceGBP, pricePLN, calComSlug }`,
        { namePl }
    )
    return result ?? null
}

export type SklepProductType = 'digital' | 'physical' | 'bundle' | 'course'

// Look up the REAL price, type and (for shipped items) shipping fee of a Sklep
// product by its Sanity document ID. fileName is only present for PDF products.
export async function getSklepProductById(
    productId: string
): Promise<{
    priceGBP: number
    pricePLN?: number
    fileName?: string
    namePl: string
    productType: SklepProductType
    shippingFeeGBP?: number
} | null> {
    const result = await sanityServerClient.fetch(
        `*[_type == "sklepProduct" && _id == $productId && isActive == true][0]{ priceGBP, pricePLN, fileName, namePl, productType, shippingFeeGBP }`,
        { productId }
    )
    return result ?? null
}

// Convert GBP to PLN using the same rate as the frontend CartContext
export function gbpToPln(gbp: number): number {
    return Math.round(gbp * 5.2)
}
