// components/layout/SiteLightRay.tsx
//
// The site-wide ray of light, plus two restrained desktop-only reactions:
// a scroll parallax and a pointer response.
//
// The ray itself is entirely CSS (see .site-light-ray in app/globals.css). This
// component adds nothing visual on its own — it only writes CSS custom
// properties onto the wrapper:
//
//   --ray-shift-x / --ray-shift-y       scroll offset, ALONG the diagonal
//   --ray-pointer-x / --ray-pointer-y   pointer offset, ACROSS the diagonal
//   --ray-scroll-opacity                wrapper opacity, 1.00 down to 0.92
//
// The stylesheet sums the two offsets in one translate3d(). They are kept as
// separate variables on purpose: scroll and pointer update at different times
// and from different sources, and combining them in JS would make each one
// clobber the other's contribution.
//
// WHY THE TWO OFFSETS USE DIFFERENT BEARINGS
//
// The shaft is parallel to the top-left -> bottom-right diagonal.
//
//   * SCROLL shifts ALONG that diagonal. Translating a stripe along its own
//     axis maps it onto itself, so the band stays exactly on the diagonal and
//     only the masked head/tail slide. That is deliberate — it reads as the
//     light reaching further, not as the whole beam sliding about. It also
//     means the scroll offset barely changes the ray's apparent position.
//
//   * POINTER shifts ACROSS it, along the perpendicular n = (-d.y, d.x).
//     Moving perpendicular to a stripe is the only direction that visibly
//     displaces it, which is what makes the pointer response readable at a
//     very small amplitude.
//
// Both bearings derive from the viewport's own diagonal, recomputed on resize,
// never per event — so the geometry stays correct on every aspect ratio.
//
// No React state is touched while moving. Everything is a direct style write on
// a ref inside one rAF, so neither scrolling nor pointer movement re-renders.

'use client'

import { useEffect, useRef } from 'react'

/** Both reactions are desktop-only; 768px and below is treated as mobile. */
const DESKTOP_MIN_WIDTH = 769

/** Maximum scroll travel along the diagonal, in px, at full page progress. */
const MAX_SCROLL_SHIFT_PX = 26

/** Maximum pointer travel across the diagonal, in px, at either extreme. */
const MAX_POINTER_SHIFT_PX = 22

/** Maximum wrapper opacity swing: 1.00 at the top to 0.92 at the bottom. */
const MAX_OPACITY_DELTA = 0.08

/**
 * Per-frame easing for the pointer. The raw pointer value jumps as fast as the
 * mouse does; following a fraction of the remaining distance each frame turns
 * that into a slow drift, which is what keeps the effect calm rather than
 * twitchy. Also used to glide back to rest on pointerleave.
 */
const POINTER_EASING = 0.075

/** Below this, treat the pointer as settled and stop the animation loop. */
const SETTLE_EPSILON = 0.001

