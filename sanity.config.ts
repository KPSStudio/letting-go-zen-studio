import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import service from './sanity/schemas/service'
import sklepProduct from './sanity/schemas/sklepProduct'
import testimonial from './sanity/schemas/testimonial'
import siteSettings from './sanity/schemas/siteSettings'
import galleryImage from './sanity/schemas/galleryImage'

export default defineConfig({
    name: 'letting-go-zen-studio',
    title: 'Letting Go Zen Studio',

    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

    // This sets Structure as the default tool so /studio loads correctly
    defaultTool: 'structure',

    plugins: [
        structureTool({
            structure: (S) =>
                S.list()
                    .title('Panel Administracyjny')
                    .items([
                        S.listItem().title('Ciało — Usługi').child(
                            S.documentList().title('Ciało — Usługi').filter('_type == "service" && category == "body"')
                        ),
                        S.listItem().title('Umysł — Usługi').child(
                            S.documentList().title('Umysł — Usługi').filter('_type == "service" && category == "mind"')
                        ),
                        S.listItem().title('Dusza — Usługi').child(
                            S.documentList().title('Dusza — Usługi').filter('_type == "service" && category == "soul"')
                        ),
                        S.divider(),
                        S.listItem().title('Sklep — Produkty Cyfrowe').child(
                            S.documentList().title('Sklep — Produkty Cyfrowe').filter('_type == "sklepProduct"')
                        ),
                        S.divider(),
                        S.listItem().title('Opinie Klientów').child(
                            S.documentList().title('Opinie Klientów').filter('_type == "testimonial"')
                        ),
                        S.listItem().title('Galeria Zdjęć').child(
                            S.documentList().title('Galeria Zdjęć').filter('_type == "galleryImage"')
                        ),
                        S.divider(),
                        S.listItem().title('Ustawienia Strony').child(
                            S.documentList().title('Ustawienia Strony').filter('_type == "siteSettings"')
                        ),
                    ]),
        }),
    ],

    schema: {
        types: [service, sklepProduct, testimonial, siteSettings, galleryImage],
    },
})