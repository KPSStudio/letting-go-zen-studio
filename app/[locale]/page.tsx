// app/[locale]/page.tsx
import Hero from '@/components/home/Hero'
import CUDPillars from '@/components/home/CUDPillars'
import QuoteBanner from '@/components/home/QuoteBanner'
import WhyChooseUs from '@/components/home/WhyChooseUs'
import ShopCta from '@/components/home/ShopCta'
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

            {/* The homepage reads as four bands, in this order:
                  1. hero          — who this is
                  2. CUDPillars    — what we do, as three columns
                  3. QuoteBanner   — a full-bleed atmospheric pause
                  4. WhyChooseUs   — why work with Joanna
                Each is a full-width section that changes tone against the one
                above it, so the page is divided without boxing every paragraph. */}
            <Hero />
            <CUDPillars />
            {/* Supporting CTA, after the trio — the shop is not a fourth pillar. */}
            <ShopCta />
            <QuoteBanner />
            <WhyChooseUs />
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