export default function SiteLightRay() {
    const rayRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const ray = rayRef.current
        if (!ray) return

        // matchMedia is only ever reached inside useEffect, so the server render
        // and the first client render are identical — no hydration difference.
        const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`)
        const motionQuery = window.matchMedia('(prefers-reduced-motion: no-preference)')
        // A fine hoverable pointer means a real mouse or trackpad. Touch screens
        // and pen input report otherwise, and a hover effect they cannot produce
        // should not cost them a listener.
        const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')

        let scrollFrame = 0
        let pointerFrame = 0
        let scrollListening = false
        let pointerListening = false

        // Unit vector along the viewport diagonal, and its perpendicular.
        // Seeded at 45deg so the values are never NaN before first measurement.
        let diagonalX = Math.SQRT1_2
        let diagonalY = Math.SQRT1_2

        // Pointer projection onto the perpendicular, in [-1, 1]. `target` is
        // where the pointer says it should be; `current` is where the eased
        // animation has actually reached.
        let pointerTarget = 0
        let pointerCurrent = 0

        function measureDiagonal() {
            const width = window.innerWidth
            const height = window.innerHeight
            const hypotenuse = Math.hypot(width, height) || 1
            diagonalX = width / hypotenuse
            diagonalY = height / hypotenuse
        }

        // ── SCROLL ──────────────────────────────────────────────────────────
        function applyScrollProgress() {
            if (!ray) return

            const scrollable =
                document.documentElement.scrollHeight - window.innerHeight

            // A page shorter than the viewport has no progress to report; leaving
            // it at 0 keeps the ray in its resting position rather than snapping.
            const progress =
                scrollable > 0
                    ? Math.min(1, Math.max(0, window.scrollY / scrollable))
                    : 0

            const shift = progress * MAX_SCROLL_SHIFT_PX

            ray.style.setProperty('--ray-shift-x', `${(shift * diagonalX).toFixed(2)}px`)
            ray.style.setProperty('--ray-shift-y', `${(shift * diagonalY).toFixed(2)}px`)
            ray.style.setProperty(
                '--ray-scroll-opacity',
                (1 - MAX_OPACITY_DELTA * progress).toFixed(4)
            )
        }

        // Coalesces a burst of scroll events into one write per frame.
        function handleScroll() {
            if (scrollFrame) return
            scrollFrame = window.requestAnimationFrame(() => {
                scrollFrame = 0
                applyScrollProgress()
            })
        }

        // ── POINTER ─────────────────────────────────────────────────────────
        function writePointerOffset() {
            if (!ray) return

            const offset = pointerCurrent * MAX_POINTER_SHIFT_PX

            // n = (-d.y, d.x): the perpendicular to the diagonal, so the ray
            // slides ACROSS its own shaft rather than along it.
            ray.style.setProperty('--ray-pointer-x', `${(offset * -diagonalY).toFixed(2)}px`)
            ray.style.setProperty('--ray-pointer-y', `${(offset * diagonalX).toFixed(2)}px`)
        }

        // Runs only while the pointer offset is still catching up, then stops.
        function stepPointer() {
            pointerFrame = 0

            const distance = pointerTarget - pointerCurrent

            if (Math.abs(distance) < SETTLE_EPSILON) {
                pointerCurrent = pointerTarget
                writePointerOffset()
                return
            }

            pointerCurrent += distance * POINTER_EASING
            writePointerOffset()
            pointerFrame = window.requestAnimationFrame(stepPointer)
        }

        function requestPointerFrame() {
            if (pointerFrame) return
            pointerFrame = window.requestAnimationFrame(stepPointer)
        }

        function handlePointerMove(event: PointerEvent) {
            // Ignore touch and pen; this is a mouse/trackpad affordance.
            if (event.pointerType !== 'mouse') return

            // Normalised pointer position, centre-origin, each axis in [-1, 1].
            const nx = (event.clientX / window.innerWidth) * 2 - 1
            const ny = (event.clientY / window.innerHeight) * 2 - 1

            // Project onto the perpendicular n = (-d.y, d.x). The result is how
            // far the cursor sits to one side of the diagonal, which is exactly
            // the axis we want to move the shaft along.
            const projection = nx * -diagonalY + ny * diagonalX

            pointerTarget = Math.min(1, Math.max(-1, projection))
            requestPointerFrame()
        }

        // Glide back to centre rather than snapping when the cursor leaves.
        function handlePointerLeave() {
            pointerTarget = 0
            requestPointerFrame()
        }

        function handleResize() {
            measureDiagonal()
            handleScroll()
            // Re-express the current pointer offset against the new geometry.
            if (pointerListening) writePointerOffset()
        }

        // ── START / STOP ────────────────────────────────────────────────────
        function stopScroll() {
            if (!scrollListening) return
            scrollListening = false

            window.removeEventListener('scroll', handleScroll)

            if (scrollFrame) {
                window.cancelAnimationFrame(scrollFrame)
                scrollFrame = 0
            }

            ray?.style.removeProperty('--ray-shift-x')
            ray?.style.removeProperty('--ray-shift-y')
            ray?.style.removeProperty('--ray-scroll-opacity')
        }

        function startScroll() {
            if (scrollListening) return
            scrollListening = true

            window.addEventListener('scroll', handleScroll, { passive: true })
            // Set the initial position immediately: the page may already be
            // scrolled (a restored position, or a #hash landing).
            applyScrollProgress()
        }

        function stopPointer() {
            if (!pointerListening) return
            pointerListening = false

            window.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerleave', handlePointerLeave)
            window.removeEventListener('blur', handlePointerLeave)

            if (pointerFrame) {
                window.cancelAnimationFrame(pointerFrame)
                pointerFrame = 0
            }

            pointerTarget = 0
            pointerCurrent = 0
            ray?.style.removeProperty('--ray-pointer-x')
            ray?.style.removeProperty('--ray-pointer-y')
        }

        function startPointer() {
            if (pointerListening) return
            pointerListening = true

            window.addEventListener('pointermove', handlePointerMove, { passive: true })
            // Fires when the cursor leaves the document entirely.
            document.addEventListener('pointerleave', handlePointerLeave)
            // Alt-tabbing away leaves no pointerleave, so rest on blur too.
            window.addEventListener('blur', handlePointerLeave)
        }

        // Re-evaluated whenever the width crosses 768/769, the OS motion
        // preference changes, or the input capabilities change (a tablet gaining
        // a mouse), so everything switches cleanly without a reload.
        function syncBehaviour() {
            const motionAllowed = motionQuery.matches
            const desktop = desktopQuery.matches

            if (desktop && motionAllowed) {
                measureDiagonal()
                startScroll()
            } else {
                stopScroll()
            }

            if (desktop && motionAllowed && finePointerQuery.matches) {
                measureDiagonal()
                startPointer()
            } else {
                stopPointer()
            }

            // Resize only matters while something is actually reacting.
            window.removeEventListener('resize', handleResize)
            if (scrollListening || pointerListening) {
                window.addEventListener('resize', handleResize, { passive: true })
            }
        }

        syncBehaviour()
        desktopQuery.addEventListener('change', syncBehaviour)
        motionQuery.addEventListener('change', syncBehaviour)
        finePointerQuery.addEventListener('change', syncBehaviour)

        return () => {
            desktopQuery.removeEventListener('change', syncBehaviour)
            motionQuery.removeEventListener('change', syncBehaviour)
            finePointerQuery.removeEventListener('change', syncBehaviour)
            window.removeEventListener('resize', handleResize)
            stopScroll()
            stopPointer()
        }
    }, [])

    return <div ref={rayRef} className="site-light-ray" aria-hidden="true" />
}
