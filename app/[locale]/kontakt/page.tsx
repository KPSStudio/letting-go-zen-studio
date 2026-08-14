// app/[locale]/kontakt/page.tsx
// Kontakt page — contact form beside the WhatsApp/email cards and social links.

'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useRef, useState, type ComponentType } from 'react'
import { useTranslations } from 'next-intl'
import { MailIcon, PhoneIcon, HolisticIcon } from '@/components/home/PillarIcons'
import { FacebookIcon, InstagramIcon, TikTokIcon } from '@/components/common/SocialIcons'
import BotanicalOrnament from '@/components/common/BotanicalOrnament'
import { useEntranceReveal } from '@/lib/useEntranceReveal'

type ContactFormData = {
    name: string
    email: string
    phone: string
    subject: string
    message: string
}

type SocialLink = {
    Icon: ComponentType<{ className?: string }>
    label: string
    handle: string
    href: string
}

const socialLinks: SocialLink[] = [
    {
        Icon: FacebookIcon,
        label: 'Facebook',
        handle: '@lettinggozenstudio',
        href: 'https://www.facebook.com/lettinggostudiozen/',
    },
    {
        Icon: InstagramIcon,
        label: 'Instagram',
        handle: '@lettinggozenstudio',
        href: 'https://www.instagram.com/lettinggozenstudio',
    },
    {
        Icon: TikTokIcon,
        label: 'TikTok',
        handle: '@lettinggozenstudio',
        href: 'https://www.tiktok.com/@lettinggozenstudi',
    },
]

// Contact methods and the form heading reveal once; the inputs themselves are
// never animated, so nothing moves while somebody is typing or reading an
// error. Module-level for a stable identity.
const REVEAL_STEPS = ['.contact-card', '.contact-social-link', '.contact-section-title']
const DRAW_SELECTOR =
    '.contact-card-icon svg path, .contact-card-icon svg circle, .contact-card-icon svg rect'

