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
// Behaviour matches the rest of the motion system:
//   • runs once, on initial homepage entry;
//   • nothing is hidden by CSS, so the logo is fully visible without JS;
//   • prefers-reduced-motion skips it entirely and never loads Anime.js;
//   • all inline styles are removed on completion, so the settled logo is
//     pixel-identical to the static version.

'use client'

import { useEffect, type RefObject } from 'react'

export function useLogoReveal(targetRef: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const el = targetRef.current
        if (!el) return
        if (typeof window === 'undefined') return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

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
        }

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
                // Chunk failed to load; nothing was ever hidden.
            })

        return () => {
            cancelled = true
            clearInline()
        }
    }, [targetRef])
}
