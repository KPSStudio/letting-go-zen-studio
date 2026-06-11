import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.lettinggozenstudio.com'
    const locales = ['pl', 'en']

    const routes = [
        '',
        '/body',
        '/mind',
        '/soul',
        '/sklep',
        '/o-mnie',
        '/kontakt',
        '/wspolpraca',
        '/regulamin',
        '/polityka-prywatnosci',
        '/zasady-uslug',
    ]

    return locales.flatMap(locale =>
        routes.map(route => ({
            url: `${baseUrl}/${locale}${route}`,
            lastModified: new Date(),
            changeFrequency: (route === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
            priority: route === '' ? 1 : 0.8,
        }))
    )
}
