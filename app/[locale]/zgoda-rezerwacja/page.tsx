// app/[locale]/zgoda-rezerwacja/page.tsx
// Booking consent page.
// All visible text comes from messages/pl.json and messages/en.json.
// Client must confirm all required statements before being redirected to Cal.com booking.

'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'

type ConsentState = {
    participatesVoluntarily: boolean
    understandsServiceNature: boolean
    understandsNotMedicalTreatment: boolean
    truthfulHealthInformation: boolean
    mayStopAnyTime: boolean
    dataProcessingConsent: boolean
    termsAndPrivacyAccepted: boolean
}

type ConsentKey = keyof ConsentState

type ConsentItem = {
    key: ConsentKey
    translationKey: string
}

type BookingConsentResponse = {
    success?: boolean
    redirectUrl?: string
    error?: string
}

const consentItems: ConsentItem[] = [
    {
        key: 'participatesVoluntarily',
        translationKey: 'checks.participatesVoluntarily',
    },
    {
        key: 'understandsServiceNature',
        translationKey: 'checks.understandsServiceNature',
    },
    {
        key: 'understandsNotMedicalTreatment',
        translationKey: 'checks.understandsNotMedicalTreatment',
    },
    {
        key: 'truthfulHealthInformation',
        translationKey: 'checks.truthfulHealthInformation',
    },
    {
        key: 'mayStopAnyTime',
        translationKey: 'checks.mayStopAnyTime',
    },
    {
        key: 'dataProcessingConsent',
        translationKey: 'checks.dataProcessingConsent',
    },
]

