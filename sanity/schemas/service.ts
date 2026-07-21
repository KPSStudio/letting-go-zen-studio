// sanity/schemas/service.ts
// Defines what a service looks like in Sanity
// Used for Ciało, Umysł and Dusza pages
// Joanna edits these fields in the Studio

import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'service',
    title: 'Usługi (Ciało / Umysł / Dusza)',
    type: 'document',
    fields: [
        defineField({
            name: 'namePl',
            title: 'Nazwa (Polski)',
            type: 'string',
            validation: Rule => Rule.required(),
        }),
        defineField({
            name: 'nameEn',
            title: 'Nazwa (English)',
            type: 'string',
        }),
        defineField({
            name: 'category',
            title: 'Kategoria',
            type: 'string',
            options: {
                list: [
                    { title: 'Ciało (Body)', value: 'body' },
                    { title: 'Umysł (Mind)', value: 'mind' },
                    { title: 'Dusza (Soul)', value: 'soul' },
                ],
                layout: 'radio',
            },
            validation: Rule => Rule.required(),
        }),
        defineField({
            name: 'type',
            title: 'Typ produktu',
            type: 'string',
            options: {
                list: [
                    { title: 'Sesja', value: 'sesja' },
                    { title: 'Pakiet', value: 'pakiet' },
                    { title: 'Ebook / PDF', value: 'ebook' },
                ],
                layout: 'radio',
            },
            validation: Rule => Rule.required(),
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
            name: 'duration',
            title: 'Czas trwania (np. 60 min, 2h, Pakiet 5 sesji)',
            type: 'string',
        }),
        defineField({
            name: 'availability',
            title: 'Dostępność',
            type: 'string',
            options: {
                list: [
                    { title: 'Studio', value: 'Studio' },
                    { title: 'Online', value: 'Online' },
                    { title: 'Studio | Online', value: 'Studio | Online' },
                ],
                layout: 'radio',
            },
        }),
        defineField({
            name: 'pdfNote',
            title: 'Informacja o PDF (zostaw puste jeśli brak)',
            type: 'string',
        }),
        defineField({
            name: 'requiresBooking',
            title: 'Wymaga rezerwacji terminu?',
            type: 'boolean',
            initialValue: false,
        }),
        defineField({
            name: 'calComSlug',
            title: 'Cal.com — adres wydarzenia (slug)',
            type: 'string',
            description:
                'Skopiuj końcówkę adresu wydarzenia z Cal.com. Przykład: jeśli adres to cal.com/lettinggozenstudio/cialo-biorezonans-sesja-1-1, wklej tutaj tylko: cialo-biorezonans-sesja-1-1',
            hidden: ({ document }) => !document?.requiresBooking,
        }),
        defineField({
            name: 'freeConsultation',
            title: 'Bezpłatna konsultacja wstępna (Polski) (zostaw puste jeśli brak)',
            type: 'string',
        }),
        defineField({
            name: 'freeConsultationEn',
            title: 'Free consultation (English) — leave empty to reuse Polish',
            type: 'string',
        }),
        defineField({
            name: 'includes',
            title: 'Co obejmuje — lista (Polski)',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'includesEn',
            title: 'What is included — list (English), leave empty to reuse Polish',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'whoFor',
            title: 'Dla kogo — lista (Polski)',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'whoForEn',
            title: 'Who it is for — list (English), leave empty to reuse Polish',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'warning',
            title: 'Zastrzeżenie / ważna informacja (Polski) (zostaw puste jeśli brak)',
            type: 'text',
            rows: 2,
        }),
        defineField({
            name: 'warningEn',
            title: 'Warning / important note (English) — leave empty to reuse Polish',
            type: 'text',
            rows: 2,
        }),
        defineField({
            name: 'order',
            title: 'Kolejność wyświetlania',
            type: 'number',
            initialValue: 0,
        }),
        defineField({
            name: 'isActive',
            title: 'Aktywny (widoczny na stronie)?',
            type: 'boolean',
            initialValue: true,
        }),
    ],
    preview: {
        select: {
            title: 'namePl',
            subtitle: 'category',
        },
    },
    orderings: [
        {
            title: 'Kolejność',
            name: 'orderAsc',
            by: [{ field: 'order', direction: 'asc' }],
        },
    ],
})