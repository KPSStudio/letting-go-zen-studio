// app/[locale]/zgoda-rezerwacja/page.tsx
// Booking consent page — now also shows the calendar on the SAME page.
//
// Flow:
//   PHASE 1 (consent): the customer ticks the 7 confirmations, fills in their
//     details and a typed signature, then submits. We save that consent record
//     to Supabase (the legal audit trail) via /api/booking-consent.
//   PHASE 2 (booking): once consent is saved we reveal the Cal.com calendar
//     right here, embedded. The customer picks a slot and PAYS INSIDE the
//     Cal.com widget (Cal.com's own Stripe integration) — we no longer take
//     the payment ourselves, so there is no separate payment step and no
//     booking token to manage.
//
// All visible text comes from messages/pl.json and messages/en.json.

"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_USERNAME } from "@/lib/calcom";

type ConsentState = {
  participatesVoluntarily: boolean;
  understandsServiceNature: boolean;
  understandsNotMedicalTreatment: boolean;
  truthfulHealthInformation: boolean;
  mayStopAnyTime: boolean;
  dataProcessingConsent: boolean;
  termsAndPrivacyAccepted: boolean;
};

type ConsentKey = keyof ConsentState;

type ConsentItem = {
  key: ConsentKey;
  translationKey: string;
};

type BookingConsentResponse = {
  success?: boolean;
  calSlug?: string;
  serviceName?: string;
  error?: string;
};

const consentItems: ConsentItem[] = [
  {
    key: "participatesVoluntarily",
    translationKey: "checks.participatesVoluntarily",
  },
  {
    key: "understandsServiceNature",
    translationKey: "checks.understandsServiceNature",
  },
  {
    key: "understandsNotMedicalTreatment",
    translationKey: "checks.understandsNotMedicalTreatment",
  },
  {
    key: "truthfulHealthInformation",
    translationKey: "checks.truthfulHealthInformation",
  },
  {
    key: "mayStopAnyTime",
    translationKey: "checks.mayStopAnyTime",
  },
  {
    key: "dataProcessingConsent",
    translationKey: "checks.dataProcessingConsent",
  },
];

