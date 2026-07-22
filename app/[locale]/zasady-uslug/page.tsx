// app/[locale]/zasady-uslug/page.tsx
// Service Terms page — outlines terms specific to Joanna's therapy services.
// Bilingual: renders Polish on /pl and English on /en from one content object.
// Legal content — should still be reviewed by a solicitor before launch.

import Link from 'next/link'

type Props = {
    params: Promise<{ locale: string }>
}

type Section = { title: string; text: string }

type Content = {
    titleLead: string
    titleGold: string
    intro: string
    effective: string
    sections: Section[]
    links: { terms: string; privacy: string; contact: string }
}

const content: Record<'pl' | 'en', Content> = {
    pl: {
        titleLead: 'Zasady',
        titleGold: 'Usług',
        intro:
            'Niniejsze zasady określają warunki świadczenia usług terapeutycznych i wellness przez Letting Go Zen Studio.',
        effective: 'Obowiązuje od: 1 stycznia 2026',
        sections: [
            {
                title: '1. Charakter Usług',
                text: 'Usługi świadczone przez Letting Go Zen Studio mają charakter holistyczny i wellness. Nie stanowią one porady medycznej, diagnozy ani leczenia w rozumieniu prawa medycznego. Klientom zaleca się konsultację z lekarzem w przypadku jakichkolwiek problemów zdrowotnych przed skorzystaniem z usług.',
            },
            {
                title: '2. Rezerwacja i Odwoływanie',
                text: 'Sesje należy rezerwować z wyprzedzeniem za pośrednictwem systemu rezerwacji online. Odwołanie sesji jest możliwe do 24 godzin przed planowanym terminem bez ponoszenia opłat. Odwołanie w terminie krótszym niż 24 godziny może skutkować pobraniem opłaty w wysokości 50% wartości sesji. Niestawienie się na umówioną sesję bez wcześniejszego odwołania skutkuje pobraniem pełnej opłaty.',
            },
            {
                title: '3. Płatności',
                text: 'Płatności przyjmowane są online za pośrednictwem bezpiecznej platformy Stripe. Akceptowane metody płatności obejmują karty kredytowe i debetowe (Visa, Mastercard, Amex), Apple Pay oraz Google Pay. Wszystkie ceny podane są w funtach brytyjskich (GBP). Faktury dostępne są na życzenie.',
            },
            {
                title: '4. Produkty Cyfrowe',
                text: 'Raporty PDF i inne produkty cyfrowe dostarczane są drogą elektroniczną po potwierdzeniu płatności. Ze względu na cyfrowy charakter produktów, po uzyskaniu dostępu do pliku prawo do odstąpienia od umowy wygasa zgodnie z obowiązującymi przepisami prawa. Linki do pobrania są ważne przez 30 dni od momentu wysłania.',
            },
            {
                title: '5. Odpowiedzialność',
                text: 'Letting Go Zen Studio nie ponosi odpowiedzialności za jakiekolwiek szkody wynikające z korzystania z usług, w zakresie dozwolonym przez obowiązujące prawo. Klient korzysta z usług na własną odpowiedzialność i zobowiązany jest do poinformowania terapeuty o wszelkich schorzeniach, które mogą mieć wpływ na przebieg sesji.',
            },
            {
                title: '6. Poufność',
                text: 'Wszystkie informacje przekazane podczas sesji traktowane są jako poufne. Dane osobowe przetwarzane są zgodnie z naszą Polityką Prywatności i obowiązującymi przepisami RODO. Informacje nie są udostępniane osobom trzecim bez wyraźnej zgody klienta, z wyjątkiem przypadków wymaganych przez prawo.',
            },
            {
                title: '7. Zmiany Zasad',
                text: 'Letting Go Zen Studio zastrzega sobie prawo do zmiany niniejszych zasad w dowolnym czasie. O istotnych zmianach klienci będą informowani drogą elektroniczną. Dalsze korzystanie z usług po wprowadzeniu zmian oznacza akceptację nowych zasad.',
            },
            {
                title: '8. Kontakt',
                text: 'W przypadku pytań dotyczących niniejszych zasad prosimy o kontakt pod adresem: lettinggozenstudio@gmail.com lub poprzez formularz kontaktowy dostępny na stronie.',
            },
        ],
        links: {
            terms: 'Regulamin',
            privacy: 'Polityka Prywatności',
            contact: 'Kontakt',
        },
    },
    en: {
        titleLead: 'Service',
        titleGold: 'Terms',
        intro:
            'These terms set out the conditions under which Letting Go Zen Studio provides its therapeutic and wellness services.',
        effective: 'Effective from: 1 January 2026',
        sections: [
            {
                title: '1. Nature of the Services',
                text: 'The services provided by Letting Go Zen Studio are holistic and wellness in nature. They do not constitute medical advice, diagnosis or treatment within the meaning of medical law. Clients are advised to consult a doctor about any health concerns before using the services.',
            },
            {
                title: '2. Booking and Cancellation',
                text: 'Sessions must be booked in advance through the online booking system. A session may be cancelled free of charge up to 24 hours before the scheduled time. A cancellation made less than 24 hours in advance may incur a charge of 50% of the session price. Failure to attend a booked session without prior cancellation results in the full fee being charged.',
            },
            {
                title: '3. Payments',
                text: 'Payments are taken online through the secure Stripe platform. Accepted payment methods include credit and debit cards (Visa, Mastercard, Amex), Apple Pay and Google Pay. All prices are shown in British pounds (GBP). Invoices are available on request.',
            },
            {
                title: '4. Digital Products',
                text: 'PDF reports and other digital products are delivered electronically once payment is confirmed. Because of the digital nature of these products, the right to withdraw from the contract expires once the file has been accessed, in accordance with applicable law. Download links are valid for 30 days from the time they are sent.',
            },
            {
                title: '5. Liability',
                text: 'To the extent permitted by applicable law, Letting Go Zen Studio accepts no liability for any harm arising from the use of the services. Clients use the services at their own responsibility and must inform the therapist of any conditions that may affect the course of a session.',
            },
            {
                title: '6. Confidentiality',
                text: 'All information shared during a session is treated as confidential. Personal data is processed in accordance with our Privacy Policy and applicable GDPR regulations. Information is not shared with third parties without the client’s explicit consent, except where required by law.',
            },
            {
                title: '7. Changes to These Terms',
                text: 'Letting Go Zen Studio reserves the right to change these terms at any time. Clients will be notified of any significant changes electronically. Continued use of the services after changes are introduced constitutes acceptance of the new terms.',
            },
            {
                title: '8. Contact',
                text: 'If you have any questions about these terms, please contact us at lettinggozenstudio@gmail.com or through the contact form available on the website.',
            },
        ],
        links: {
            terms: 'Terms & Conditions',
            privacy: 'Privacy Policy',
            contact: 'Contact',
        },
    },
}

export default async function ZasadyUslugPage({ params }: Props) {
    const { locale } = await params
    const c = content[locale === 'en' ? 'en' : 'pl']

    return (
        <main className="legal-page">

            <p className="legal-label">
                <span className="legal-label-line" />
                Letting Go Zen Studio
            </p>

            <div className="legal-header">
                <h1 className="legal-title">
                    {c.titleLead} <span>{c.titleGold}</span>
                </h1>
                <p className="legal-intro">{c.intro}</p>
                <p className="legal-effective-date">{c.effective}</p>
            </div>

            <div className="legal-section-list">
                {c.sections.map((section, index) => (
                    <div key={index} className="legal-section-card">
                        <h2 className="legal-section-title">{section.title}</h2>
                        <p className="legal-section-text">{section.text}</p>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <Link href={`/${locale}/regulamin`} className="footer-bottom-link">
                    → {c.links.terms}
                </Link>
                <Link href={`/${locale}/polityka-prywatnosci`} className="footer-bottom-link">
                    → {c.links.privacy}
                </Link>
                <Link href={`/${locale}/kontakt`} className="footer-bottom-link">
                    → {c.links.contact}
                </Link>
            </div>

        </main>
    )
}
