// lib/useLogoReveal.ts
//
// The homepage emblem reveal.
//
// IMPORTANT — this is a REVEAL, not SVG path drawing.
//
// The brand mark exists only as `public/images/logo.png`, a raster file. There
// is no vector version in the repository, so there are no paths to draw. Anime
// .js's `createDrawable` needs real SVG geometry (`getTotalLength()`), which a
// PNG cannot provide. Rather than auto-tracing the official mark — which would
// produce an approximation of Joanna's brand identity that nobody approved —
// this animates a soft-edged mask sweeping up the image, so the emblem appears
// to be drawn into view while the pixels stay untouched.
//
// To get a genuine draw-on effect, the original vector artwork (.svg/.ai/.eps)
// would be needed from Joanna; then this could be swapped for the same
// `useEntranceReveal` drawSelector path the other icons use.
//
// THE LOCKUP
//
// The emblem and the words "Letting Go / Zen Studio" are one brand lockup, so
// they arrive as one. Previously only the emblem animated: the largest element
// on the page — the gold wordmark — simply sat there fully formed while the mark
// above it drew itself in, which read as two unrelated events.
//
// The eyebrow and the wordmark are therefore driven from the SAME progress value
// as the mask sweep rather than from a second animation. There is no second
// timeline to drift, and the name finishes resolving just before the emblem
// settles, so the composition lands as a single moment.
//
// Behaviour matches the rest of the motion system:
//   • runs once, on initial homepage entry;
//   • nothing is hidden by CSS, so the lockup is fully visible without JS;
//   • prefers-reduced-motion skips it entirely and never loads Anime.js;
//   • all inline styles are removed on completion, so the settled lockup is
//     pixel-identical to the static version.

'use client'

import { useEffect, type RefObject } from 'react'

/** Distance the name travels as it resolves, px. Deliberately small. */
const LOCKUP_SHIFT = 14

export function useLogoReveal(
    targetRef: RefObject<HTMLElement | null>,
    /**
     * The hero content column. The eyebrow and wordmark inside it join the
     * emblem's reveal. Optional: omit it and only the emblem animates.
     */
    lockupRef?: RefObject<HTMLElement | null>,
) {
    useEffect(() => {
        const el = targetRef.current
        if (!el) return
        if (typeof window === 'undefined') return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        // Scoped inside the caller's element, so this can never reach into the
        // rest of the page — same rule the other motion hook follows.
        const lockup = lockupRef?.current
            ? Array.from(
                  lockupRef.current.querySelectorAll<HTMLElement>(
                      '.hero-tagline-wrap, .hero-wordmark',
                  ),
              )
            : []

        let cancelled = false
        let reverted = false

        // The mask is what produces the "being drawn" impression: a soft band
        // sweeps from the bottom of the emblem to the top. Masking is
        // compositor-friendly and, unlike animating height or clip rectangles,
        // never affects layout.
        const setMask = (value: string) => {
            el.style.setProperty('-webkit-mask-image', value)
            el.style.setProperty('mask-image', value)
        }
        const clearInline = () => {
            if (reverted) return
            reverted = true
            el.style.removeProperty('-webkit-mask-image')
            el.style.removeProperty('mask-image')
            el.style.removeProperty('opacity')
            el.style.removeProperty('filter')
            lockup.forEach((node) => {
                node.style.removeProperty('opacity')
                node.style.removeProperty('transform')
                node.style.removeProperty('will-change')
            })
        }

        // Hidden SYNCHRONOUSLY, before the Anime.js chunk is requested — unlike
        // the emblem, whose mask can wait. The wordmark is the biggest thing on
        // the screen, so hiding it only after a network round trip would show
        // the finished name and then visibly snap it away to animate it back in.
        // If the chunk never arrives, the .catch below puts it straight back.
        lockup.forEach((node) => {
            node.style.opacity = '0'
            node.style.transform = `translateY(${LOCKUP_SHIFT}px)`
            node.style.willChange = 'opacity, transform'
        })

        import('animejs/animation')
            .then(({ animate }) => {
                if (cancelled) return
                try {
                    const progress = { value: 0 }

                    animate(progress, {
                        value: [0, 1],
                        duration: 1500,
                        ease: 'inOutQuad',
                        onUpdate: () => {
                            // A gradient whose opaque edge climbs the element.
                            // The 14% feather is what keeps the leading edge
                            // soft rather than a hard wipe line.
                            const p = progress.value * 114 - 14
                            setMask(
                                `linear-gradient(to top, #000 ${p}%, rgba(0,0,0,0.35) ${p + 7}%, transparent ${p + 14}%)`,
                            )
                            el.style.opacity = String(Math.min(1, 0.25 + progress.value * 1.1))

                            // The name resolves across the middle of the sweep:
                            // it starts once the mark is legible and has fully
                            // arrived by 85%, so it settles WITH the emblem
                            // rather than trailing after it. Smoothstepped, so
                            // it eases at both ends instead of appearing to
                            // start and stop abruptly mid-sweep.
                            const raw = (progress.value - 0.2) / 0.65
                            const t = Math.min(1, Math.max(0, raw))
                            const eased = t * t * (3 - 2 * t)
                            lockup.forEach((node) => {
                                node.style.opacity = String(eased)
                                node.style.transform = `translateY(${(1 - eased) * LOCKUP_SHIFT}px)`
                            })
                        },
                        onComplete: () => {
                            // A very gentle settle: the glow eases off rather
                            // than snapping. No scaling, rotation or bounce —
                            // the mark itself is never distorted.
                            animate(el, {
                                filter: [
                                    'drop-shadow(0 0 26px rgba(240,208,128,0.5))',
                                    'drop-shadow(0 0 0px rgba(240,208,128,0))',
                                ],
                                duration: 900,
                                ease: 'outQuad',
                                onComplete: clearInline,
                            })
                        },
                    })
                } catch {
                    clearInline()
                }
            })
            .catch(() => {
                // Chunk failed to load. The emblem was never hidden, but the
                // lockup was hidden synchronously above — put it back, or the
                // brand name would never appear at all.
                clearInline()
            })

        return () => {
            cancelled = true
            clearInline()
        }
    }, [targetRef])
}
