// app/api/booking-consent/route.ts
// Saves booking/session consent before the client is sent to Cal.com.
// The record is saved in Supabase and a copy is emailed to Joanna through Resend.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

type BookingConsentRequestBody = {
    serviceId: string
    serviceName: string
    locale: string

    customerFullName: string
    customerEmail: string
    customerPhone: string

    participatesVoluntarily: boolean
    understandsServiceNature: boolean
    understandsNotMedicalTreatment: boolean
    truthfulHealthInformation: boolean
    mayStopAnyTime: boolean
    dataProcessingConsent: boolean
    termsAndPrivacyAccepted: boolean

    typedSignature: string
}

type BookingConsentInsert = {
    service_id: string
    service_name: string
    cal_com_url: string

    customer_full_name: string
    customer_email: string
    customer_phone: string

    participates_voluntarily: boolean
    understands_service_nature: boolean
    understands_not_medical_treatment: boolean
    truthful_health_information: boolean
    may_stop_any_time: boolean
    data_processing_consent: boolean
    terms_and_privacy_accepted: boolean

    typed_signature: string

    locale: string
    accepted_at: string

    ip_address: string | null
    user_agent: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY
const contactEmailValue = process.env.CONTACT_EMAIL

if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

if (!resendApiKey) {
    throw new Error('Missing RESEND_API_KEY')
}

if (!contactEmailValue) {
    throw new Error('Missing CONTACT_EMAIL')
}

const contactEmail: string = contactEmailValue

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const resend = new Resend(resendApiKey)

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizeText(value: string) {
    return value.trim()
}

function getClientIp(request: NextRequest) {
    const forwardedFor = request.headers.get('x-forwarded-for')

    if (!forwardedFor) {
        return null
    }

    return forwardedFor.split(',')[0]?.trim() ?? null
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as BookingConsentRequestBody

        const serviceId = normalizeText(body.serviceId)
        const serviceName = normalizeText(body.serviceName)
        const locale = normalizeText(body.locale || 'pl')

        const customerFullName = normalizeText(body.customerFullName)
        const customerEmail = normalizeText(body.customerEmail)
        const customerPhone = normalizeText(body.customerPhone)
        const typedSignature = normalizeText(body.typedSignature)

        if (!serviceId || !serviceName) {
            return NextResponse.json(
                { error: 'Missing service information.' },
                { status: 400 }
            )
        }

        if (!customerFullName) {
            return NextResponse.json(
                { error: 'Full name is required.' },
                { status: 400 }
            )
        }

        if (!customerEmail || !isValidEmail(customerEmail)) {
            return NextResponse.json(
                { error: 'Valid email is required.' },
                { status: 400 }
            )
        }

        if (!customerPhone) {
            return NextResponse.json(
                { error: 'Phone number is required.' },
                { status: 400 }
            )
        }

        if (!typedSignature) {
            return NextResponse.json(
                { error: 'Typed signature is required.' },
                { status: 400 }
            )
        }

        const allRequiredConsentAccepted =
            body.participatesVoluntarily &&
            body.understandsServiceNature &&
            body.understandsNotMedicalTreatment &&
            body.truthfulHealthInformation &&
            body.mayStopAnyTime &&
            body.dataProcessingConsent &&
            body.termsAndPrivacyAccepted

        if (!allRequiredConsentAccepted) {
            return NextResponse.json(
                { error: 'All consent confirmations are required.' },
                { status: 400 }
            )
        }

        const price = (body as any).price ?? ''
        const acceptedAt = new Date().toISOString()
        const redirectUrl = `/${locale}/rezerwacja?service=${encodeURIComponent(serviceId)}&serviceName=${encodeURIComponent(serviceName)}&price=${encodeURIComponent(price)}&locale=${locale}`

        const insertData: BookingConsentInsert = {
            service_id: serviceId,
            service_name: serviceName,
            cal_com_url: redirectUrl,
            customer_full_name: customerFullName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            participates_voluntarily: body.participatesVoluntarily,
            understands_service_nature: body.understandsServiceNature,
            understands_not_medical_treatment: body.understandsNotMedicalTreatment,
            truthful_health_information: body.truthfulHealthInformation,
            may_stop_any_time: body.mayStopAnyTime,
            data_processing_consent: body.dataProcessingConsent,
            terms_and_privacy_accepted: body.termsAndPrivacyAccepted,
            typed_signature: typedSignature,
            locale,
            accepted_at: acceptedAt,
            ip_address: getClientIp(request),
            user_agent: request.headers.get('user-agent'),
        }

        const { error: supabaseError } = await supabase
            .from('booking_consents')
            .insert(insertData)

        if (supabaseError) {
            console.error('Supabase booking consent error:', supabaseError)

            return NextResponse.json(
                { error: 'Could not save consent record.' },
                { status: 500 }
            )
        }

        await resend.emails.send({
            from: 'Letting Go Zen Studio <onboarding@resend.dev>',
            to: contactEmail,
            subject: `Nowa zgoda na rezerwację: ${serviceName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px;">
                    <h1 style="color: #B8942A;">Nowa zgoda na rezerwację</h1>

                    <p><strong>Usługa:</strong> ${serviceName}</p>
                    <p><strong>Imię i nazwisko:</strong> ${customerFullName}</p>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Telefon:</strong> ${customerPhone}</p>
                    <p><strong>Podpis wpisany:</strong> ${typedSignature}</p>
                    <p><strong>Data akceptacji:</strong> ${acceptedAt}</p>

                    <hr />

                    <h2 style="color: #B8942A;">Potwierdzenia klienta</h2>

                    <ul>
                        <li>Uczestniczy dobrowolnie: TAK</li>
                        <li>Rozumie charakter usługi: TAK</li>
                        <li>Rozumie, że usługa nie jest leczeniem medycznym: TAK</li>
                        <li>Potwierdza prawdziwość informacji zdrowotnych: TAK</li>
                        <li>Rozumie, że może przerwać sesję w dowolnym momencie: TAK</li>
                        <li>Wyraża zgodę na przetwarzanie danych związanych z usługą: TAK</li>
                        <li>Akceptuje Regulamin i Politykę Prywatności: TAK</li>
                    </ul>

                    <p style="font-size: 13px; color: #777;">
                        Ten rekord został również zapisany w Supabase w tabeli booking_consents.
                    </p>
                </div>
            `,
        })

        return NextResponse.json({
            success: true,
            redirectUrl,
        })
    } catch (error) {
        console.error('Booking consent route error:', error)

        return NextResponse.json(
            { error: 'Unexpected server error.' },
            { status: 500 }
        )
    }
}