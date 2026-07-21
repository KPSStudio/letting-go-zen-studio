// lib/email.ts
// Sends every transactional email via Resend.
//
// There are three (bookings are confirmed by Cal.com directly, not here):
//   1. sendDownloadEmail            — digital shop purchase (download link)
//   2. sendOrderConfirmationEmail   — cart purchase (Joanna delivers manually)
//   3. sendOrderNotificationToJoanna— internal alert so Joanna can fulfil
//
// All three share the branded shell in lib/emailTemplates.ts and are bilingual:
// the locale travels through Stripe metadata from the original checkout.

import { Resend } from 'resend'
import {
    renderEmailShell,
    renderDetailRow,
    formatMoney,
    resolveEmailLocale,
    EMAIL_FROM,
    EMAIL_REPLY_TO,
    type EmailLocale,
} from '@/lib/emailTemplates'

const resend = new Resend(process.env.RESEND_API_KEY)

// Where Joanna's internal notifications land.
const JOANNA_INBOX =
    process.env.CONTACT_EMAIL ?? 'lettinggozenstudio@gmail.com'

// Wraps a details table so order info lines up neatly.
function renderDetailsTable(rows: string): string {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="margin: 18px 0; border-top: 1px solid #E7DECC; border-bottom: 1px solid #E7DECC;">
        ${rows}
      </table>`
}

// ─────────────────────────────────────────────────────────────
// 1. DIGITAL SHOP PURCHASE — download link
// ─────────────────────────────────────────────────────────────

interface DownloadEmailProps {
    to: string
    productName: string
    downloadUrl: string
    locale?: EmailLocale
}

export async function sendDownloadEmail({
                                            to,
                                            productName,
                                            downloadUrl,
                                            locale = 'pl',
                                        }: DownloadEmailProps) {
    // Language actually used — currently forced to English by the switch
    // in emailTemplates.ts, regardless of which site language they browsed.
    const activeLocale = resolveEmailLocale(locale)
    const isPolish = activeLocale === 'pl'

    const subject = isPolish
        ? `Twój zakup: ${productName}`
        : `Your purchase: ${productName}`

    const bodyHtml = isPolish
        ? `<p style="margin: 0 0 14px;">Dziękujemy za zakup — Twój plik jest gotowy.</p>
           <p style="margin: 0;"><strong style="color: #B8942A;">${productName}</strong></p>`
        : `<p style="margin: 0 0 14px;">Thank you for your purchase — your file is ready.</p>
           <p style="margin: 0;"><strong style="color: #B8942A;">${productName}</strong></p>`

    const html = renderEmailShell({
        locale: activeLocale,
        preheader: isPolish
            ? 'Twój plik jest gotowy do pobrania.'
            : 'Your file is ready to download.',
        heading: isPolish ? 'Dziękujemy za zakup' : 'Thank you for your purchase',
        bodyHtml,
        buttonLabel: isPolish ? 'POBIERZ PLIK PDF' : 'DOWNLOAD YOUR PDF',
        buttonUrl: downloadUrl,
        footerNote: isPolish
            ? 'Link jest aktywny przez 30 dni. Zapisz plik na swoim urządzeniu.'
            : 'This link stays active for 30 days. Please save the file to your device.',
    })

    const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        replyTo: EMAIL_REPLY_TO,
        to,
        subject,
        html,
    })

    if (error) {
        console.error('Resend download email error:', error)
        throw new Error('Failed to send download email')
    }
}

// ─────────────────────────────────────────────────────────────
// 1b. PHYSICAL / BUNDLE SHOP ORDER — shipped within a week
// ─────────────────────────────────────────────────────────────

interface PhysicalOrderEmailProps {
    to: string
    productName: string
    locale?: EmailLocale
}

export async function sendPhysicalOrderEmail({
                                                 to,
                                                 productName,
                                                 locale = 'pl',
                                             }: PhysicalOrderEmailProps) {
    const activeLocale = resolveEmailLocale(locale)
    const isPolish = activeLocale === 'pl'

    const bodyHtml = isPolish
        ? `<p style="margin: 0 0 14px;">Dziękujemy za zamówienie — płatność została potwierdzona.</p>
           <p style="margin: 0 0 14px;"><strong style="color: #B8942A;">${productName}</strong></p>
           <p style="margin: 0;">Twoja przesyłka zostanie nadana na podany adres w ciągu <strong style="color: #B8942A;">7 dni</strong>.</p>`
        : `<p style="margin: 0 0 14px;">Thank you for your order — your payment has been confirmed.</p>
           <p style="margin: 0 0 14px;"><strong style="color: #B8942A;">${productName}</strong></p>
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

    const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        replyTo: EMAIL_REPLY_TO,
        to,
        subject: isPolish
            ? `Zamówienie przyjęte: ${productName}`
            : `Order received: ${productName}`,
        html,
    })

    if (error) {
        console.error('Resend physical order email error:', error)
    }
}

