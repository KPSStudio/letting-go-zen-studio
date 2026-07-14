// next.config.mjs
// This connects next-intl to Next.js and points directly
// to the request config file.
// ESLint is allowed to be skipped during production builds because
// the current ESLint version is blocking Vercel with removed options.

import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'cdn.sanity.io' },
        ],
    },
}

export default withNextIntl(nextConfig)