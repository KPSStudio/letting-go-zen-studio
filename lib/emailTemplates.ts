// lib/emailTemplates.ts
// Shared branding for every transactional email we send.
//
// WHY THIS FILE EXISTS:
// Email clients (especially Outlook) do not support modern CSS — no flexbox,
// no grid, no CSS variables, no external stylesheets. So none of the styling
// in globals.css applies here. Every email must be built from <table> elements
// with styles written inline. This file holds that boilerplate in ONE place so
// the three emails stay visually consistent and we only fix bugs once.
//
// DESIGN: a light, editorial look — a warm cream card inside a thin deep-plum
// frame, gold accents, a circular photo of Joanna and a personal signature.
// (Modelled on the clean, framed, personal newsletter style Joanna asked for.)

// The two languages the site supports.
export type EmailLocale = 'pl' | 'en'

// The public address of the live site. Emails cannot use relative paths like
// "/images/logo.png" — the image must be a full https:// URL or it will not load.
export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lettinggozenstudio.com'

// Who emails come FROM, and where replies should land.
// NOTE: Resend lets us SEND from any address on the verified domain, but that
// does not create an inbox. We deliberately avoid a "noreply@" sender — inbox
// providers (and Resend's own checks) treat it as a deliverability/engagement
// risk — and use a friendly address instead. replyTo points at the Gmail inbox
// that genuinely receives mail. (You can change "hello" to studio/contact/etc;
// any name works because the whole lettinggozenstudio.com domain is verified.)
export const EMAIL_FROM = 'Letting Go Zen Studio <hello@lettinggozenstudio.com>'
export const EMAIL_REPLY_TO = 'lettinggozenstudio@gmail.com'

// LANGUAGE SWITCH FOR ALL CUSTOMER EMAILS.
//
// Set to 'en'   — every customer email is sent in English (current setting).
// Set to 'pl'   — every customer email is sent in Polish.
// Set to null   — follow the language the customer was browsing in, which
//                 arrives automatically through Stripe metadata.
//
// The bilingual copy below is complete either way, so changing this one line
// switches the whole system — no other edits needed.
//
// null = follow the customer's site language (PL on /pl, EN on /en). That
// locale rides through Stripe metadata: the shop/cart page sends it, the
// checkout route stores it on the PaymentIntent, and the webhook reads it back.
export const FORCED_EMAIL_LANGUAGE: EmailLocale | null = null

/**
 * Decides which language an email should actually use.
 * Honours FORCED_EMAIL_LANGUAGE when set, otherwise follows the customer.
 */
export function resolveEmailLocale(requestedLocale: EmailLocale): EmailLocale {
    return FORCED_EMAIL_LANGUAGE ?? requestedLocale
}

// Founder details shown in the signature block.
const FOUNDER_NAME = 'Joanna Witkowska'
const FOUNDER_ROLE = 'Letting Go Zen Studio'
const FOUNDER_PHOTO = `${SITE_URL}/images/Joanna-photo.png`
const LOGO_URL = `${SITE_URL}/images/logo.png`

// Brand colours for the LIGHT email theme. Plain hex — some clients drop rgba().
const COLOR = {
    pageBackground: '#ECE5D7', // warm neutral behind the framed card
    frame: '#3D0845',          // deep-plum frame + button background
    card: '#FCF9F3',           // warm cream content card
    ink: '#4A3F33',            // body text on cream
    inkSoft: '#8C7C66',        // muted secondary text
    heading: '#3D0845',        // plum headings
    gold: '#B8942A',
    hairline: '#E7DECC',       // soft warm divider on cream
    onFrame: '#E9D9B8',        // cream text on the plum frame
    buttonText: '#F5EBD2',     // light text on the plum button
}

// Headings use a serif (echoing the site's Marcellus); body uses a clean sans
// (echoing Montserrat). Neither web font loads in email, so we fall back to
// widely-installed families.
const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

/**
 * Formats a Stripe amount for display.
 * Stripe stores money in the smallest unit (pence / grosze), so 6000 = £60.00.
 */