export default function BookingConsentPage() {
  const t = useTranslations("bookingConsent");
  const tBooking = useTranslations("bookingPage");
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();

  const locale = params.locale;
  const serviceId = searchParams.get("service") ?? "";
  const serviceName =
    searchParams.get("serviceName") ?? t("fallbackServiceName");

  const [customerFullName, setCustomerFullName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [typedSignature, setTypedSignature] = useState("");

  const [consent, setConsent] = useState<ConsentState>({
    participatesVoluntarily: false,
    understandsServiceNature: false,
    understandsNotMedicalTreatment: false,
    truthfulHealthInformation: false,
    mayStopAnyTime: false,
    dataProcessingConsent: false,
    termsAndPrivacyAccepted: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Booking phase state ──
  // Once consent is saved, the server returns the Cal.com slug and we reveal
  // the calendar right here. We also keep the customer's name + email so we
  // can prefill the Cal.com booking form (they just typed them).
  const [calSlug, setCalSlug] = useState<string | null>(null);
  const [confirmedServiceName, setConfirmedServiceName] = useState(serviceName);
  const [bookerName, setBookerName] = useState("");
  const [bookerEmail, setBookerEmail] = useState("");

  const allConsentsAccepted =
    consent.participatesVoluntarily &&
    consent.understandsServiceNature &&
    consent.understandsNotMedicalTreatment &&
    consent.truthfulHealthInformation &&
    consent.mayStopAnyTime &&
    consent.dataProcessingConsent &&
    consent.termsAndPrivacyAccepted;

  const canSubmit =
    Boolean(serviceId) &&
    Boolean(customerFullName.trim()) &&
    Boolean(customerEmail.trim()) &&
    Boolean(customerPhone.trim()) &&
    Boolean(typedSignature.trim()) &&
    allConsentsAccepted &&
    !submitting;

  function updateConsent(key: ConsentKey, value: boolean) {
    setConsent((previousConsent) => ({
      ...previousConsent,
      [key]: value,
    }));

    setError(null);
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
    });

    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!serviceId) {
      setError(t("errors.missingService"));
      return;
    }

    if (!canSubmit) {
      setError(t("errors.incompleteForm"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Save the consent record. The server validates the service against
      // Sanity and returns the Cal.com slug to book (never trusting the URL).
      const response = await fetch("/api/booking-consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId,
          serviceName,
          locale,

          customerFullName,
          customerEmail,
          customerPhone,

          participatesVoluntarily: consent.participatesVoluntarily,
          understandsServiceNature: consent.understandsServiceNature,
          understandsNotMedicalTreatment:
            consent.understandsNotMedicalTreatment,
          truthfulHealthInformation: consent.truthfulHealthInformation,
          mayStopAnyTime: consent.mayStopAnyTime,
          dataProcessingConsent: consent.dataProcessingConsent,
          termsAndPrivacyAccepted: consent.termsAndPrivacyAccepted,

          typedSignature,
        }),
      });

      const data = (await response.json()) as BookingConsentResponse;

      if (!response.ok || !data.success || !data.calSlug) {
        setError(data.error ?? t("errors.saveFailed"));
        setSubmitting(false);
        return;
      }

      // Reveal the Cal.com calendar for this service, prefilled with the
      // details the customer just entered.
      setConfirmedServiceName(data.serviceName ?? serviceName);
      setBookerName(customerFullName);
      setBookerEmail(customerEmail);
      setCalSlug(data.calSlug);
      setSubmitting(false);
    } catch {
      setError(t("errors.connectionFailed"));
      setSubmitting(false);
    }
  }

  // ── Boot the Cal.com embed once we enter the booking phase ──
  //
  // IMPORTANT: we deliberately do NOT listen for `bookingSuccessful` to redirect
  // away. For PAID events Cal.com fires that event when the booking is first
  // CREATED — before the customer has paid. Redirecting there navigated the page
  // away mid-payment, so the payment was abandoned and Cal.com emailed a
  // "please pay" reminder. Instead we let Cal.com run its own payment step and
  // show its own confirmation right here in the embed.
  useEffect(() => {
    if (!calSlug) return;

    getCalApi().then((cal) => {
      cal("ui", {
        theme: "dark",
        styles: { branding: { brandColor: "#D4AF6A" } },
        hideEventTypeDetails: false,
      });
    });
  }, [calSlug]);

  // ── BOOKING PHASE: consent saved, show the calendar (payment is inside it) ──
  if (calSlug) {
    return (
      <main className="body-page">
        <p className="shop-label">
          <span />
          {tBooking("label")}
        </p>

        <section className="body-header">
          <h1 className="body-title">
            {tBooking("titleMain")} <span>{tBooking("titleGold")}</span>
          </h1>

          <p className="body-intro">{tBooking("intro")}</p>

          <p className="legal-effective-date">
            {t("serviceLabel")}: {confirmedServiceName}
          </p>

          {/* Cal.com always charges in GBP, so we say so here — this matters on
              the Polish site, where prices are otherwise shown in złoty. */}
          <p
            className="legal-effective-date"
            style={{ fontSize: "0.8rem", opacity: 0.7 }}
          >
            {tBooking("paidInGbp")}
          </p>
        </section>

        <section className="booking-panel">
          <Cal
            calLink={`${CAL_USERNAME}/${calSlug}`}
            className="booking-cal-embed"
            config={{
              layout: "month_view",
              name: bookerName,
              email: bookerEmail,
            }}
          />
        </section>
      </main>
    );
  }

  // ── CONSENT PHASE ──
  return (
    <main className="legal-page">
      <Link href={`/${locale}/body`} className="body-back-link">
        ← {t("back")}
      </Link>

      <p className="legal-label">
        <span className="legal-label-line" />
        {t("label")}
      </p>

      <section className="legal-header">
        <h1 className="legal-title">
          {t("titleMain")} <span>{t("titleGold")}</span>
        </h1>

        <p className="legal-intro">{t("intro")}</p>

        <p className="legal-effective-date">
          {t("serviceLabel")}: {serviceName}
        </p>
      </section>

      <form onSubmit={handleSubmit} className="legal-section-list">
        <section className="legal-section-card legal-consent-card">
          <h2 className="legal-section-title">{t("confirmationsTitle")}</h2>

          <div className="legal-checkbox-list">
            {consentItems.map((item) => (
              <label key={item.key} className="cart-terms-row">
                <input
                  type="checkbox"
                  checked={consent[item.key]}
                  onChange={(event) =>
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
                onChange={(event) => acceptAllConsent(event.target.checked)}
              />
              <span>
                {t("checks.acceptPrefix")}{" "}
                <Link
                  href={`/${locale}/regulamin`}
                  target="_blank"
                  className="cart-terms-link"
                >
                  {t("checks.terms")}
                </Link>{" "}
                {t("checks.and")}{" "}
                <Link
                  href={`/${locale}/polityka-prywatnosci`}
                  target="_blank"
                  className="cart-terms-link"
                >
                  {t("checks.privacy")}
                </Link>
                .
              </span>
            </label>
          </div>
        </section>

        <section className="legal-section-card">
          <h2 className="legal-section-title">{t("signatureTitle")}</h2>

          <div className="contact-form-field">
            <label htmlFor="customerFullName">{t("fields.fullName")}</label>
            <input
              id="customerFullName"
              type="text"
              value={customerFullName}
              onChange={(event) => {
                setCustomerFullName(event.target.value);
                setError(null);
              }}
              required
            />
          </div>

          <div className="contact-form-field">
            <label htmlFor="customerEmail">{t("fields.email")}</label>
            <input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(event) => {
                setCustomerEmail(event.target.value);
                setError(null);
              }}
              required
            />
          </div>

          <div className="contact-form-field">
            <label htmlFor="customerPhone">{t("fields.phone")}</label>
            <input
              id="customerPhone"
              type="tel"
              value={customerPhone}
              onChange={(event) => {
                setCustomerPhone(event.target.value);
                setError(null);
              }}
              required
            />
          </div>

          <div className="contact-form-field">
            <label htmlFor="serviceName">{t("fields.serviceName")}</label>
            <input id="serviceName" type="text" value={serviceName} readOnly />
          </div>

          <div className="contact-form-field">
            <label htmlFor="typedSignature">{t("fields.typedSignature")}</label>
            <input
              id="typedSignature"
              type="text"
              value={typedSignature}
              onChange={(event) => {
                setTypedSignature(event.target.value);
                setError(null);
              }}
              required
            />
          </div>

          <p className="legal-warning-text">{t("signatureNotice")}</p>
        </section>

        {!serviceId && (
          <section className="legal-section-card">
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-raleway)",
                fontSize: "0.9rem",
                color: "#ff6b6b",
                lineHeight: 1.7,
              }}
            >
              {t("errors.noBookingConfigured")}
            </p>
          </section>
        )}

        {error && (
          <section className="legal-section-card">
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-raleway)",
                fontSize: "0.9rem",
                color: "#ff6b6b",
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
            cursor: !canSubmit ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </form>
    </main>
  );
}
