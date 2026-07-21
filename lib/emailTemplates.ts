// lib/emailTemplates.ts
// Shared branding for every transactional email we send.
//
// WHY THIS FILE EXISTS:
// Email clients (especially Outlook) do not support modern CSS — no flexbox,
// no grid, no CSS variables, no external stylesheets. So none of the styling
// in globals.css applies here. Every email must be built from <table> elements
// with styles written inline. This file holds that boilerplate in ONE place so
// the three emails stay visually consistent and we only fix bugs once.

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
export const FORCED_EMAIL_LANGUAGE: EmailLocale | null = 'en'

/**
 * Decides which language an email should actually use.
 * Honours FORCED_EMAIL_LANGUAGE when set, otherwise follows the customer.
 */
export function resolveEmailLocale(requestedLocale: EmailLocale): EmailLocale {
    return FORCED_EMAIL_LANGUAGE ?? requestedLocale
}

// Brand colours copied from globals.css :root tokens.
// Written as plain hex — some email clients drop rgba() colours.
const COLOR = {
    outerBackground: '#24042d',
    panelBackground: '#3D0845',
    panelSoft: '#320a3d',
    gold: '#B8942A',
    goldLight: '#D4AF6A',
    cream: '#E8D7B8',
    creamDim: '#A99C86',
    hairline: '#5A4522',
}

// Marcellus and Montserrat are web fonts — they will NOT load in email clients.
// Georgia is the closest widely-installed serif, so the emails still feel
// like the site rather than falling back to Times New Roman.
const FONT_STACK = "Georgia, 'Times New Roman', serif"

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
 * Builds a gold call-to-action button.
 *
 * Written as a table rather than a styled <a> because Outlook ignores padding
 * on inline elements. A solid background colour is used instead of the site's
 * gold gradient, since Outlook renders no gradient at all — which would leave
 * dark text on a dark background and an invisible button.
 */
export function renderButton(label: string, url: string): string {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
        <tr>
          <td bgcolor="${COLOR.gold}" style="border-radius: 4px;">
            <a href="${url}"
               style="display: inline-block; padding: 16px 44px; font-family: ${FONT_STACK}; font-size: 13px; font-weight: bold; letter-spacing: 0.16em; text-transform: uppercase; color: ${COLOR.panelBackground}; text-decoration: none; border-radius: 4px;">
              ${label}
            </a>
          </td>
        </tr>
      </table>`
}

/**
 * A centred ornamental divider — a small gold star flanked by thin rules.
 * Separates sections with a little more grace than a plain hairline.
 */
function renderOrnamentDivider(): string {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 0;"><div style="height: 1px; background-color: ${COLOR.hairline}; font-size: 0; line-height: 0;">&nbsp;</div></td>
          <td width="28" align="center" style="padding: 0 12px; font-family: ${FONT_STACK}; font-size: 13px; color: ${COLOR.gold};">&#10022;</td>
          <td style="padding: 0;"><div style="height: 1px; background-color: ${COLOR.hairline}; font-size: 0; line-height: 0;">&nbsp;</div></td>
        </tr>
      </table>`
}

/**
 * Renders a labelled row of order details (e.g. "Service: Biorezonans").
 * Sits inside a rounded panel so the order summary reads as its own block.
 */
