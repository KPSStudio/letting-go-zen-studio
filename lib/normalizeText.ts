// lib/normalizeText.ts
// Makes search matching accent-insensitive, so "odpornosc" finds "odporność"
// and "latwosc" finds "łatwość".
//
// How it works:
//   1. lowercase everything
//   2. .normalize('NFD') splits an accented letter into base letter + accent mark
//      (e.g. "ś" becomes "s" + a separate combining accent)
//   3. strip those combining accent marks (the \u0300–\u036f range)
//   4. handle "ł" separately — it has no base-letter decomposition, so we map it to "l"
//
// Covers the Polish set: ą ć ę ł ń ó ś ź ż  → a c e l n o s z z

export function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ł/g, 'l')
}
