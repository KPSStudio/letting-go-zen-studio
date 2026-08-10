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
        ]
    },
}

export default withNextIntl(nextConfig)
