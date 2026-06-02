'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

type ContactFormData = {
    name: string
    email: string
    phone: string
    subject: string
    message: string
}

type SocialLink = {
    icon: string
    label: string
    handle: string
    href: string
}

const socialLinks: SocialLink[] = [
    {
        icon: 'f',
        label: 'Facebook',
        handle: '@lettinggozenstudio',
        href: 'https://www.facebook.com/lettinggostudiozen/',
    },
    {
        icon: '📷',
        label: 'Instagram',
        handle: '@lettinggozenstudio',
        href: 'https://www.instagram.com/lettinggozenstudio',
    },
    {
        icon: '♪',
        label: 'TikTok',
        handle: '@lettinggozenstudio',
        href: 'https://www.tiktok.com/@lettinggozenstudi',
    },
]

export default function KontaktPage() {
    const t = useTranslations('kontakt')

    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    })

    const [submitted, setSubmitted] = useState(false)

    function handleChange(
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = event.target

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        // Supabase / Resend integration comes later.
        // For now this only shows the success message.
        setSubmitted(true)
    }

    return (
        <main className="mx-auto max-w-[900px] px-8 pb-24 pt-12">

            {/* Page label */}
            <p className="mb-4 flex items-center gap-3 font-cinzel text-[0.7rem] tracking-[0.3em] text-brand-gold">
                <span className="inline-block h-px w-8 bg-brand-gold" />
                {t('label')}
            </p>

            {/* Page hero */}
            <section className="mb-16">
                <h1 className="mb-4 font-cinzel text-[clamp(2.5rem,6vw,5rem)] leading-[1.1] text-brand-white">
                    {t('heroTitle')}{' '}
                    <span className="text-brand-gold-lt">
                        {t('heroTitleGold')}
                    </span>
                </h1>

                <p className="font-montserrat text-[0.95rem] leading-7 text-brand-cream">
                    {t('heroSubtitle')}
                </p>
            </section>

            {/* Contact cards */}
            <section className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2">

                {/* WhatsApp card */}
                <div className="border border-brand-gold/15 bg-black/25 p-8">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center border border-brand-gold/30 text-[1.1rem]">
                        📱
                    </div>

                    <h2 className="mb-3 font-cinzel text-[0.85rem] tracking-[0.15em] text-brand-white">
                        {t('whatsappTitle')}
                    </h2>

                    <p className="mb-5 font-montserrat text-[0.95rem] leading-7 text-brand-cream">
                        {t('whatsappText')}
                    </p>

                    <a
                        href="https://wa.me/447590572043"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border border-brand-gold/30 bg-brand-gold/10 px-5 py-3 font-cinzel text-[0.7rem] tracking-[0.15em] text-brand-gold-lt no-underline transition hover:border-brand-gold-lt"
                    >
                        📱 07590 572 043
                    </a>
                </div>

                {/* Email card */}
                <div className="border border-brand-gold/15 bg-black/25 p-8">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center border border-brand-gold/30 text-[1.1rem]">
                        📧
                    </div>

                    <h2 className="mb-3 font-cinzel text-[0.85rem] tracking-[0.15em] text-brand-white">
                        {t('emailTitle')}
                    </h2>

                    <p className="mb-5 font-montserrat text-[0.95rem] leading-7 text-brand-cream">
                        {t('emailText')}
                    </p>

                    <a
                        href="mailto:lettinggozenstudio@gmail.com"
                        className="inline-flex items-center gap-2 border border-brand-gold/30 bg-brand-gold/10 px-5 py-3 font-cinzel text-[0.7rem] tracking-[0.15em] text-brand-gold-lt no-underline transition hover:border-brand-gold-lt"
                    >
                        📧 lettinggozenstudio@gmail.com
                    </a>
                </div>
            </section>

            {/* Contact form */}
            <section className="mb-16 border border-brand-gold/15 bg-black/25 p-10">

                {/* Success message */}
                {submitted && (
                    <div className="mb-8 flex items-center gap-3 border border-brand-gold/30 bg-brand-gold/10 px-6 py-4">
                        <span>✉️</span>

                        <p className="m-0 font-montserrat text-[0.95rem] text-brand-gold-lt">
                            {t('successMessage')}
                        </p>
                    </div>
                )}

                <h2 className="mb-8 font-cinzel text-[1rem] tracking-[0.15em] text-brand-white">
                    {t('formTitle')}
                </h2>

                <form onSubmit={handleSubmit}>

                    {/* Name */}
                    <div className="mb-6">
                        <label className="mb-2 block font-cinzel text-[0.65rem] tracking-[0.2em] text-brand-gold">
                            {t('nameLabel')}
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={t('namePlaceholder')}
                            required
                            className="w-full border border-brand-gold/20 bg-black/30 px-4 py-3 font-montserrat text-[0.95rem] text-brand-cream outline-none placeholder:text-brand-cream/40 focus:border-brand-gold-lt"
                        />
                    </div>

                    {/* Email */}
                    <div className="mb-6">
                        <label className="mb-2 block font-cinzel text-[0.65rem] tracking-[0.2em] text-brand-gold">
                            {t('emailLabel')}
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t('emailPlaceholder')}
                            required
                            className="w-full border border-brand-gold/20 bg-black/30 px-4 py-3 font-montserrat text-[0.95rem] text-brand-cream outline-none placeholder:text-brand-cream/40 focus:border-brand-gold-lt"
                        />
                    </div>

                    {/* Phone */}
                    <div className="mb-6">
                        <label className="mb-2 block font-cinzel text-[0.65rem] tracking-[0.2em] text-brand-gold">
                            {t('phoneLabel')}
                        </label>

                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder={t('phonePlaceholder')}
                            className="w-full border border-brand-gold/20 bg-black/30 px-4 py-3 font-montserrat text-[0.95rem] text-brand-cream outline-none placeholder:text-brand-cream/40 focus:border-brand-gold-lt"
                        />
                    </div>

                    {/* Subject */}
                    <div className="mb-6">
                        <label className="mb-2 block font-cinzel text-[0.65rem] tracking-[0.2em] text-brand-gold">
                            {t('subjectLabel')}
                        </label>

                        <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            className="w-full cursor-pointer border border-brand-gold/20 bg-black/30 px-4 py-3 font-montserrat text-[0.95rem] text-brand-cream outline-none focus:border-brand-gold-lt"
                        >
                            <option value="" disabled>
                                {t('subjectPlaceholder')}
                            </option>
                            <option value="biorezonans">Biorezonans</option>
                            <option value="hipnoterapia">Hipnoterapia</option>
                            <option value="presoterapia">Presoterapia</option>
                            <option value="przeznaczenie">Przeznaczenie</option>
                            <option value="alchemik">Alchemik</option>
                            <option value="inne">{t('subjectOther')}</option>
                        </select>
                    </div>

                    {/* Message */}
                    <div className="mb-8">
                        <label className="mb-2 block font-cinzel text-[0.65rem] tracking-[0.2em] text-brand-gold">
                            {t('messageLabel')}
                        </label>

                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder={t('messagePlaceholder')}
                            required
                            rows={5}
                            className="w-full resize-y border border-brand-gold/20 bg-black/30 px-4 py-3 font-montserrat text-[0.95rem] text-brand-cream outline-none placeholder:text-brand-cream/40 focus:border-brand-gold-lt"
                        />
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="flex w-full cursor-pointer items-center justify-center gap-2 border border-brand-gold-lt bg-brand-gold-lt px-6 py-4 font-cinzel text-[0.8rem] tracking-[0.25em] text-[#3D0845] transition hover:bg-brand-gold"
                    >
                        ✉️ {t('submitButton')}
                    </button>
                </form>
            </section>

            {/* Social media */}
            <section>
                <h2 className="mb-8 font-cinzel text-[1rem] tracking-[0.15em] text-brand-white">
                    {t('socialTitle')}
                </h2>

                <div className="flex flex-col gap-4">
                    {socialLinks.map(social => (
                        <a
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 border border-brand-gold/15 bg-black/25 px-6 py-4 no-underline transition hover:border-brand-gold-lt"
                        >
                            <span className="w-6 text-center font-cinzel text-[0.9rem] text-brand-gold-lt">
                                {social.icon}
                            </span>

                            <span className="font-cinzel text-[0.8rem] tracking-[0.15em] text-brand-white">
                                {social.label}
                            </span>

                            <span className="font-montserrat text-[0.85rem] text-brand-cream/50">
                                · {social.handle}
                            </span>
                        </a>
                    ))}
                </div>
            </section>
        </main>
    )
}