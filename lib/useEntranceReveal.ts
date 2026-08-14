// lib/useEntranceReveal.ts
//
// A one-time entrance animation for a section, powered by Anime.js v4.
//
// Design constraints this hook exists to satisfy:
//
//   • NOTHING is hidden by CSS. Every animated property is given an explicit
//     from-value at animation time (`opacity: [0, 1]`), so if JavaScript never
//     runs, fails, or is disabled, the content is simply already in its final
//     visible state. There is no "reveal" class the page depends on.
//   • It runs ONCE. The observer disconnects on the first intersection, so
//     scrolling away and back does not replay anything.
//   • It respects prefers-reduced-motion by doing nothing at all — not by
//     running a faster animation. In that mode Anime.js is never even
//     downloaded.
//   • Every selector is resolved INSIDE the caller's root element, so a section
//     can never reach into the rest of the page.
//   • Inline styles written by the animation (transform, opacity, and the
//     stroke dash properties used for line drawing) are removed when it
//     finishes, so each element ends at exactly the computed style it had
//     before the hook touched it. That matters here because `.cud-card-icon`
//     has a CSS `:hover` transform — an inline transform left behind would
//     silently outrank it and kill the hover for the rest of the session.
//
// Anime.js is imported dynamically so it is fetched only when motion is
// actually going to be used, and never for reduced-motion visitors.

'use client'

import { useEffect, type RefObject } from 'react'

type Options = {
    /**
     * Selectors revealed in order, each resolved within the root. Every
     * element matching a selector shares that step's position in the sequence,
     * and the elements within a step are staggered.
     *
     * Optional: omit it to draw an SVG without fading anything in, which is
     * what the category page headers do.
     */
    steps?: string[]
    /** Optional selector for SVG geometry to "draw" (paths, circles, rects). */
    drawSelector?: string
    /** Delay between staggered elements, ms. */
    stagger?: number
    /** Vertical travel for the reveal, px. Deliberately small. */
    shift?: number
    /**
     * Optional scale-in, e.g. 0.985. Omit for pure opacity + translate.
     * Kept subtle by design — anything lower reads as a zoom.
     */
    scale?: number
    /**
     * Ceiling on the TOTAL stagger for a collection, ms. A Sanity catalogue
     * can hold dozens of services; at a flat 70ms each, the last card would
     * appear seconds after the first. Past this budget the per-item delay is
     * compressed so a long list finishes in roughly the same time as a short
     * one.
     */
    maxTotalStagger?: number
}

// A shared frozen default, so omitting `steps` does not hand the effect a new
// array identity on every render and re-run it.
const EMPTY_STEPS: string[] = []

/**
 * The geometry inside a category page's header glyph. Shared by the Ciało,
 * Umysł and Dusza pages so the three behave identically, and scoped tightly
 * enough that it can never match another SVG on the page.
 */
export const CATEGORY_ICON_DRAW =
    '.category-header-icon svg path, .category-header-icon svg circle, .category-header-icon svg rect'

