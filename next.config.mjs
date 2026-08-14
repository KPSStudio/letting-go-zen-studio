// next.config.mjs
// Connects next-intl to Next.js, whitelists the Sanity image CDN, and sets the
// site's baseline security response headers.
//
// NOTE: changes to this file do NOT hot-reload — restart the dev server.

import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/**
 * Baseline security headers.
 *
 * Production was serving HSTS and nothing else — no X-Content-Type-Options, no
 * Referrer-Policy, no Permissions-Policy — while advertising the framework via
 * X-Powered-By.
 *
 * A Content-Security-Policy is deliberately NOT shipped here. This site embeds
 * Stripe Elements, the Cal.com booking widget and the Sanity Studio, and loads
 * Google Fonts and the Sanity image CDN; a CSP written without testing every
 * one of those flows would break payment or booking in production, which is a
 * far worse outcome than the missing header. See docs/RELEASE_AUDIT_2026-08.md
 * for a report-only rollout plan and the exact origins involved.
 */
const securityHeaders = [
    {
        // Stops a browser from second-guessing a declared Content-Type — the
        // defence against a served file being sniffed into executable script.
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        // Send the full URL within our own origin, but only the origin to third
        // parties. Chosen over the stricter no-referrer because checkout pages
        // carry query state we do not want leaking to Stripe/Cal.com, while
        // same-origin analytics and debugging still work.
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        // Deny the device APIs this site has no use for. Note `payment=(self)`:
        // the Payment Request API is what makes Apple Pay and Google Pay work
        // inside Stripe Elements, so it must stay enabled for our own origin.
        key: 'Permissions-Policy',
        value: [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'browsing-topics=()',
            'interest-cohort=()',
            'payment=(self)',
        ].join(', '),
    },
    {
        // Legacy header, still honoured by some intermediaries. Keeps our pages
        // out of other people's frames.
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
    },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Do not advertise the framework and its version.
    poweredByHeader: false,

    eslint: {
        // Kept OFF for the production build. Linting runs as its own step
        // (`npm run lint`) so a lint failure surfaces in CI rather than taking
        // down a deploy. See the audit report.
        ignoreDuringBuilds: true,
    },

    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'cdn.sanity.io' },
        ],
    },

    async headers() {
        return [
            {
                // Every route, including /studio and /api.
                source: '/:path*',
                headers: securityHeaders,
            },
            {
                /*
                 * API responses can carry personal data — a contact message, a
                 * consent record, a PaymentIntent client secret — and must
                 * never sit in a shared or browser cache. Next does not mark
                 * route handlers no-store by default, so an intermediary could
                 * otherwise retain them.
                 *
                 * Applied to /api/* only: pages stay cacheable, and this does
                 * not affect webhook or cron correctness (they are POSTed and
                 * signature-checked regardless).
                 */
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate, private',
                    },
                ],
            },
            {
                // Self-hosted fonts are immutable and content-addressed by
                // filename; a year is safe and avoids refetching them.
                source: '/fonts/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ]
    },
}

export default withNextIntl(nextConfig)
