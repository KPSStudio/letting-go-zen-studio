// app/[locale]/page.tsx
import Hero from '@/components/home/Hero'
import CUDPillars from '@/components/home/CUDPillars'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export default function Home() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'LocalBusiness',
                        name: 'Letting Go Zen Studio',
                        description: 'Holistic therapy sessions — Body, Mind & Soul',
                        url: 'https://www.lettinggozenstudio.com',
                        telephone: '+447590572043',
                        email: 'lettinggozenstudio@gmail.com',
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: '42 Leslie Road',
                            addressLocality: 'Aberdeen',
                            postalCode: 'AB24 4EF',
                            addressRegion: 'Scotland',
                            addressCountry: 'GB',
                        },
                        founder: {
                            '@type': 'Person',
                            name: 'Joanna Witkowska',
                        },
                        sameAs: [
                            'https://www.facebook.com/lettinggostudiozen/',
                            'https://www.instagram.com/lettinggozenstudio',
                            'https://www.tiktok.com/@lettinggozenstudi',
                        ],
                        serviceType: [
                            'Bioresonance',
                            'Pressotherapy',
                            'Hypnotherapy',
                            'Aura Scanning',
                            'Holistic Therapy',
                        ],
                    }),
                }}
            />

            <Hero />
            <CUDPillars />
        </>
    )
}
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "",
        pl: {
            title: "Letting Go Zen Studio | Holistyczne sesje Ciało, Umysł, Dusza w Aberdeen",
            description: "Holistyczne sesje Ciało, Umysł i Dusza w Aberdeen — biorezonans, biofeedback, hipnoterapia i praca ze stresem. Rezerwacja online, obsługa po polsku i angielsku.",
        },
        en: {
            title: "Letting Go Zen Studio | Holistic Body, Mind and Soul Sessions in Aberdeen",
            description: "Holistic Body, Mind and Soul sessions in Aberdeen — bioresonance, biofeedback, hypnotherapy and stress support. Book online in English or Polish.",
        },
    keywords: [
            "Letting Go Zen Studio",
            "holistyczne sesje UK",
            "terapia holistyczna Aberdeen",
            "hipnoterapia UK",
            "biorezonans UK",
            "biofeedback UK",
            "wellbeing UK"
    ],
    })
}
