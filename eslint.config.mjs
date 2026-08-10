// eslint.config.mjs — ESLint 9 flat config.
//
// WHY FlatCompat IS HERE
// This file previously imported `defineConfig` from "eslint/config" and pulled
// `eslint-config-next/core-web-vitals` in as if it were a flat config. Neither
// worked: "eslint/config" does not exist in ESLint 8 (which was installed), and
// eslint-config-next 15.5 ships eslintrc-format configs with no flat exports at
// all. So BOTH lint paths were broken — `npm run lint` died on removed `next
// lint` options, and a direct `eslint .` died on the import.
//
// The fix is ESLint 9 plus FlatCompat, the official bridge for consuming an
// eslintrc-format shareable config from a flat config. Upgrading
// eslint-config-next to a version with native flat config would mean moving to
// Next 16 — a framework major, not something to do inside a release fix.

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __dirname = dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
})

const eslintConfig = [
    {
        // Build output and generated files. In flat config, `ignores` in a
        // config object with no other keys applies globally.
        ignores: [
            '.next/**',
            'out/**',
            'build/**',
            'node_modules/**',
            'next-env.d.ts',
        ],
    },

    ...compat.extends('next/core-web-vitals', 'next/typescript'),

    {
        rules: {
            // Sanity documents are loosely typed at the edges (GROQ returns
            // whatever the query shape is), so an explicit `any` is sometimes
            // the honest annotation. Flagged, not fatal.
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
]

export default eslintConfig
