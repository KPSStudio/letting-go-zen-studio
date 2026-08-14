// components/common/TravelFeeNotice.tsx
//
// The bilingual travel-fee disclosure for appointments where Joanna travels to
// the customer.
//
// It exists once, is driven entirely by the `travelFee` translation namespace,
// and is rendered in every place a customer could commit to a home visit —
// always BEFORE payment, never only afterwards:
//
//   1. the service detail modal on Ciało / Umysł / Dusza, where the customer
//      reads what the appointment involves;
//   2. directly above the embedded Cal.com calendar on the booking-consent
//      page, because the location is chosen inside that embed and cannot be
//      read from our side.
//
// It is NOT shown for studio or online appointments — see
// lib/serviceAvailability.ts.

'use client'

import { useTranslations } from 'next-intl'

type Props = {
    /** `compact` is the in-modal variant; `standalone` sits above the calendar. */
    variant?: 'compact' | 'standalone'
}

export default function TravelFeeNotice({ variant = 'compact' }: Props) {
    const t = useTranslations('travelFee')

    return (
        <aside
            className={`travel-fee-notice travel-fee-notice-${variant}`}
            role="note"
        >
            <p className="travel-fee-notice-label">{t('label')}</p>
            <p className="travel-fee-notice-text">{t('text')}</p>
        </aside>
    )
}