export default function BookingConsentPage() {
    const t = useTranslations('bookingConsent')
    const router = useRouter()
    const params = useParams<{ locale: string }>()
    const searchParams = useSearchParams()

    const locale = params.locale
    const serviceId = searchParams.get('service') ?? ''
    const serviceName = searchParams.get('serviceName') ?? t('fallbackServiceName')

    const [customerFullName, setCustomerFullName] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [typedSignature, setTypedSignature] = useState('')

    const [consent, setConsent] = useState<ConsentState>({
        participatesVoluntarily: false,
        understandsServiceNature: false,
        understandsNotMedicalTreatment: false,
        truthfulHealthInformation: false,
        mayStopAnyTime: false,
        dataProcessingConsent: false,
        termsAndPrivacyAccepted: false,
    })

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const allConsentsAccepted =
        consent.participatesVoluntarily &&
        consent.understandsServiceNature &&
        consent.understandsNotMedicalTreatment &&
        consent.truthfulHealthInformation &&
        consent.mayStopAnyTime &&
        consent.dataProcessingConsent &&
        consent.termsAndPrivacyAccepted

    const canSubmit =
        Boolean(serviceId) &&
        Boolean(customerFullName.trim()) &&
        Boolean(customerEmail.trim()) &&
        Boolean(customerPhone.trim()) &&
        Boolean(typedSignature.trim()) &&
        allConsentsAccepted &&
        !submitting

    function updateConsent(key: ConsentKey, value: boolean) {
        setConsent(previousConsent => ({
            ...previousConsent,
            [key]: value,
        }))

        setError(null)
    }

    function acceptAllConsent(value: boolean) {
        setConsent({
            participatesVoluntarily: value,
            understandsServiceNature: value,
            understandsNotMedicalTreatment: value,
            truthfulHealthInformation: value,
            mayStopAnyTime: value,
            dataProcessingConsent: value,
            termsAndPrivacyAccepted: value,
        })

        setError(null)
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!serviceId) {
            setError(t('errors.missingService'))
            return
        }

        if (!canSubmit) {
            setError(t('errors.incompleteForm'))
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/booking-consent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    price: searchParams.get('price') ?? '',
                    serviceId,
                    serviceName,
                    locale,

                    customerFullName,
                    customerEmail,
                    customerPhone,

                    participatesVoluntarily: consent.participatesVoluntarily,
                    understandsServiceNature: consent.understandsServiceNature,
                    understandsNotMedicalTreatment: consent.understandsNotMedicalTreatment,
                    truthfulHealthInformation: consent.truthfulHealthInformation,
                    mayStopAnyTime: consent.mayStopAnyTime,
                    dataProcessingConsent: consent.dataProcessingConsent,
                    termsAndPrivacyAccepted: consent.termsAndPrivacyAccepted,

                    typedSignature,
                }),
            })

            const data = (await response.json()) as BookingConsentResponse

            if (!response.ok || !data.success || !data.redirectUrl) {
                setError(t('errors.saveFailed'))
                setSubmitting(false)
                return
            }

            router.push(data.redirectUrl)
        } catch {
            setError(t('errors.connectionFailed'))
            setSubmitting(false)
        }
    }

    return (
        <main className="legal-page">
            <Link href={`/${locale}/body`} className="body-back-link">
                ← {t('back')}
            </Link>

            <p className="legal-label">
                <span className="legal-label-line" />
                {t('label')}
            </p>

            <section className="legal-header">
                <h1 className="legal-title">
                    {t('titleMain')} <span>{t('titleGold')}</span>
                </h1>

                <p className="legal-intro">
                    {t('intro')}
                </p>

                <p className="legal-effective-date">
                    {t('serviceLabel')}: {serviceName}
                </p>
            </section>

            <form onSubmit={handleSubmit} className="legal-section-list">
                <section className="legal-section-card legal-consent-card">
                    <h2 className="legal-section-title">
                        {t('confirmationsTitle')}
                    </h2>

                    <div className="legal-checkbox-list">
                        {consentItems.map(item => (
                            <label key={item.key} className="cart-terms-row">
                                <input
                                    type="checkbox"
                                    checked={consent[item.key]}
                                    onChange={event =>
                                        updateConsent(item.key, event.target.checked)
                                    }
                                />
                                <span>{t(item.translationKey)}</span>
                            </label>
                        ))}

                        <label className="cart-terms-row">
                            <input
                                type="checkbox"
                                checked={consent.termsAndPrivacyAccepted}
                                onChange={event => acceptAllConsent(event.target.checked)}
                            />
                            <span>
        {t('checks.acceptPrefix')}{' '}
                                <Link
                                    href={`/${locale}/regulamin`}
                                    target="_blank"
                                    className="cart-terms-link"
                                >
            {t('checks.terms')}
        </Link>
                                {' '}{t('checks.and')}{' '}
                                <Link
                                    href={`/${locale}/polityka-prywatnosci`}
                                    target="_blank"
                                    className="cart-terms-link"
                                >
            {t('checks.privacy')}
        </Link>
        .
    </span>
                        </label>
                    </div>
                </section>

                <section className="legal-section-card">
                    <h2 className="legal-section-title">
                        {t('signatureTitle')}
                    </h2>

                    <div className="contact-form-field">
                        <label htmlFor="customerFullName">
                            {t('fields.fullName')}
                        </label>
                        <input
                            id="customerFullName"
                            type="text"
                            value={customerFullName}
                            onChange={event => {
                                setCustomerFullName(event.target.value)
                                setError(null)
                            }}
                            required
                        />
                    </div>

                    <div className="contact-form-field">
                        <label htmlFor="customerEmail">
                            {t('fields.email')}
                        </label>
                        <input
                            id="customerEmail"
                            type="email"
                            value={customerEmail}
                            onChange={event => {
                                setCustomerEmail(event.target.value)
                                setError(null)
                            }}
                            required
                        />
                    </div>

                    <div className="contact-form-field">
                        <label htmlFor="customerPhone">
                            {t('fields.phone')}
                        </label>
                        <input
                            id="customerPhone"
                            type="tel"
                            value={customerPhone}
                            onChange={event => {
                                setCustomerPhone(event.target.value)
                                setError(null)
                            }}
                            required
                        />
                    </div>

                    <div className="contact-form-field">
                        <label htmlFor="serviceName">
                            {t('fields.serviceName')}
                        </label>
                        <input
                            id="serviceName"
                            type="text"
                            value={serviceName}
                            readOnly
                        />
                    </div>

                    <div className="contact-form-field">
                        <label htmlFor="typedSignature">
                            {t('fields.typedSignature')}
                        </label>
                        <input
                            id="typedSignature"
                            type="text"
                            value={typedSignature}
                            onChange={event => {
                                setTypedSignature(event.target.value)
                                setError(null)
                            }}
                            required
                        />
                    </div>

                    <p className="legal-warning-text">
                        {t('signatureNotice')}
                    </p>
                </section>

                {error && (
                    <section className="legal-section-card">
                        <p
                            style={{
                                margin: 0,
                                fontFamily: 'var(--font-raleway)',
                                fontSize: '0.9rem',
                                color: '#ff6b6b',
                                lineHeight: 1.7,
                            }}
                        >
                            {error}
                        </p>
                    </section>
                )}

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="cart-pay-button"
                    style={{
                        opacity: !canSubmit ? 0.5 : 1,
                        cursor: !canSubmit ? 'not-allowed' : 'pointer',
                    }}
                >
                    {submitting ? t('submitting') : t('submit')}
                </button>
            </form>
        </main>
    )
}