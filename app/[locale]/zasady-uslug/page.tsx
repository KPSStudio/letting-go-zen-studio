// app/[locale]/zasady-uslug/page.tsx
// Service Terms page — outlines terms specific to Joanna's therapy services.
// Needs legal review before going live.

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

type Props = {
    params: Promise<{ locale: string }>
}

export default async function ZasadyUslugPage({ params }: Props) {
    const { locale } = await params
    const t = await getTranslations('footer')

    return (
        <main className="legal-page">

            <p className="legal-label">
                <span className="legal-label-line" />
                Letting Go Zen Studio
            </p>

            <div className="legal-header">
                <h1 className="legal-title">
                    Zasady <span>Usług</span>
                </h1>
                <p className="legal-intro">
                    Niniejsze zasady określają warunki świadczenia usług terapeutycznych i wellness przez Letting Go Zen Studio.
                </p>
                <p className="legal-effective-date">Obowiązuje od: 1 stycznia 2026</p>
            </div>

            <div className="legal-section-list">

                <div className="legal-section-card">
                    <h2 className="legal-section-title">1. Charakter Usług</h2>
                    <p className="legal-section-text">
                        Usługi świadczone przez Letting Go Zen Studio mają charakter holistyczny i wellness. Nie stanowią one porady medycznej, diagnozy ani leczenia w rozumieniu prawa medycznego. Klientom zaleca się konsultację z lekarzem w przypadku jakichkolwiek problemów zdrowotnych przed skorzystaniem z usług.
                    </p>
                </div>

                <div className="legal-section-card">
                    <h2 className="legal-section-title">2. Rezerwacja i Odwoływanie</h2>
                    <p className="legal-section-text">
                        Sesje należy rezerwować z wyprzedzeniem za pośrednictwem systemu rezerwacji online. Odwołanie sesji jest możliwe do 24 godzin przed planowanym terminem bez ponoszenia opłat. Odwołanie w terminie krótszym niż 24 godziny może skutkować pobraniem opłaty w wysokości 50% wartości sesji. Niestawienie się na umówioną sesję bez wcześniejszego odwołania skutkuje pobraniem pełnej opłaty.
                    </p>
                </div>

                <div className="legal-section-card">
                    <h2 className="legal-section-title">3. Płatności</h2>
                    <p className="legal-section-text">
                        Płatności przyjmowane są online za pośrednictwem bezpiecznej platformy Stripe. Akceptowane metody płatności obejmują karty kredytowe i debetowe (Visa, Mastercard, Amex), Apple Pay oraz Google Pay. Wszystkie ceny podane są w funtach brytyjskich (GBP). Faktury dostępne są na życzenie.
                    </p>
                </div>

                <div className="legal-section-card">
                    <h2 className="legal-section-title">4. Produkty Cyfrowe</h2>
                    <p className="legal-section-text">
                        Raporty PDF i inne produkty cyfrowe dostarczane są drogą elektroniczną po potwierdzeniu płatności. Ze względu na cyfrowy charakter produktów, po uzyskaniu dostępu do pliku prawo do odstąpienia od umowy wygasa zgodnie z obowiązującymi przepisami prawa. Linki do pobrania są ważne przez 24 godziny od momentu wysłania.
                    </p>
                </div>

                <div className="legal-section-card">
                    <h2 className="legal-section-title">5. Odpowiedzialność</h2>
                    <p className="legal-section-text">
                        Letting Go Zen Studio nie ponosi odpowiedzialności za jakiekolwiek szkody wynikające z korzystania z usług, w zakresie dozwolonym przez obowiązujące prawo. Klient korzysta z usług na własną odpowiedzialność i zobowiązany jest do poinformowania terapeuty o wszelkich schorzeniach, które mogą mieć wpływ na przebieg sesji.
                    </p>
                </div>

                <div className="legal-section-card">
                    <h2 className="legal-section-title">6. Poufność</h2>
                    <p className="legal-section-text">
                        Wszystkie informacje przekazane podczas sesji traktowane są jako poufne. Dane osobowe przetwarzane są zgodnie z naszą Polityką Prywatności i obowiązującymi przepisami RODO. Informacje nie są udostępniane osobom trzecim bez wyraźnej zgody klienta, z wyjątkiem przypadków wymaganych przez prawo.
                    </p>
                </div>

                <div className="legal-section-card">
                    <h2 className="legal-section-title">7. Zmiany Zasad</h2>
                    <p className="legal-section-text">
                        Letting Go Zen Studio zastrzega sobie prawo do zmiany niniejszych zasad w dowolnym czasie. O istotnych zmianach klienci będą informowani drogą elektroniczną. Dalsze korzystanie z usług po wprowadzeniu zmian oznacza akceptację nowych zasad.
                    </p>
                </div>

                <div className="legal-section-card">
                    <h2 className="legal-section-title">8. Kontakt</h2>
                    <p className="legal-section-text">
                        W przypadku pytań dotyczących niniejszych zasad prosimy o kontakt pod adresem: joanna@lettinggozenstudio.com lub poprzez formularz kontaktowy dostępny na stronie.
                    </p>
                </div>

            </div>

            <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <Link href={`/${locale}/regulamin`} className="footer-bottom-link">
                    → Regulamin
                </Link>
                <Link href={`/${locale}/polityka-prywatnosci`} className="footer-bottom-link">
                    → Polityka Prywatności
                </Link>
                <Link href={`/${locale}/kontakt`} className="footer-bottom-link">
                    → Kontakt
                </Link>
            </div>

        </main>
    )
}