// sanity/schemas/testimonial.ts
// Customer reviews shown on the homepage
// Joanna adds/removes testimonials herself

import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'testimonial',
    title:'Opinie Klientów',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Imię klienta',
            type: 'string',
            validation: Rule => Rule.required(),
        }),
        defineField({
            name: 'text',
            title: 'Treść opinii',
            type: 'text',
            rows: 4,
            validation: Rule => Rule.required(),
        }),
        defineField({
            name: 'service',
            title: 'Usługa (opcjonalnie)',
            type: 'string',
        }),
        defineField({
            name: 'isActive',
            title: 'Widoczna na stronie?',
            type: 'boolean',
            initialValue: true,
        }),
        defineField({
            name: 'order',
            title: 'Kolejność',
            type: 'number',
            initialValue: 0,
        }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'text',
        },
    },
})