export default function KontaktPage() {
    const t = useTranslations('kontakt')

    const pageRef = useRef<HTMLElement | null>(null)
    useEntranceReveal(pageRef, {
        steps: REVEAL_STEPS,
        drawSelector: DRAW_SELECTOR,
        stagger: 70,
        shift: 10,
    })

    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    })

    const [submitted, setSubmitted] = useState(false)
    const [errorShown, setErrorShown] = useState(false)
    const [sending, setSending] = useState(false)

    // Honeypot. Hidden from sighted users AND from screen readers, and skipped
    // by keyboard tabbing — so no real person can fill it in, but a form-filling
    // bot will. The server discards any submission that has it set.
    const [website, setWebsite] = useState('')

    function handleChange(
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = event.target

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }))
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        // Stop a second submit while the first is still in flight — otherwise
        // an impatient double-click files the same enquiry twice.
        if (sending) return

        setSubmitted(false)
        setErrorShown(false)
        setSending(true)

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    website,
                    locale: document.documentElement.lang || 'pl',
                }),
            })

            if (response.ok) {
                setSubmitted(true)
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: '',
                })
            } else {
                setErrorShown(true)
            }
        } catch {
            setErrorShown(true)
        } finally {
            setSending(false)
        }
    }

    return (
        <main className="contact-page" ref={pageRef}>
            {/* The same botanical motif that sits behind the About portrait,
                here as a low-contrast page accent. Clipped by .contact-page so
                it can never widen the layout. */}
            <BotanicalOrnament className="contact-ornament-art" />

            <section className="contact-header">
                {/* The eyebrow sits with the title, centred — not floating
                    above an unrelated panel. */}
                <p className="contact-label">
                    <span />
                    {t('label')}
                </p>

                {/* One restrained line-art glyph, decorative: the <h1> below
                    already names the page. */}
                <span className="contact-header-icon" aria-hidden="true">
                    <HolisticIcon />
                </span>

                <h1 className="contact-title">
                    {t('heroTitle')} <span>{t('heroTitleGold')}</span>
                </h1>

                <p className="contact-intro">
                    {t('heroSubtitle')}
                </p>

                <div className="contact-ornament" aria-hidden="true">✦</div>
            </section>

            {/* Two columns: contact details + socials on the left, form on the right. */}
            <div className="contact-body">
                <aside className="contact-info-col">
                    <section className="contact-card-grid">
                        <article className="contact-card">
                            <div className="contact-card-icon">
                                <PhoneIcon />
                            </div>

                            <h2 className="contact-card-title">
                                {t('whatsappTitle')}
                            </h2>

                            <p className="contact-card-text">
                                {t('whatsappText')}
                            </p>

                            <a
                                href="https://wa.me/447590572043"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="contact-card-link"
                            >
                                07590 572 043
                            </a>
                        </article>

                        <article className="contact-card">
                            <div className="contact-card-icon">
                                <MailIcon />
                            </div>

                            <h2 className="contact-card-title">
                                {t('emailTitle')}
                            </h2>

                            <p className="contact-card-text">
                                {t('emailText')}
                            </p>

                            <a
                                href="mailto:lettinggozenstudio@gmail.com"
                                className="contact-card-link"
                            >
                                lettinggozenstudio@gmail.com
                            </a>
                        </article>
                    </section>

                    <section className="contact-social-section">
                        <h2 className="contact-section-title">
                            {t('socialTitle')}
                        </h2>

                        <div className="contact-social-list">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="contact-social-link"
                                >
                                    <span className="contact-social-icon" aria-hidden="true">
                                        <social.Icon />
                                    </span>

                                    <span className="contact-social-name">
                                        {social.label}
                                    </span>

                                    <span className="contact-social-handle">
                                        · {social.handle}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </section>
                </aside>

                <section className="contact-form-card">
                    {/* One always-present live region, so the outcome of an
                        async submit is announced rather than only drawn. It has
                        to exist in the DOM before the result arrives — a region
                        that appears at the same moment as its text is often not
                        announced at all. The emoji are decorative next to real
                        text, so they are hidden from assistive tech. */}
                    <div role="status" aria-live="polite">
                        {submitted && (
                            <div className="contact-success-box">
                                <span className="contact-status-icon" aria-hidden="true">
                                    <MailIcon />
                                </span>

                                <p>
                                    {t('successMessage')}
                                </p>
                            </div>
                        )}

                        {errorShown && (
                            <div className="contact-error-box">
                                <span aria-hidden="true">⚠️</span>

                                <p>
                                    {t('errorMessage')}
                                </p>
                            </div>
                        )}
                    </div>

                    <h2 className="contact-section-title">
                        {t('formTitle')}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="contact-form-field">
                            <label htmlFor="name">
                                {t('nameLabel')}
                            </label>

                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={t('namePlaceholder')}
                                required
                            />
                        </div>

                        <div className="contact-form-field">
                            <label htmlFor="email">
                                {t('emailLabel')}
                            </label>

                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={t('emailPlaceholder')}
                                required
                            />
                        </div>

                        <div className="contact-form-field">
                            <label htmlFor="phone">
                                {t('phoneLabel')}
                            </label>

                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder={t('phonePlaceholder')}
                            />
                        </div>

                        <div className="contact-form-field">
                            <label htmlFor="subject">
                                {t('subjectLabel')}
                            </label>

                            <select
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>
                                    {t('subjectPlaceholder')}
                                </option>
                                <option value="biorezonans">{t('subjects.biorezonans')}</option>
                                <option value="hipnoterapia">{t('subjects.hipnoterapia')}</option>
                                <option value="presoterapia">{t('subjects.presoterapia')}</option>
                                <option value="przeznaczenie">{t('subjects.przeznaczenie')}</option>
                                <option value="alchemik">{t('subjects.alchemik')}</option>
                                <option value="inne">{t('subjectOther')}</option>
                            </select>
                        </div>

                        <div className="contact-form-field">
                            <label htmlFor="message">
                                {t('messageLabel')}
                            </label>

                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder={t('messagePlaceholder')}
                                required
                                rows={6}
                            />
                        </div>

                        {/* Honeypot — see the `website` state above. Not
                            `display: none`: some bots skip hidden inputs, but
                            almost none read an off-screen one. aria-hidden +
                            tabIndex -1 keep it away from real users. */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                left: '-9999px',
                                width: '1px',
                                height: '1px',
                                overflow: 'hidden',
                            }}
                        >
                            <label htmlFor="website">Website</label>
                            <input
                                id="website"
                                type="text"
                                name="website"
                                value={website}
                                onChange={(event) => setWebsite(event.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>

                        <button
                            type="submit"
                            className="contact-submit-button"
                            disabled={sending}
                            style={{
                                opacity: sending ? 0.6 : 1,
                                cursor: sending ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <span className="contact-submit-icon" aria-hidden="true">
                                <MailIcon />
                            </span>
                            {sending ? t('sendingButton') : t('submitButton')}
                        </button>
                    </form>
                </section>
            </div>
        </main>
    )
}
