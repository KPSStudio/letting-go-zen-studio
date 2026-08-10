// lib/email.ts
// Sends every transactional email via Resend.
//
// There are five (bookings are confirmed by Cal.com directly, not here):
//   1. sendDownloadEmail            — digital shop purchase (download link)
//   2. sendPhysicalOrderEmail       — shipped shop purchase (dispatch window)
//   3. sendOrderConfirmationEmail   — cart purchase (Joanna delivers manually)
//   4. sendOrderNotificationToJoanna— internal alert so Joanna can fulfil
//
// The customer-facing messages share the branded shell and follow the checkout
// locale. Joanna's order/contact notifications are deliberately Polish.
// the locale travels through Stripe metadata from the original checkout, and
// FORCED_EMAIL_LANGUAGE is null, so each customer gets the language they were
// browsing in.
//
// TWO RULES THIS FILE ENFORCES
//
// 1. EVERY SENDER THROWS AND RETURNS THE RESEND EMAIL ID. The durable outbox
//    decides whether a failed customer/internal email blocks the current
//    request and records the provider id for delivery/bounce webhooks. No sender
//    is allowed to swallow a provider failure.
//
// 2. EVERY SEND CARRIES AN IDEMPOTENCY KEY. The Stripe webhook is retried on
//    failure, so the same email can legitimately be attempted more than once.
//    Resend deduplicates on the `Idempotency-Key` header for 24 hours, so normal
//    webhook/outbox retries do not send a second copy. The database dedupe key
//    is permanent; provider idempotency is an additional bounded safeguard.

import { Resend } from 'resend'
import {
    renderEmailShell,
    renderDetailRow,
    formatMoney,
    resolveEmailLocale,
    escapeHtml,
    EMAIL_FROM,
    EMAIL_REPLY_TO,
    type EmailLocale,
} from '@/lib/emailTemplates'

const resend = new Resend(process.env.RESEND_API_KEY)

// Where Joanna's internal notifications land.
const JOANNA_INBOX =
    process.env.CONTACT_EMAIL ?? 'lettinggozenstudio@gmail.com'

function safeHeaderText(value: string): string {
    return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 180)
}

function safeReplyTo(value: string): string {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? value
        : EMAIL_REPLY_TO
}

function requireEmailId(
    data: { id: string } | null,
    error: { message: string } | null,
    label: string
): string {
    if (error || !data?.id) {
        console.error(`${label}:`, error?.message ?? 'Resend returned no email id')
        throw new Error(label)
    }

    return data.id
}

