export const CAL_USERNAME = 'lettinggozenstudio'

export const serviceToCalSlug: Record<string, string> = {
    // Ciało
    'Biorezonans — Sesja 1:1': 'cialo-biorezonans-sesja-1-1',
    'Biofeedback — Skan Ciała': 'cialo-biofeedback-skan-ciala',
    'Biofeedback — Wspierająca Regeneracja': 'cialo-biofeedback-wspierajaca-regeneracja',
    'Presoterapia + Aroma & Hz (30 min)': 'cialo-presoterapia-aroma-hz-30-min',
    'Presoterapia + Aroma & Hz (60 min)': 'cialo-presoterapia-aroma-hz-60-min',
    'Hocell — Inhalacje Wodorem (1 osoba)': 'cialo-hocell-inhalacje-wodorem',
    'Hocell — Inhalacje Wodorem (2 osoby)': 'cialo-hocell-inhalacje-wodorem',
    'Hocell — Pakiet 5 sesji (1 osoba) + 2L wody wodorowej': 'cialo-hocell-inhalacje-wodorem',
    'Hocell — Pakiet 5 sesji (2 osoby) + 2L wody wodorowej': 'cialo-hocell-inhalacje-wodorem',

    // Umysł
    'Hipnoterapia — Sesja 1:1': 'umysl-hipnoterapia-sesja-1-1',
    'Konsultacja Energetyczna': 'umysl-konsultacja-energetyczna',
    'Alchemik — Sesja 1:1': 'umysl-alchemik-sesja-1-1',
    'Alchemik — Pakiet 5 sesji': 'umysl-alchemik-pakiet-5-sesji',

    // Dusza
    'Pakiet Jasność Umysłu': 'dusza-pakiet-jasnosc-umyslu',
    'Zdjęcie i Analiza Aury + Chakr': 'dusza-zdjecie-i-analiza-aury-chakr',
}

export function getCalSlug(serviceName: string): string | null {
    return serviceToCalSlug[serviceName] ?? null
}