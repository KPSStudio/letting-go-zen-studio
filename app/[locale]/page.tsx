// app/[locale]/page.tsx
import Hero from '@/components/home/Hero'
import CUDPillars from '@/components/home/CUDPillars'

export default function Home() {
    return (
        <>
            <Hero />
            <CUDPillars />
        </>
    )
}