// sanity/schemas/siteSettings.ts
// Global site settings Joanna can edit
// Years of experience, qualifications, contact details, studio address

import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'siteSettings',
    title: 'Ustawienia Strony',
    type: 'document',
    fields: [
        defineField({
            name: 'yearsExperience',
            title: 'Lata doświadczenia',
            type: 'number',
            initialValue: 8,
        }),
        defineField({
            name: 'phone',
            title: 'Numer telefonu / WhatsApp',
            type: 'string',
            initialValue: '07590 572 043',
        }),
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
            initialValue: 'lettinggozenstudio@gmail.com',
        }),
        defineField({
            name: 'studioAddress',
            title: 'Adres studia',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'qualifications',
            title: 'Kwalifikacje i certyfikaty',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'facebookUrl',
            title: 'Facebook URL',
            type: 'url',
            initialValue: 'https://www.facebook.com/lettinggostudiozen/',
        }),
        defineField({
            name: 'instagramUrl',
            title: 'Instagram URL',
            type: 'url',
            initialValue: 'https://www.instagram.com/lettinggozenstudio',
        }),
        defineField({
            name: 'tiktokUrl',
            title: 'TikTok URL',
            type: 'url',
            initialValue: 'https://www.tiktok.com/@lettinggozenstudi',
        }),
    ],
    preview: {
        select: {
            title: 'email',
        },
    },
})