export function renderDetailRow(label: string, value: string): string {
    return `
      <tr>
        <td style="padding: 7px 0; font-family: ${FONT_STACK}; font-size: 14px; color: ${COLOR.creamDim};">
          ${label}
        </td>
        <td align="right" style="padding: 7px 0; font-family: ${FONT_STACK}; font-size: 14px; color: ${COLOR.cream};">
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
    // Optional gold button below the body.
    buttonLabel?: string
    buttonUrl?: string
    // Optional small print above the signature.
    footerNote?: string
}

/**
 * Wraps content in the branded shell: gold crown, logo, wordmark, ornamental
 * rules, signature and footer. Every customer-facing email uses this.
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

    const signature = isPolish ? 'Z miłością, Joanna' : 'With love, Joanna'
    const tagline = isPolish
        ? 'TERAPIA HOLISTYCZNA · ABERDEEN'
        : 'HOLISTIC THERAPY · ABERDEEN'
    const helpText = isPolish
        ? 'Masz pytanie? Odpowiedz na tę wiadomość — napiszesz bezpośrednio do Joanny.'
        : 'Have a question? Just reply to this email — it goes straight to Joanna.'

    const buttonHtml =
        buttonLabel && buttonUrl ? renderButton(buttonLabel, buttonUrl) : ''

    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLOR.outerBackground};">

  <!-- Preheader: shown in the inbox preview but hidden inside the email. -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         bgcolor="${COLOR.outerBackground}" style="background-color: ${COLOR.outerBackground};">
    <tr>
      <td align="center" style="padding: 44px 16px;">

        <table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0"
               bgcolor="${COLOR.panelBackground}"
               style="width: 580px; max-width: 100%; background-color: ${COLOR.panelBackground}; border: 1px solid ${COLOR.hairline}; border-radius: 8px;">

          <!-- Gold crown: a thin accent band across the very top of the card. -->
          <tr>
            <td style="height: 4px; background-color: ${COLOR.gold}; font-size: 0; line-height: 0; border-radius: 8px 8px 0 0;">&nbsp;</td>
          </tr>

          <!-- Logo, wordmark and tagline -->
          <tr>
            <td align="center" style="padding: 44px 44px 24px;">
              <img src="${SITE_URL}/images/logo.png"
                   width="60" height="60" alt="Letting Go Zen Studio"
                   style="display: block; border: 0; margin: 0 auto 18px;">
              <div style="font-family: ${FONT_STACK}; font-size: 15px; letter-spacing: 0.32em; color: ${COLOR.goldLight}; text-transform: uppercase;">
                Letting Go Zen Studio
              </div>
              <div style="font-family: ${FONT_STACK}; font-size: 10px; letter-spacing: 0.24em; color: ${COLOR.creamDim}; text-transform: uppercase; padding-top: 10px;">
                ${tagline}
              </div>
            </td>
          </tr>

          <!-- Ornamental divider -->
          <tr><td style="padding: 0 44px;">${renderOrnamentDivider()}</td></tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding: 32px 44px 0;">
              <h1 style="margin: 0; font-family: ${FONT_STACK}; font-size: 26px; font-weight: normal; letter-spacing: 0.02em; color: ${COLOR.goldLight};">
                ${heading}
              </h1>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 22px 44px 0; font-family: ${FONT_STACK}; font-size: 15px; line-height: 1.85; color: ${COLOR.cream};">
              ${bodyHtml}
            </td>
          </tr>

          ${
        buttonHtml
            ? `<tr><td align="center" style="padding: 36px 44px 8px;">${buttonHtml}</td></tr>`
            : ''
    }

          ${
        footerNote
            ? `<tr>
                   <td align="center" style="padding: 20px 48px 0; font-family: ${FONT_STACK}; font-size: 13px; font-style: italic; line-height: 1.65; color: ${COLOR.creamDim};">
                     ${footerNote}
                   </td>
                 </tr>`
            : ''
    }

          <!-- Ornamental divider -->
          <tr><td style="padding: 34px 44px 0;">${renderOrnamentDivider()}</td></tr>

          <!-- Signature -->
          <tr>
            <td align="center" style="padding: 26px 44px 0; font-family: ${FONT_STACK}; font-size: 18px; font-style: italic; color: ${COLOR.goldLight};">
              ${signature}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 44px 40px; font-family: ${FONT_STACK}; font-size: 12px; line-height: 1.8; color: ${COLOR.creamDim};">
              ${helpText}
              <br><br>
              <a href="${SITE_URL}/${locale}" style="color: ${COLOR.goldLight}; text-decoration: none;">
                www.lettinggozenstudio.com
              </a>
              <br>
              Aberdeen, Scotland
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`
}
