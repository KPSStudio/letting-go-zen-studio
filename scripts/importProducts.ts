// scripts/importProducts.ts
// One-time script to import all hardcoded products into Sanity
// Run once with: npx ts-node --esm scripts/importProducts.ts
// After running, delete this file — data lives in Sanity from now on

import { readFileSync } from 'node:fs'
import { createClient } from '@sanity/client'

// Manually loads .env.local for this one-time import script.
// Next.js loads .env.local automatically, but ts-node scripts do not.
function loadEnvLocal() {
    const envFile = readFileSync('.env.local', 'utf8')

    for (const line of envFile.split('\n')) {
        const trimmedLine = line.trim()

        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue
        }

        const equalsIndex = trimmedLine.indexOf('=')

        if (equalsIndex === -1) {
            continue
        }

        const key = trimmedLine.slice(0, equalsIndex).trim()
        const rawValue = trimmedLine.slice(equalsIndex + 1).trim()
        const value = rawValue.replace(/^["']|["']$/g, '')

        process.env[key] = value
    }
}

loadEnvLocal()

console.log('Sanity project:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
console.log('Sanity dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET)
console.log('Token exists:', Boolean(process.env.SANITY_API_TOKEN))
console.log('Token starts:', process.env.SANITY_API_TOKEN?.slice(0, 8))

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

type ImportProduct = {
    _type: 'service'
    namePl: string
    category: 'body' | 'mind' | 'soul'
    type: 'sesja' | 'pakiet' | 'ebook'
    descPl: string
    priceGBP: number
    pricePLN: number
    duration: string
    availability: string
    pdfNote?: string
    requiresBooking: boolean
    freeConsultation?: string
    includes: string[]
    whoFor: string[]
    warning?: string
    order: number
    isActive: boolean
}

const products: ImportProduct[] = [
    // ── CIAŁO ──
    {
        _type: 'service',
        namePl: 'Biorezonans — Sesja 1:1',
        category: 'body',
        type: 'sesja',
        descPl: 'Biorezonans 1:1 to sesja bezbólowa gdzie twoje ciało niczym "nietoperz" nadaje częstotliwość a biorezonans odczytuje co jest na jego drodze. To szukanie odpowiedzi na przyczynę Dezharmonii w ciele. Skan ciała + raport.',
        priceGBP: 60,
        pricePLN: 310,
        duration: '1h',
        availability: 'Studio',
        pdfNote: 'Skan ciała + raport PDF po sesji',
        requiresBooking: true,
        includes: ['Pełny skan biorezonansowy ciała', 'Analiza 47 narządów', 'Badanie witamin i minerałów', 'Analiza alergii i nietolerancji', 'Raport PDF po sesji'],
        whoFor: ['Osoby szukające przyczyny dolegliwości', 'Profilaktyka zdrowotna', 'Wsparcie układu odpornościowego', 'Analiza poziomu energii'],
        warning: 'Biorezonans ma charakter komplementarny i nie zastępuje diagnozy medycznej.',
        order: 1,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Biofeedback — Skan Ciała',
        category: 'body',
        type: 'sesja',
        descPl: 'Sesja 1:1 w studiu lub online. Skan ciała — przypuszczalne obciążenia i analiza. Odczyt stanu energetycznego organizmu.',
        priceGBP: 80,
        pricePLN: 415,
        duration: '2h',
        availability: 'Studio | Online',
        pdfNote: 'Raport po sesji',
        requiresBooking: true,
        includes: ['Skan biofeedback ciała', 'Analiza przypuszczalnych obciążeń', 'Odczyt stanu energetycznego', 'Raport PDF po sesji'],
        whoFor: ['Osoby z przewlekłym zmęczeniem', 'Analiza stresu i napięć', 'Wsparcie regeneracji'],
        warning: 'Biofeedback ma charakter komplementarny i nie zastępuje diagnozy medycznej.',
        order: 2,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Biofeedback — Wspierająca Regeneracja',
        category: 'body',
        type: 'sesja',
        descPl: 'Sesja wspierająca regenerację organizmu na poziomie bioelektrycznym. Kontynuacja po skanie lub sesja samodzielna.',
        priceGBP: 30,
        pricePLN: 155,
        duration: '1h',
        availability: 'Studio | Online',
        requiresBooking: true,
        includes: ['Sesja regeneracyjna na poziomie bioelektrycznym', 'Wsparcie naturalnych procesów odnowy', 'Może być kontynuacją po skanie'],
        whoFor: ['Osoby po intensywnym wysiłku', 'Wsparcie układu nerwowego', 'Regeneracja po chorobie'],
        warning: 'Sesja ma charakter komplementarny i nie zastępuje diagnozy medycznej.',
        order: 3,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Presoterapia + Aroma & Hz (30 min)',
        category: 'body',
        type: 'sesja',
        descPl: 'Masaż limfatyczny ze skafandrem pneumatycznym. Poprawia krążenie, redukuje cellulit, wspomaga odchudzanie. Aromaterapia i muzykoterapia Hz.',
        priceGBP: 30,
        pricePLN: 155,
        duration: '30 min',
        availability: 'Studio',
        requiresBooking: true,
        includes: ['Masaż pneumatyczny skafandrem z komorami', 'Poprawa krążenia limfy i krwi', 'Redukcja cellulitu i obrzęków', 'Aromaterapia', 'Muzykoterapia Hz'],
        whoFor: ['Cellulit i uczucie ciężkich nóg', 'Wspomaganie odchudzania', 'Usuwanie toksyn', 'Relaksacja'],
        warning: 'Presoterapia jest przeciwwskazana przy zakrzepicy, ciąży i ostrych stanach zapalnych.',
        order: 4,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Presoterapia + Aroma & Hz (60 min)',
        category: 'body',
        type: 'sesja',
        descPl: 'Przedłużona sesja masażu limfatycznego ze skafandrem pneumatycznym. Aromaterapia i muzykoterapia Hz przez całą sesję.',
        priceGBP: 60,
        pricePLN: 310,
        duration: '60 min',
        availability: 'Studio',
        requiresBooking: true,
        includes: ['Przedłużony masaż pneumatyczny', 'Pełna sekwencja komór z różnym ciśnieniem', 'Poprawa krążenia i redukcja cellulitu', 'Aromaterapia przez całą sesję', 'Muzykoterapia Hz'],
        whoFor: ['Intensywna regeneracja', 'Regularne dbanie o sylwetkę', 'Głęboki relaks i detoks'],
        warning: 'Presoterapia jest przeciwwskazana przy zakrzepicy, ciąży i ostrych stanach zapalnych.',
        order: 5,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Hocell — Inhalacje Wodorem (1 osoba)',
        category: 'body',
        type: 'sesja',
        descPl: 'Generator wodoru HOCELL — technologia elektrolizy. Wspiera wydolność, odnowę biologiczną i regenerację całego organizmu.',
        priceGBP: 30,
        pricePLN: 155,
        duration: 'Czas ustalany indywidualnie',
        availability: 'Studio',
        requiresBooking: true,
        includes: ['Inhalacje molekularnym wodorem H2', 'Generator HOCELL — technologia elektrolizy', 'Akcesoria: okulary, kaniulki', 'Wspomaganie układu odpornościowego', 'Dotlenienie i nawodnienie organizmu', 'Spowolnienie procesów starzenia', 'Redukcja chronicznego zmęczenia'],
        whoFor: ['Wydolność i regeneracja', 'Chroniczne zmęczenie', 'Wsparcie samopoczucia', 'Poprawa koncentracji'],
        warning: 'Generator HOCELL wspiera wydolność i regenerację. Skonsultuj się z lekarzem jeśli masz poważne schorzenia.',
        order: 6,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Hocell — Inhalacje Wodorem (2 osoby)',
        category: 'body',
        type: 'sesja',
        descPl: 'Sesja inhalacji wodorem dla dwóch osób jednocześnie. Wspólna regeneracja i odnowa biologiczna.',
        priceGBP: 50,
        pricePLN: 260,
        duration: 'Czas ustalany indywidualnie',
        availability: 'Studio',
        requiresBooking: true,
        includes: ['Inhalacje H2 dla 2 osób jednocześnie', 'Dwa komplety akcesoriów', 'Wspólna regeneracja i odnowa biologiczna'],
        whoFor: ['Pary dbające o zdrowie', 'Przyjaciele i rodzina', 'Wspólna profilaktyka'],
        warning: 'Wodór molekularny wspiera wydolność i regenerację. Skonsultuj się z lekarzem jeśli masz poważne schorzenia.',
        order: 7,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Hocell — Pakiet 5 sesji (1 osoba) + 2L wody wodorowej',
        category: 'body',
        type: 'pakiet',
        descPl: 'Pakiet 5 sesji inhalacji wodorem dla jednej osoby + 2 litry wody wodorowej aktywnej w zestawie.',
        priceGBP: 120,
        pricePLN: 625,
        duration: 'Pakiet 5 sesji',
        availability: 'Studio',
        requiresBooking: true,
        includes: ['5 sesji inhalacji wodorem dla 1 osoby', '2 litry wody wodorowej aktywnej w zestawie', 'Dobrane akcesoria', 'Woda wodorowa nie zmienia pH organizmu'],
        whoFor: ['Regularna profilaktyka', 'Długoterminowe wsparcie zdrowia'],
        warning: 'Woda wodorowa nie zmienia odczynu pH organizmu. Zalecane dzienne spożycie 1-3 litry.',
        order: 8,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Hocell — Pakiet 5 sesji (2 osoby) + 2L wody wodorowej',
        category: 'body',
        type: 'pakiet',
        descPl: 'Pakiet 5 sesji inhalacji wodorem dla dwóch osób + 2 litry wody wodorowej aktywnej w zestawie.',
        priceGBP: 180,
        pricePLN: 935,
        duration: 'Pakiet 5 sesji',
        availability: 'Studio',
        requiresBooking: true,
        includes: ['5 sesji inhalacji dla 2 osób', '2 litry wody wodorowej aktywnej w zestawie', 'Dwa komplety akcesoriów'],
        whoFor: ['Pary i rodziny', 'Regularna wspólna profilaktyka'],
        warning: 'Woda wodorowa nie zmienia odczynu pH organizmu.',
        order: 9,
        isActive: true,
    },

    // ── UMYSŁ ──
    {
        _type: 'service',
        namePl: 'Hipnoterapia — Sesja 1:1',
        category: 'mind',
        type: 'sesja',
        descPl: '"Nie ma pytań bez odpowiedzi..." Nie używam klasycznej formuły hipnozy — wykorzystuję swój dar do przeprowadzenia cię przez zakamarki twojej podświadomości. Bezpłatna 15-minutowa konsultacja wstępna.',
        priceGBP: 120,
        pricePLN: 625,
        duration: '2-3h',
        availability: 'Studio | Online',
        freeConsultation: 'Bezpłatna 15-minutowa konsultacja wstępna',
        requiresBooking: true,
        includes: ['Bezpłatna 15-minutowa konsultacja wstępna', 'Sesja relaksacyjna', 'Sesja reinkarnacyjna', 'Sesja zmiany nawyków', 'Sesja regresyjna', 'Sesja oczyszczająca', 'Schemat sesji ustalany indywidualnie po rozmowie'],
        whoFor: ['Osoby szukające odpowiedzi na pytania i lęki', 'Praca z podświadomością', 'Transformacja blokujących schematów myślowych', 'Głęboka praca z emocjami'],
        warning: 'Sesje są częścią naszej prywatności — to co zostaje wypowiedziane i przeżyte, zmienia patrzenie i czucie świata.',
        order: 1,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Konsultacja Energetyczna',
        category: 'mind',
        type: 'sesja',
        descPl: 'Indywidualna konsultacja dotycząca Twojego pola energetycznego. Analiza blokad, wsparcie w przywróceniu równowagi energetycznej.',
        priceGBP: 60,
        pricePLN: 310,
        duration: '1h',
        availability: 'Online | Studio',
        requiresBooking: true,
        includes: ['Indywidualna konsultacja pola energetycznego', 'Analiza blokad energetycznych', 'Wsparcie w przywróceniu równowagi energetycznej'],
        whoFor: ['Osoby odczuwające blokady energetyczne', 'Wsparcie w równowadze emocjonalnej', 'Analiza stanu energetycznego'],
        order: 2,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Alchemik — Sesja 1:1',
        category: 'mind',
        type: 'sesja',
        descPl: 'Sesja łącząca analizę z określeniem emocji, celów i drogi do odkrycia potencjału. Praca z podświadomością, NLP i energetyką. 1:1 lub online.',
        priceGBP: 30,
        pricePLN: 155,
        duration: '30 min',
        availability: 'Studio | Online',
        requiresBooking: true,
        includes: ['Analiza emocji i celów', 'Praca z podświadomością', 'NLP i energetyka', 'Droga do odkrycia potencjału'],
        whoFor: ['Osoby szukające swojej drogi', 'Praca z emocjami i celami', 'Odkrycie wewnętrznego potencjału'],
        order: 3,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Alchemik — Pakiet 5 sesji',
        category: 'mind',
        type: 'pakiet',
        descPl: 'Pakiet 5 sesji Alchemik po 30 minut. Głęboka transformacja przez analizę emocji, celów i odkrycie wewnętrznego potencjału.',
        priceGBP: 120,
        pricePLN: 625,
        duration: '5 x 30 min',
        availability: 'Studio | Online',
        requiresBooking: true,
        includes: ['5 sesji po 30 minut', 'Głęboka transformacja', 'Analiza emocji i celów', 'Odkrycie wewnętrznego potencjału'],
        whoFor: ['Osoby gotowe na głębszą pracę', 'Długoterminowa transformacja', 'Regularna praca z podświadomością'],
        order: 4,
        isActive: true,
    },

    // ── DUSZA ──
    {
        _type: 'service',
        namePl: 'Pakiet Jasność Umysłu',
        category: 'soul',
        type: 'sesja',
        descPl: '3D Skan Aury + Konsultacja Energetyczna + Terapia Dźwiękiem Kamarton. Pełny obraz stanu energetycznego i plan działania.',
        priceGBP: 60,
        pricePLN: 310,
        duration: '1h',
        availability: 'Studio | Online',
        pdfNote: 'Raport po sesji',
        requiresBooking: true,
        includes: ['3D Skan Aury', 'Konsultacja Energetyczna', 'Terapia Dźwiękiem Kamarton', 'Pełny obraz stanu energetycznego', 'Plan działania', 'Raport po sesji'],
        whoFor: ['Osoby szukające jasności umysłu', 'Analiza stanu energetycznego', 'Równowaga emocjonalna', 'Wsparcie duchowe'],
        warning: 'Sesja ma charakter komplementarny i nie zastępuje diagnozy medycznej.',
        order: 1,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Przeznaczenie — Raport PDF',
        category: 'soul',
        type: 'ebook',
        descPl: 'Szczegółowy raport na podstawie daty, godziny i miejsca urodzenia. Analiza kosmogramu — Twój unikalny profil psychologiczny i osobisty. Raport PDF 20-48 stron.',
        priceGBP: 60,
        pricePLN: 310,
        duration: '30 min + realizacja do 7 dni',
        availability: 'Online',
        pdfNote: 'PDF w języku angielskim, realizacja do 7 dni',
        requiresBooking: false,
        includes: ['Osobowość i temperament', 'Relacje i miłość', 'Kariera i powołanie', 'Finanse i dobrobyt', 'Rodzina i dom', 'Rozwój osobisty', 'Raport PDF 20-48 stron w języku angielskim'],
        whoFor: ['Osoby szukające głębszego zrozumienia siebie', 'Odkrycie potencjału i talentów', 'Zrozumienie swojej ścieżki życia'],
        warning: 'Raport dostarczany wyłącznie w języku angielskim w ciągu 7 dni od zakupu.',
        order: 2,
        isActive: true,
    },
    {
        _type: 'service',
        namePl: 'Zdjęcie i Analiza Aury + Chakr',
        category: 'soul',
        type: 'sesja',
        descPl: 'Sesja 1:1 w studiu. Zdjęcie aury 3D i szczegółowa analiza stanu energetycznego 7 chakr. Otrzymujesz wydruk kolorowego zdjęcia aury.',
        priceGBP: 30,
        pricePLN: 155,
        duration: '30 min',
        availability: 'Studio',
        requiresBooking: true,
        includes: ['Zdjęcie aury 3D', 'Szczegółowa analiza stanu energetycznego', 'Analiza 7 chakr', 'Wydruk kolorowego zdjęcia aury'],
        whoFor: ['Osoby ciekawe swojego stanu energetycznego', 'Analiza chakr', 'Zdjęcie i dokumentacja aury'],
        order: 3,
        isActive: true,
    },
]

async function importProducts() {
    console.log(`Importing ${products.length} products to Sanity...`)

    for (const product of products) {
        const result = await client.create(product)
        console.log(`✅ Created: ${product.namePl} (${result._id})`)
    }

    console.log('✅ All products imported successfully!')
}

importProducts().catch(console.error)