// app/[locale]/kontakt/layout.tsx
// This route's page is a client component, and a client component cannot
// export metadata. This server layout carries the route's title, description
// and canonical instead.

import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    return buildPageMetadata({
        locale,
        path: "/kontakt",
        pl: {
            title: "Kontakt | Letting Go Zen Studio Aberdeen",
            description: "Skontaktuj się z Letting Go Zen Studio w Aberdeen — formularz, WhatsApp i email. Napisz, jeśli nie wiesz, którą sesję wybrać.",
        },
        en: {
            title: "Contact | Letting Go Zen Studio Aberdeen",
            description: "Get in touch with Letting Go Zen Studio in Aberdeen — contact form, WhatsApp and email. Write if you are unsure which session to choose.",
        },
    })
}

export default function RouteLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
