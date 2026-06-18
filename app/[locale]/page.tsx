// app/[locale]/page.tsx
import Hero from '@/components/home/Hero'
import CUDPillars from '@/components/home/CUDPillars'

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
                        email: 'joanna@lettinggozenstudio.com',
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