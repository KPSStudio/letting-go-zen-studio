// lib/email.ts
// Sends transactional emails via Resend
// Used for Sklep download links and order confirmations

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface DownloadEmailProps {
    to: 'lettinggozenstudio@gmail.com',
    productName: string
    downloadUrl: string
}

export async function sendDownloadEmail({
                                            to,
                                            productName,
                                            downloadUrl,
                                        }: DownloadEmailProps) {
    const { error } = await resend.emails.send({
        from: 'Letting Go Zen Studio <onboarding@resend.dev>',
        to,
        subject: `Twój zakup: ${productName}`,
        html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #1a0020; color: #E8D7B8;">
        
        <h1 style="color: #D4AF6A; font-size: 24px; margin-bottom: 8px;">
          Letting Go Zen Studio
        </h1>
        
        <div style="height: 1px; background: rgba(184,148,42,0.3); margin-bottom: 24px;"></div>
        
        <h2 style="color: #E8D7B8; font-size: 18px; margin-bottom: 16px;">
          Dziękujemy za zakup!
        </h2>
        
        <p style="color: #E8D7B8; font-size: 15px; line-height: 1.8; margin-bottom: 16px;">
          Twój produkt <strong style="color: #D4AF6A;">${productName}</strong> jest gotowy do pobrania.
        </p>
        
        <p style="color: rgba(232,215,184,0.7); font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Link wygasa po <strong>24 godzinach</strong>. Pobierz plik jak najszybciej.
        </p>
        
        <a href="${downloadUrl}"
           style="display: inline-block; background: linear-gradient(135deg, #D4AF6A, #8A6A1A); color: #3D0845; padding: 14px 32px; text-decoration: none; font-size: 15px; font-weight: bold; margin-bottom: 24px;">
          ⬇ Pobierz plik PDF
        </a>
        
        <div style="height: 1px; background: rgba(184,148,42,0.3); margin-bottom: 24px;"></div>
        
        <p style="color: rgba(232,215,184,0.5); font-size: 12px; line-height: 1.6;">
          W razie problemów napisz na: 
          <a href="mailto:lettinggozenstudio@gmail.com" style="color: #D4AF6A;">
            lettinggozenstudio@gmail.com
          </a>
        </p>
        
        <p style="color: #D4AF6A; font-size: 14px; margin-top: 16px;">
          Z miłością, Joanna
        </p>
        
      </div>
    `,
    })

    if (error) {
        console.error('Resend email error:', error)
        throw new Error('Failed to send download email')
    }
}

interface OrderNotificationProps {
    productName: string
    customerEmail: string
    amount: number
    currency: string
}

export async function sendOrderNotificationToJoanna({
                                                        productName,
                                                        customerEmail,
                                                        amount,
                                                        currency,
                                                    }: OrderNotificationProps) {
    const { error } = await resend.emails.send({
        from: 'Letting Go Zen Studio <onboarding@resend.dev>',
        to: process.env.CONTACT_EMAIL!,
        subject: `Nowa sprzedaż: ${productName}`,
        html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #B8942A;">Nowa sprzedaż w Sklepie!</h2>
        <p><strong>Produkt:</strong> ${productName}</p>
        <p><strong>Klient:</strong> ${customerEmail}</p>
        <p><strong>Kwota:</strong> ${currency} ${(amount / 100).toFixed(2)}</p>
        <p style="color: #666; font-size: 12px;">Link do pobrania został automatycznie wysłany do klienta.</p>
      </div>
    `,
    })

    if (error) {
        console.error('Joanna notification error:', error)
    }
}