// components/layout/NavSearch.tsx
// Site-wide search for the navigation bar.
// Searches bookable services (Body/Mind/Soul) + shop products, fed in as a
// prop from the layout. Two modes:
//   - 'icon'   : a magnifier button that expands into a dropdown (desktop)
//   - 'inline' : an always-open full-width box (inside the mobile drawer)
// Results link to the relevant section page (/body, /mind, /soul, /sklep).

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { normalizeText } from '@/lib/normalizeText'

export type SearchItem = {
    id: string
    namePl: string
    nameEn?: string
    descPl?: string
    descEn?: string
    keywords?: string[]
    includes?: string[]
    kind: 'service' | 'product'
    category?: 'body' | 'mind' | 'soul'
    href: string // section path WITHOUT locale, e.g. '/body' or '/sklep'
}

type Props = {
    items: SearchItem[]
    mode?: 'icon' | 'inline'
}

export default function NavSearch({ items, mode = 'icon' }: Props) {
    const router = useRouter()
    const locale = useLocale()
    const isInline = mode === 'inline'

    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const labels =
        locale === 'en'
            ? {
                placeholder: 'Search sessions & products…',
                aria: 'Search',
                none: 'No matches found',
            }
            : {
                placeholder: 'Szukaj sesji i produktów…',
                aria: 'Szukaj',
                none: 'Brak wyników',
            }

    const tagLabels: Record<string, string> =
        locale === 'en'
            ? { body: 'Body', mind: 'Mind', soul: 'Soul', product: 'Shop' }
            : { body: 'Ciało', mind: 'Umysł', soul: 'Dusza', product: 'Sklep' }

    // Focus the input when the icon panel opens.
    useEffect(() => {
        if (open && !isInline) inputRef.current?.focus()
    }, [open, isInline])

    // Close on outside click / Escape (icon mode only).
    useEffect(() => {
        if (isInline || !open) return

        function onPointerDown(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false)
            }
        }
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open, isInline])

    // Filter + rank, same scoring idea as the shop search.
    const results = useMemo(() => {
        const cleaned = normalizeText(query.trim())
        if (!cleaned) return []

        const terms = cleaned.split(/\s+/).filter(Boolean)

        function scoreItem(item: SearchItem): number {
            const name = normalizeText(`${item.namePl} ${item.nameEn ?? ''}`)
            const keywords = normalizeText((item.keywords ?? []).join(' '))
            const includes = normalizeText((item.includes ?? []).join(' '))
            const desc = normalizeText(`${item.descPl ?? ''} ${item.descEn ?? ''}`)

            let score = 0
            for (const term of terms) {
                if (name.includes(term)) score += 5
                if (keywords.includes(term)) score += 4
                if (includes.includes(term)) score += 2
                if (desc.includes(term)) score += 1
            }
            return score
        }

        return items
            .map(item => ({ item, score: scoreItem(item) }))
            .filter(entry => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map(entry => entry.item)
    }, [items, query])

    function getName(item: SearchItem) {
        return locale === 'en' && item.nameEn ? item.nameEn : item.namePl
    }

    function getTag(item: SearchItem) {
        if (item.kind === 'product') return tagLabels.product
        return item.category ? tagLabels[item.category] : ''
    }

    function goToItem(item: SearchItem) {
        setQuery('')
        if (!isInline) setOpen(false)
        router.push(`/${locale}${item.href}?item=${encodeURIComponent(item.id)}`)
    }

    const showPanel = isInline || open

    const panel = (
        <div className="nav-search-panel">
            <div className="nav-search-field">
                <svg className="nav-search-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>

                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder={labels.placeholder}
                    className="nav-search-input"
                    aria-label={labels.aria}
                />

                {query.trim() && (
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="nav-search-clear"
                        aria-label={labels.aria}
                    >
                        ×
                    </button>
                )}
            </div>

            {query.trim() && (
                <ul className="nav-search-results">
                    {results.length === 0 ? (
                        <li className="nav-search-empty">{labels.none}</li>
                    ) : (
                        results.map(item => (
                            <li key={`${item.kind}-${item.id}`}>
                                <button
                                    type="button"
                                    className="nav-search-result"
                                    onClick={() => goToItem(item)}
                                >
                                    <span className="nav-search-result-name">
                                        {getName(item)}
                                    </span>
                                    <span className="nav-search-result-tag">
                                        {getTag(item)}
                                    </span>
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    )

    return (
        <div
            ref={containerRef}
            className={isInline ? 'nav-search nav-search--inline' : 'nav-search'}
        >
            {!isInline && (
                <button
                    type="button"
                    className="nav-search-toggle"
                    aria-label={labels.aria}
                    aria-expanded={open}
                    onClick={() => setOpen(value => !value)}
                >
                    <svg
                        className="nav-search-toggle-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <line x1="16.5" y1="16.5" x2="21" y2="21" />
                    </svg>
                </button>
            )}

            {showPanel && panel}
        </div>
    )
}
