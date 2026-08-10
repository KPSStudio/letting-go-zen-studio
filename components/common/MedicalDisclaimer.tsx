// components/common/MedicalDisclaimer.tsx
// The one place the non-medical limitation is worded.
//
// Joanna's instruction for this release was to keep her service descriptions
// as they are and instead make it prominent that the work is not medical
// analysis. So the wording lives in a single translation key (`disclaimer`)
// and this component renders it identically on Ciało, Umysł and Dusza — one
// key, one voice, no drift between pages or languages.

'use client'

import { useTranslations } from 'next-intl'

export default function MedicalDisclaimer() {
    const t = useTranslations('disclaimer')

    return (
        // `role="note"` marks it as an aside about the surrounding content
        // without claiming the urgency of role="alert".
        <aside className="medical-disclaimer" role="note">
            <p className="medical-disclaimer-label">{t('label')}</p>
            <p className="medical-disclaimer-text">{t('text')}</p>
        </aside>
    )
}
