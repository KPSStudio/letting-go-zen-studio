// sanity/schemas/galleryImage.ts
// Studio photos and equipment images
// Joanna uploads photos for the gallery page

import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'galleryImage',
    title: 'Galeria Zdjęć',
    type: 'document',
    fields: [
        defineField({
            name: 'image',
            title: 'Zdjęcie',
            type: 'image',
            options: { hotspot: true },
            validation: Rule => Rule.required(),
        }),
        defineField({
            name: 'altPl',
            title: 'Opis zdjęcia (Polski)',
            type: 'string',
        }),
        defineField({
            name: 'altEn',
            title: 'Opis zdjęcia (English)',
            type: 'string',
        }),
        defineField({
            name: 'order',
            title: 'Kolejność',
            type: 'number',
            initialValue: 0,
        }),
        defineField({
            name: 'isActive',
            title: 'Widoczne w galerii?',
            type: 'boolean',
            initialValue: true,
        }),
    ],
    preview: {
        select: {
            title: 'altPl',
            media: 'image',
        },
    },
})