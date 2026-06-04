// sanity/schemas/sklepProduct.ts
// Digital products for the Sklep page
// These are instant-download PDFs — no manual fulfilment needed
// Joanna uploads the PDF to Supabase Storage, then adds the filename here

import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'sklepProduct',
    title: 'Sklep — Produkty Cyfrowe',
    type: 'document',
    fields: [
        defineField({
            name: 'namePl',
            title: 'Nazwa produktu (Polski)',
            type: 'string',
            validation: Rule => Rule.required(),
        }),
        defineField({
            name: 'nameEn',
            title: 'Nazwa produktu (English)',
            type: 'string',
        }),
        defineField({
            name: 'descPl',
            title: 'Opis (Polski)',
            type: 'text',
            rows: 4,
        }),
        defineField({
            name: 'descEn',
            title: 'Opis (English)',
            type: 'text',
            rows: 4,
        }),
        defineField({
            name: 'priceGBP',
            title: 'Cena £ GBP',
            type: 'number',
            validation: Rule => Rule.required().positive(),
        }),
        defineField({
            name: 'pricePLN',
            title: 'Cena zł PLN',
            type: 'number',
        }),
        defineField({
            name: 'fileName',
            title: 'Nazwa pliku PDF w Supabase Storage (np. przewodnik-energetyczny.pdf)',
            type: 'string',
            validation: Rule => Rule.required(),
        }),
        defineField({
            name: 'deliveryNote',
            title: 'Informacja o dostawie',
            type: 'string',
            initialValue: 'PDF · Natychmiastowe pobranie po zakupie',
        }),
        defineField({
            name: 'includes',
            title: 'Co zawiera (lista)',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'isActive',
            title: 'Aktywny (widoczny w sklepie)?',
            type: 'boolean',
            initialValue: true,
        }),
        defineField({
            name: 'order',
            title: 'Kolejność wyświetlania',
            type: 'number',
            initialValue: 0,
        }),
    ],
    preview: {
        select: {
            title: 'namePl',
            subtitle: 'priceGBP',
        },
        prepare(selection: Record<string, any>) {
            return {
                title: selection.title,
                subtitle: `£${selection.subtitle}`,
            }
        },
    },
})