export function formatMoney(amountInMinorUnits: number, currency: string): string {
    const majorUnits = (amountInMinorUnits / 100).toFixed(2)

    if (currency.toUpperCase() === 'PLN') {
        // Polish convention: comma as the decimal mark, symbol after the number.
        return `${majorUnits.replace('.', ',')} zł`
    }

    return `£${majorUnits}`
}

/**
 * Builds a solid, rounded call-to-action button (deep plum, light text).
 *
 * Written as a table rather than a styled <a> because Outlook ignores padding
 * on inline elements. A solid background is used because Outlook renders no
 * gradient at all.
 */
export function renderButton(label: string, url: string): string {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
        <tr>
          <td bgcolor="${COLOR.frame}" style="border-radius: 6px;">
            <a href="${url}"
               style="display: inline-block; padding: 15px 40px; font-family: ${SANS}; font-size: 13px; font-weight: bold; letter-spacing: 0.12em; text-transform: uppercase; color: ${COLOR.buttonText}; text-decoration: none; border-radius: 6px;">
              ${label}
            </a>
          </td>
        </tr>
      </table>`
}

/**
 * A centred ornamental divider — a small gold star flanked by soft rules.
 */
function renderOrnamentDivider(): string {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 0;"><div style="height: 1px; background-color: ${COLOR.hairline}; font-size: 0; line-height: 0;">&nbsp;</div></td>
          <td width="26" align="center" style="padding: 0 12px; font-family: ${SERIF}; font-size: 12px; color: ${COLOR.gold};">&#10022;</td>
          <td style="padding: 0;"><div style="height: 1px; background-color: ${COLOR.hairline}; font-size: 0; line-height: 0;">&nbsp;</div></td>
        </tr>
      </table>`
}

/**
 * Renders a labelled row of order details (e.g. "Service: Biorezonans").
 */
export function renderDetailRow(label: string, value: string): string {
    return `
      <tr>
        <td style="padding: 8px 0; font-family: ${SANS}; font-size: 14px; color: ${COLOR.inkSoft};">
          ${label}
        </td>
        <td align="right" style="padding: 8px 0; font-family: ${SANS}; font-size: 14px; color: ${COLOR.ink};">
          ${value}
        </td>
      </tr>`
}

type EmailShellOptions = {
    locale: EmailLocale
    // Short summary shown in the inbox preview line, next to the subject.
    preheader: string
    heading: string
    // Pre-built HTML for the middle of the email.
    bodyHtml: string
    // Optional plum button below the body.
    buttonLabel?: string
    buttonUrl?: string
    // Optional small print above the signature.
    footerNote?: string
}

/**
 * Wraps content in the branded shell: a cream card inside a plum frame, with a
 * logo, ornamental rules, a circular photo of Joanna, a personal signature and
 * a footer. Every customer-facing email uses this.
 */
