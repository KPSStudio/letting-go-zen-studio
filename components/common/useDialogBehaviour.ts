// components/common/useDialogBehaviour.ts
//
// The behaviour a modal dialog needs in order to be usable by keyboard and by
// a screen reader. The four product modals (Ciało, Umysł, Dusza, Sklep) were
// plain <div>s: a sighted mouse user could dismiss them by clicking the
// backdrop, but nobody else could. Specifically they had no dialog role, no
// accessible name, no Escape handling, focus stayed behind on the page that
// opened them, and Tab wandered out into the still-scrollable content behind.
//
// Rather than restructure four different sets of markup, this hook adds the
// behaviour to whatever panel element it is given.
//
// It provides:
//   • Escape to close;
//   • focus moved into the dialog when it opens, and RETURNED to the trigger
//     when it closes (so keyboard users do not get dumped back at the top);
//   • a focus trap, so Tab and Shift+Tab cycle inside the dialog;
//   • a scroll lock on the page behind.
//
// The caller is responsible for the ARIA attributes on the panel itself —
// role="dialog", aria-modal="true" and aria-labelledby — because only the
// caller knows which element holds the title.

'use client'

import { useEffect, useRef } from 'react'

// Elements that can hold focus, in DOM order. `:not([disabled])` matters:
// a disabled buy button must not be a trap stop.
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useDialogBehaviour(isOpen: boolean, onClose: () => void) {
    const panelRef = useRef<HTMLDivElement | null>(null)
    // Whatever had focus before the dialog opened — usually the card's
    // "More info" button.
    const previouslyFocusedRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (!isOpen) return

        const panel = panelRef.current
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null

        // ── Move focus in ──
        // Prefer the first real control; fall back to the panel itself, which
        // the caller gives tabIndex={-1} so it can receive focus.
        const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        ;(firstFocusable ?? panel)?.focus()

        // ── Lock the page behind ──
        // Without this the background scrolls under the dialog on both mouse
        // wheel and touch.
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.stopPropagation()
                onClose()
                return
            }

            if (event.key !== 'Tab') return

            // ── Focus trap ──
            const focusable = Array.from(
                panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
            ).filter((element) => element.offsetParent !== null)

            if (focusable.length === 0) {
                // Nothing to move to; keep focus on the panel.
                event.preventDefault()
                panelRef.current?.focus()
                return
            }

            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            const active = document.activeElement

            if (event.shiftKey && (active === first || active === panelRef.current)) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && active === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = previousOverflow

            // ── Return focus ──
            // Guarded: the trigger may have been unmounted (e.g. the modal's
            // own action navigated away).
            const previous = previouslyFocusedRef.current
            if (previous && document.contains(previous)) {
                previous.focus()
            }
        }
    }, [isOpen, onClose])

    return panelRef
}