export function useEntranceReveal(
    rootRef: RefObject<HTMLElement | null>,
    {
        steps = EMPTY_STEPS,
        drawSelector,
        stagger: staggerMs = 70,
        shift = 12,
        scale,
        maxTotalStagger = 520,
    }: Options,
) {
    useEffect(() => {
        const root = rootRef.current
        if (!root) return

        // Reduced motion, or a browser without IntersectionObserver: leave the
        // content exactly as rendered. No hiding, no library download.
        if (typeof window === 'undefined') return
        if (!('IntersectionObserver' in window)) return
        const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        if (reduceQuery.matches) return

        let cancelled = false
        // Guards against React's development double-mount running the
        // animation twice on the same elements.
        let started = false
        const cleanups: Array<() => void> = []
        // Separate from `cleanups`: Anime's `revert()` restores the values an
        // element had BEFORE the animation, which here is the hidden state
        // this hook applied itself. Reverting alone therefore re-hides the
        // content. These strip the inline styles afterwards so elements end up
        // back on their stylesheet values, and they must run LAST.
        const restorers: Array<() => void> = []

        // Start fetching Anime.js immediately rather than waiting for the
        // intersection, so the module is ready the moment the section appears
        // and the first animated frame is not delayed by a network round trip.
        // Submodule entry points rather than the package barrel, so only the
        // animation engine, the stagger helper and the SVG drawable helper are
        // pulled in — not the timeline, draggable, scroll or text modules.
        const modulePromise = Promise.all([
            import('animejs/animation'),
            import('animejs/utils'),
            import('animejs/svg'),
        ]).then(([animation, utils, svgMod]) => ({
            animate: animation.animate,
            stagger: utils.stagger,
            svg: svgMod,
        }))

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting) || started) return
                started = true
                // One-shot: never replay on scroll back.
                observer.disconnect()

                modulePromise
                    .then(({ animate, stagger, svg }) => {
                        if (cancelled) return

                        const stepEls = steps.map((selector) =>
                            Array.from(root.querySelectorAll<HTMLElement>(selector)),
                        )
                        const allEls = stepEls.flat()
                        const shapes = drawSelector
                            ? Array.from(root.querySelectorAll<SVGGeometryElement>(drawSelector))
                                  .filter((el) => typeof el.getTotalLength === 'function')
                            : []

                        // Returns every touched element to its stylesheet state.
                        // Anime writes the dash values as ATTRIBUTES on SVG
                        // geometry (not inline style), so they have to be
                        // removed as attributes or they linger in the markup.
                        const restore = () => {
                            allEls.forEach((el) => {
                                el.style.removeProperty('opacity')
                                el.style.removeProperty('transform')
                                el.style.removeProperty('translate')
                                el.style.removeProperty('will-change')
                            })
                            shapes.forEach((el) => {
                                el.removeAttribute('stroke-dasharray')
                                el.removeAttribute('stroke-dashoffset')
                                el.style.removeProperty('stroke-dasharray')
                                el.style.removeProperty('stroke-dashoffset')
                            })
                        }

                        restorers.push(restore)

                        try {
                            // Hide everything in ONE synchronous pass before any
                            // staggered animation starts. Without this, an element
                            // whose delay has not elapsed yet keeps showing its
                            // final state and then visibly snaps to hidden when
                            // its turn arrives.
                            const hiddenTransform = scale
                                ? `translateY(${shift}px) scale(${scale})`
                                : `translateY(${shift}px)`
                            allEls.forEach((el) => {
                                el.style.opacity = '0'
                                el.style.transform = hiddenTransform
                                // Promoted only for the duration of the
                                // animation; `restore()` strips it again so
                                // dozens of cards are not left on their own
                                // compositor layers.
                                el.style.willChange = 'opacity, transform'
                            })

                            let remaining = 0
                            const finished = () => {
                                remaining -= 1
                                if (remaining === 0) restore()
                            }

                            // ── Line drawing ──────────────────────────────
                            if (shapes.length) {
                                const drawables = svg.createDrawable(shapes)
                                remaining += 1
                                const drawing = animate(drawables, {
                                    draw: ['0 0', '0 1'],
                                    duration: 900,
                                    delay: stagger(28),
                                    ease: 'outQuad',
                                    onComplete: finished,
                                })
                                cleanups.push(() => drawing.revert())
                            }

                            // ── Content reveal ────────────────────────────
                            stepEls.forEach((els, stepIndex) => {
                                if (!els.length) return
                                remaining += 1
                                // Compress the per-item delay so a long list
                                // still finishes within the stagger budget.
                                const perItem =
                                    els.length > 1
                                        ? Math.min(
                                              staggerMs,
                                              maxTotalStagger / (els.length - 1),
                                          )
                                        : staggerMs

                                const reveal = animate(els, {
                                    opacity: [0, 1],
                                    translateY: [shift, 0],
                                    ...(scale ? { scale: [scale, 1] } : {}),
                                    duration: 620,
                                    delay: stagger(perItem, {
                                        start: stepIndex * perItem * 1.6,
                                    }),
                                    ease: 'outCubic',
                                    onComplete: finished,
                                })
                                cleanups.push(() => reveal.revert())
                            })

                            // Nothing to animate after all: undo the hide.
                            if (remaining === 0) restore()
                        } catch {
                            // If anything above throws we must not leave the
                            // page holding hidden content.
                            restore()
                        }
                    })
                    .catch(() => {
                        // The chunk failed to load. Nothing was hidden, because
                        // hiding only happens once the module has resolved.
                    })
            },
            // Fire slightly BEFORE the section scrolls into view (the positive
            // bottom margin extends the root box downwards). The hide-then-fade
            // therefore begins just off-screen, so a visitor only ever sees the
            // fade in — never the final state flashing first. A negative margin
            // here would trigger after the section is already on screen, which
            // is exactly when that flash becomes visible.
            { threshold: 0, rootMargin: '0px 0px 10% 0px' },
        )

        observer.observe(root)

        // If the visitor turns reduced motion ON mid-session, stop immediately
        // and put everything back to its final visible state.
        const onPreferenceChange = (event: MediaQueryListEvent) => {
            if (!event.matches) return
            cancelled = true
            observer.disconnect()
            cleanups.forEach((fn) => {
                try {
                    fn()
                } catch {
                    // Already finished; nothing to undo.
                }
            })
            restorers.forEach((fn) => {
                try {
                    fn()
                } catch {
                    // Nothing left to strip.
                }
            })
        }
        reduceQuery.addEventListener('change', onPreferenceChange)

        return () => {
            cancelled = true
            observer.disconnect()
            reduceQuery.removeEventListener('change', onPreferenceChange)
            cleanups.forEach((fn) => {
                try {
                    fn()
                } catch {
                    // revert() on an already-finished animation is harmless.
                }
            })
            restorers.forEach((fn) => {
                try {
                    fn()
                } catch {
                    // Nothing left to strip.
                }
            })
        }
    }, [rootRef, steps, drawSelector, staggerMs, shift, scale, maxTotalStagger])
}