// Wraps a details table so order info lines up neatly.
function renderDetailsTable(rows: string): string {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="margin: 18px 0; border-top: 1px solid #E7DECC; border-bottom: 1px solid #E7DECC;">
        ${rows}
      </table>`
}

/**
 * Builds the Resend idempotency key for one (payment, purpose) pair.
 * Returns undefined when there is no stable id to key on, so the send still
 * goes out rather than being skipped.
 */
function idempotencyOptions(idempotencyKey?: string) {
    return idempotencyKey ? { idempotencyKey } : undefined
}

// ─────────────────────────────────────────────────────────────
// 1. DIGITAL SHOP PURCHASE — download link  (CUSTOMER-CRITICAL)
// ─────────────────────────────────────────────────────────────

interface DownloadEmailProps {
    to: string
    productName: string
    downloadUrl: string
    locale?: EmailLocale
    idempotencyKey?: string
}

export async function sendDownloadEmail({
                                            to,
                                            productName,
                                            downloadUrl,
                                            locale = 'pl',
                                            idempotencyKey,
                                        }: DownloadEmailProps) {
    const activeLocale = resolveEmailLocale(locale)
    const isPolish = activeLocale === 'pl'
    const safeProductName = escapeHtml(productName)

    const subject = safeHeaderText(
        isPolish
            ? `Twój zakup: ${productName}`
            : `Your purchase: ${productName}`
    )

    const bodyHtml = isPolish
        ? `<p style="margin: 0 0 14px;">Dziękujemy za zakup — Twój plik jest gotowy.</p>
           <p style="margin: 0;"><strong style="color: #B8942A;">${safeProductName}</strong></p>`
        : `<p style="margin: 0 0 14px;">Thank you for your purchase — your file is ready.</p>
           <p style="margin: 0;"><strong style="color: #B8942A;">${safeProductName}</strong></p>`

    const html = renderEmailShell({
        locale: activeLocale,
        preheader: isPolish
            ? 'Twój plik jest gotowy do pobrania.'
            : 'Your file is ready to download.',
        heading: isPolish ? 'Dziękujemy za zakup' : 'Thank you for your purchase',
        bodyHtml,
        buttonLabel: isPolish ? 'POBIERZ PLIK PDF' : 'DOWNLOAD YOUR PDF',
        // This is a signed Supabase URL generated server-side. The shared
        // button renderer safely escapes it for an HTML attribute; mail clients
        // decode `&amp;` back to `&` when the link is followed.
        buttonUrl: downloadUrl,
        footerNote: isPolish
            ? 'Link jest aktywny przez 30 dni. Zapisz plik na swoim urządzeniu.'
            : 'This link stays active for 30 days. Please save the file to your device.',
    })

    const { data, error } = await resend.emails.send(
        {
            from: EMAIL_FROM,
            replyTo: EMAIL_REPLY_TO,
            to,
            subject,
            html,
        },
        idempotencyOptions(idempotencyKey)
    )

    // Deliberately does NOT log the download URL — it is a signed, 30-day
    // credential for a paid file.
    return requireEmailId(data, error, 'Failed to send download email')
}

// ─────────────────────────────────────────────────────────────
// 2. PHYSICAL / BUNDLE SHOP ORDER — shipped within a week  (CUSTOMER-CRITICAL)
// ─────────────────────────────────────────────────────────────

interface PhysicalOrderEmailProps {
    to: string
    productName: string
    locale?: EmailLocale
    idempotencyKey?: string
}

export async function sendPhysicalOrderEmail({
                                                 to,
                                                 productName,
                                                 locale = 'pl',
                                                 idempotencyKey,
                                             }: PhysicalOrderEmailProps) {
    const activeLocale = resolveEmailLocale(locale)
    const isPolish = activeLocale === 'pl'
    const safeProductName = escapeHtml(productName)

    const bodyHtml = isPolish
        ? `<p style="margin: 0 0 14px;">Dziękujemy za zamówienie — płatność została potwierdzona.</p>
           <p style="margin: 0 0 14px;"><strong style="color: #B8942A;">${safeProductName}</strong></p>
           <p style="margin: 0;">Twoja przesyłka zostanie nadana na podany adres w ciągu <strong style="color: #B8942A;">7 dni</strong>.</p>`
        : `<p style="margin: 0 0 14px;">Thank you for your order — your payment has been confirmed.</p>
           <p style="margin: 0 0 14px;"><strong style="color: #B8942A;">${safeProductName}</strong></p>
           <p style="margin: 0;">Your parcel will be posted to the address you provided within <strong style="color: #B8942A;">7 days</strong>.</p>`

    const html = renderEmailShell({
        locale: activeLocale,
        preheader: isPolish
            ? 'Zamówienie przyjęte — wysyłka w ciągu 7 dni.'
            : 'Order received — shipping within 7 days.',
        heading: isPolish ? 'Zamówienie przyjęte' : 'Order received',
        bodyHtml,
        footerNote: isPolish
            ? 'Otrzymasz osobną wiadomość, gdy paczka zostanie nadana.'
            : 'You will get a separate note once your parcel is on its way.',
    })

    const { data, error } = await resend.emails.send(
        {
            from: EMAIL_FROM,
            replyTo: EMAIL_REPLY_TO,
            to,
            subject: safeHeaderText(
                isPolish
                    ? `Zamówienie przyjęte: ${productName}`
                    : `Order received: ${productName}`
            ),
            html,
        },
        idempotencyOptions(idempotencyKey)
    )

    return requireEmailId(data, error, 'Failed to send physical order email')
}

// ─────────────────────────────────────────────────────────────
// 3. CART ORDER — Joanna fulfils manually within 48h  (CUSTOMER-CRITICAL)
// ─────────────────────────────────────────────────────────────

interface OrderConfirmationProps {
    to: string
    itemNames: string[]
    amount: number
    currency: string
    locale?: EmailLocale
    idempotencyKey?: string
}

export async function sendOrderConfirmationEmail({
                                                     to,
                                                     itemNames,
                                                     amount,
                                                     currency,
                                                     locale = 'pl',
                                                     idempotencyKey,
                                                 }: OrderConfirmationProps) {
    const activeLocale = resolveEmailLocale(locale)
    const isPolish = activeLocale === 'pl'

    const itemRows = itemNames
        .map((name) => renderDetailRow('•', escapeHtml(name)))
        .join('')

    const details = renderDetailsTable(
        itemRows +
        renderDetailRow(isPolish ? 'Razem' : 'Total', formatMoney(amount, currency))
    )

    const bodyHtml = isPolish
        ? `<p style="margin: 0 0 4px;">Dziękujemy za zamówienie — płatność została potwierdzona.</p>
           ${details}
           <p style="margin: 0;">Joanna przygotuje Twój materiał osobiście i wyśle go na ten adres email w ciągu <strong style="color: #B8942A;">48 godzin</strong>.</p>`
        : `<p style="margin: 0 0 4px;">Thank you for your order — your payment has been confirmed.</p>
           ${details}
           <p style="margin: 0;">Joanna prepares each piece personally and will send it to this email address within <strong style="color: #B8942A;">48 hours</strong>.</p>`

    const html = renderEmailShell({
        locale: activeLocale,
        preheader: isPolish
            ? 'Zamówienie przyjęte — materiał wyślemy w ciągu 48 godzin.'
            : 'Order received — we will send your materials within 48 hours.',
        heading: isPolish ? 'Zamówienie przyjęte' : 'Order received',
        bodyHtml,
        footerNote: isPolish
            ? 'Prosimy sprawdzić folder spam, jeśli wiadomość nie dotrze na czas.'
            : 'Please check your spam folder if it does not arrive in time.',
    })

    const { data, error } = await resend.emails.send(
        {
            from: EMAIL_FROM,
            replyTo: EMAIL_REPLY_TO,
            to,
            subject: isPolish ? 'Potwierdzenie zamówienia' : 'Order confirmation',
            html,
        },
        idempotencyOptions(idempotencyKey)
    )

    return requireEmailId(data, error, 'Failed to send order confirmation email')
}

// ─────────────────────────────────────────────────────────────
// 4. INTERNAL — notify Joanna of a sale  (NOT customer-critical)
// ─────────────────────────────────────────────────────────────

interface OrderNotificationProps {
    productName: string
    customerEmail: string
    amount: number
    currency: string
    // What kind of sale this was, so Joanna knows what to do next.
    orderKind?: 'sklep' | 'booking' | 'cart' | 'physical' | 'bundle'
    // Multi-line shipping address for physical / bundle orders.
    shippingText?: string
    idempotencyKey?: string
}

/**
 * Returns the provider email id. Internal notifications are durable outbox
 * jobs too, so a failure must throw and be retried independently.
 */
export async function sendOrderNotificationToJoanna({
                                                        productName,
                                                        customerEmail,
                                                        amount,
                                                        currency,
                                                        orderKind = 'sklep',
                                                        shippingText,
                                                        idempotencyKey,
                                                    }: OrderNotificationProps): Promise<string> {
    // Always Polish — this one is for Joanna, not the customer.
    const actionByKind: Record<string, string> = {
        sklep: 'Link do pobrania został wysłany automatycznie. Nie musisz nic robić.',
        booking: 'Klient wybiera teraz termin w kalendarzu. Potwierdzenie z Cal.com dotrze osobno.',
        cart: '⚠️ WYMAGA DZIAŁANIA — przygotuj i wyślij materiał do klienta w ciągu 48 godzin.',
        physical: '⚠️ WYMAGA WYSYŁKI — wyślij produkt na adres poniżej w ciągu 7 dni.',
        bundle: '⚠️ WYMAGA WYSYŁKI — link do PDF wysłany automatycznie; wyślij produkt fizyczny na adres poniżej w ciągu 7 dni.',
    }

    const details = renderDetailsTable(
        renderDetailRow('Produkt', escapeHtml(productName)) +
        renderDetailRow('Klient', escapeHtml(customerEmail)) +
        renderDetailRow('Kwota', formatMoney(amount, currency))
    )

    // Shipping address block (physical / bundle only). Fully escaped and shown
    // with line breaks preserved so Joanna can copy it straight onto a parcel.
    const addressBlock = shippingText
        ? `<p style="margin: 12px 0 18px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #4A3F33; white-space: pre-line;"><strong style="color: #3D0845;">Adres wysyłki:</strong><br>${escapeHtml(shippingText)}</p>`
        : ''

    const html = renderEmailShell({
        locale: 'pl',
        preheader: `Nowa sprzedaż: ${productName}`,
        heading: 'Nowa sprzedaż',
        bodyHtml: `${details}<p style="margin: 0 0 4px;">${escapeHtml(actionByKind[orderKind] ?? '')}</p>${addressBlock}`,
    })

    const { data, error } = await resend.emails.send(
        {
            from: EMAIL_FROM,
            replyTo: safeReplyTo(customerEmail),
            to: JOANNA_INBOX,
            subject: safeHeaderText(`Nowa sprzedaż: ${productName}`),
            html,
        },
        idempotencyOptions(idempotencyKey)
    )

    return requireEmailId(data, error, 'Failed to send Joanna order notification')
}

// ─────────────────────────────────────────────────────────────
// 5. INTERNAL — contact-form notification
// ─────────────────────────────────────────────────────────────

interface ContactNotificationProps {
    name: string
    email: string
    phone?: string | null
    subject?: string | null
    message: string
    locale: EmailLocale
    idempotencyKey: string
}

export async function sendContactNotificationEmail({
    name,
    email,
    phone,
    subject,
    message,
    locale,
    idempotencyKey,
}: ContactNotificationProps): Promise<string> {
    const details = renderDetailsTable(
        renderDetailRow('Imię', escapeHtml(name)) +
        renderDetailRow('Email', escapeHtml(email)) +
        (phone ? renderDetailRow('Telefon', escapeHtml(phone)) : '') +
        (subject ? renderDetailRow('Temat', escapeHtml(subject)) : '') +
        renderDetailRow('Język', locale.toUpperCase())
    )

    const html = renderEmailShell({
        locale: 'pl',
        preheader: `Nowa wiadomość od ${name}`,
        heading: 'Nowa wiadomość z formularza',
        bodyHtml: `
          ${details}
          <p style="margin: 0 0 8px; color: #8C7C66;">Treść wiadomości:</p>
          <p style="margin: 0; white-space: pre-line;">${escapeHtml(message)}</p>`,
    })

    const { data, error } = await resend.emails.send(
        {
            from: EMAIL_FROM,
            replyTo: safeReplyTo(email),
            to: JOANNA_INBOX,
            subject: safeHeaderText(`Nowa wiadomość: ${subject || name}`),
            html,
        },
        idempotencyOptions(idempotencyKey)
    )

    return requireEmailId(data, error, 'Failed to send contact notification')
}