export function renderEmailShell({
                                     locale,
                                     preheader,
                                     heading,
                                     bodyHtml,
                                     buttonLabel,
                                     buttonUrl,
                                     footerNote,
                                 }: EmailShellOptions): string {
    const isPolish = locale === 'pl'

    const closing = isPolish ? 'Z miłością,' : 'With love,'
    const tagline = isPolish
        ? 'TERAPIA HOLISTYCZNA · ABERDEEN'
        : 'HOLISTIC THERAPY · ABERDEEN'
    const helpText = isPolish
        ? 'Masz pytanie? Odpowiedz na tę wiadomość — napiszesz bezpośrednio do Joanny.'
        : 'Have a question? Just reply to this email — it goes straight to Joanna.'
    const receiptNote = isPolish
        ? 'Otrzymujesz tę wiadomość, ponieważ dokonano zakupu w Letting Go Zen Studio.'
        : 'You received this email because a purchase was made at Letting Go Zen Studio.'

    const buttonHtml =
        buttonLabel && buttonUrl ? renderButton(buttonLabel, buttonUrl) : ''

    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLOR.pageBackground};">

  <!-- Preheader: shown in the inbox preview but hidden inside the email. -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         bgcolor="${COLOR.pageBackground}" style="background-color: ${COLOR.pageBackground};">
    <tr>
      <td align="center" style="padding: 40px 14px;">

        <!-- Plum frame -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               bgcolor="${COLOR.frame}"
               style="width: 600px; max-width: 100%; background-color: ${COLOR.frame}; border-radius: 12px;">
          <tr>
            <td style="padding: 14px;">

              <!-- Cream content card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     bgcolor="${COLOR.card}"
                     style="background-color: ${COLOR.card}; border-radius: 6px;">

                <!-- Header: logo, wordmark, tagline -->
                <tr>
                  <td align="center" style="padding: 18px 40px 10px;">
                    <img src="${LOGO_URL}" width="150" height="150" alt="Letting Go Zen Studio"
                         style="display: block; border: 0; margin: 0 auto;">
                    <div style="font-family: ${SERIF}; font-size: 15px; letter-spacing: 0.3em; color: ${COLOR.heading}; text-transform: uppercase;">
                      Letting Go Zen Studio
                    </div>
                    <div style="font-family: ${SANS}; font-size: 10px; letter-spacing: 0.22em; color: ${COLOR.gold}; text-transform: uppercase; padding-top: 6px;">
                      ${tagline}
                    </div>
                  </td>
                </tr>

                <tr><td style="padding: 0 40px;">${renderOrnamentDivider()}</td></tr>

                <!-- Heading -->
                <tr>
                  <td style="padding: 30px 40px 0;">
                    <h1 style="margin: 0; font-family: ${SERIF}; font-size: 25px; font-weight: normal; letter-spacing: 0.01em; color: ${COLOR.heading};">
                      ${heading}
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 18px 40px 0; font-family: ${SANS}; font-size: 15px; line-height: 1.75; color: ${COLOR.ink};">
                    ${bodyHtml}
                  </td>
                </tr>

                ${
        buttonHtml
            ? `<tr><td align="center" style="padding: 34px 40px 6px;">${buttonHtml}</td></tr>`
            : ''
    }

                ${
        footerNote
            ? `<tr>
                       <td align="center" style="padding: 18px 44px 0; font-family: ${SANS}; font-size: 13px; line-height: 1.6; color: ${COLOR.inkSoft};">
                         ${footerNote}
                       </td>
                     </tr>`
            : ''
    }

                <!-- Divider before the signature -->
                <tr><td style="padding: 34px 40px 0;">
                  <div style="height: 1px; background-color: ${COLOR.hairline}; font-size: 0; line-height: 0;">&nbsp;</div>
                </td></tr>

                <!-- Circular photo of Joanna -->
                <tr>
                  <td align="center" style="padding: 30px 40px 0;">
                    <img src="${FOUNDER_PHOTO}" width="96" height="96" alt="${FOUNDER_NAME}"
                         style="display: block; border: 0; border-radius: 48px; margin: 0 auto;">
                  </td>
                </tr>

                <!-- Signature -->
                <tr>
                  <td align="center" style="padding: 16px 40px 0; font-family: ${SANS}; font-size: 14px; color: ${COLOR.inkSoft};">
                    ${closing}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 4px 40px 0; font-family: ${SERIF}; font-size: 18px; color: ${COLOR.heading};">
                    ${FOUNDER_NAME}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 3px 40px 0; font-family: ${SANS}; font-size: 12px; font-style: italic; letter-spacing: 0.04em; color: ${COLOR.gold};">
                    ${FOUNDER_ROLE}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 30px 44px 36px;">
                    <div style="height: 1px; background-color: ${COLOR.hairline}; font-size: 0; line-height: 0; margin-bottom: 20px;">&nbsp;</div>
                    <div style="font-family: ${SANS}; font-size: 12px; line-height: 1.7; color: ${COLOR.inkSoft};">
                      ${helpText}
                      <br><br>
                      <a href="${SITE_URL}/${locale}" style="color: ${COLOR.gold}; text-decoration: none;">www.lettinggozenstudio.com</a>
                      &nbsp;·&nbsp; Aberdeen, Scotland
                      <br><br>
                      <span style="color: ${COLOR.inkSoft}; opacity: 0.85;">${receiptNote}</span>
                    </div>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`
}
