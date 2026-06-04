// scripts/importSklepProduct.ts
// One-time script to add the first digital shop product to Sanity.
// This creates a "sklepProduct", not a normal service product.

import { readFileSync } from 'node:fs'
import { createClient } from '@sanity/client'

// Manually loads .env.local because ts-node scripts do not load it automatically.
function loadEnvLocal() {
    const envFile = readFileSync('.env.local', 'utf8')

    for (const line of envFile.split('\n')) {
        const trimmedLine = line.trim()

        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue
        }

        const equalsIndex = trimmedLine.indexOf('=')

        if (equalsIndex === -1) {
            continue
        }

        const key = trimmedLine.slice(0, equalsIndex).trim()
        const rawValue = trimmedLine.slice(equalsIndex + 1).trim()
        const value = rawValue.replace(/^["']|["']$/g, '')

        process.env[key] = value
    }
}

loadEnvLocal()

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

type SklepProduct = {
    _type: 'sklepProduct'
    namePl: string
    description: string
    priceGBP: number
    pricePLN: number
    fileName: string
    deliveryNote: string
    moreInfoTitle: string
    includes: string[]
    isActive: boolean
}

const sklepProduct: SklepProduct = {
    _type: 'sklepProduct',
    namePl: 'Przewodnik Energetyczny — PDF',
    description:
        'Produkt testowy. Przewodnik po energetyce, chakrach i codziennej praktyce energetycznej. Dostępny natychmiast po zakupie.',
    priceGBP: 10,
    pricePLN: 50,
    fileName: 'przewodnik-energetyczny.pdf',
    deliveryNote: 'PDF · Natychmiastowe pobranie po zakupie',
    moreInfoTitle: 'Co zawiera',
    includes: [
        'Przewodnik po energetyce',
        'Opis i analiza chakr',
        'Codzienna praktyka energetyczna',
        'Format PDF — dostęp natychmiastowy po zakupie',
    ],
    isActive: true,
}

async function importSklepProduct() {
    console.log('Importing Sklep product to Sanity...')

    const result = await client.create(sklepProduct)

    console.log(`✅ Created: ${sklepProduct.namePl}`)
    console.log(`Sanity ID: ${result._id}`)
}

importSklepProduct().catch((error: unknown) => {
    console.error('❌ Import failed:', error)
    process.exit(1)
})