// ─────────────────────────────────────────────────────────────
// 2. CART ORDER — Joanna fulfils manually within 48h
// ─────────────────────────────────────────────────────────────

interface OrderConfirmationProps {
    to: string
    itemNames: string[]
    amount: number
    currency: string
    locale?: EmailLocale
}

export async function sendOrderConfirmationEmail({
                                                     to,
                                                     itemNames,
                                                     amount,
                                                     currency,
                                                     locale = 'pl',
                                                 }: OrderConfirmationProps) {
    const activeLocale = resolveEmailLocale(locale)
    const isPolish = activeLocale === 'pl'

    const itemRows = itemNames
        .map((name) => renderDetailRow('•', name))
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

    const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        replyTo: EMAIL_REPLY_TO,
        to,
        subject: isPolish ? 'Potwierdzenie zamówienia' : 'Order confirmation',
        html,
    })

    if (error) {
        console.error('Resend order confirmation error:', error)
    }
}

// ─────────────────────────────────────────────────────────────
// 3. INTERNAL — notify Joanna of a sale
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
}

export async function sendOrderNotificationToJoanna({
                                                        productName,
                                                        customerEmail,
                                                        amount,
                                                        currency,
                                                        orderKind = 'sklep',
                                                        shippingText,
                                                    }: OrderNotificationProps) {
    // Always Polish — this one is for Joanna, not the customer.
    const actionByKind: Record<string, string> = {
        sklep: 'Link do pobrania został wysłany automatycznie. Nie musisz nic robić.',
        booking: 'Klient wybiera teraz termin w kalendarzu. Potwierdzenie z Cal.com dotrze osobno.',
        cart: '⚠️ WYMAGA DZIAŁANIA — przygotuj i wyślij materiał do klienta w ciągu 48 godzin.',
        physical: '⚠️ WYMAGA WYSYŁKI — wyślij produkt na adres poniżej w ciągu 7 dni.',
        bundle: '⚠️ WYMAGA WYSYŁKI — link do PDF wysłany automatycznie; wyślij produkt fizyczny na adres poniżej w ciągu 7 dni.',
    }

    const details = renderDetailsTable(
        renderDetailRow('Produkt', productName) +
        renderDetailRow('Klient', customerEmail) +
        renderDetailRow('Kwota', formatMoney(amount, currency))
    )

    // Shipping address block (physical / bundle only). Escaped and shown with
    // line breaks preserved so Joanna can copy it straight onto a parcel.
    const addressBlock = shippingText
        ? `<p style="margin: 12px 0 18px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #4A3F33; white-space: pre-line;"><strong style="color: #3D0845;">Adres wysyłki:</strong><br>${shippingText.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`
        : ''

    const html = renderEmailShell({
        locale: 'pl',
        preheader: `Nowa sprzedaż: ${productName}`,
        heading: 'Nowa sprzedaż',
        bodyHtml: `${details}<p style="margin: 0 0 4px;">${actionByKind[orderKind]}</p>${addressBlock}`,
    })

    const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        replyTo: customerEmail, // replying goes straight to the customer
        to: JOANNA_INBOX,
        subject: `Nowa sprzedaż: ${productName}`,
        html,
    })

    if (error) {
        console.error('Joanna notification error:', error)
    }
}
