// app/[locale]/zgoda-rezerwacja/page.tsx
// Booking consent page — now also handles payment on the SAME page.
// Flow: customer fills consent + signature → we save it and create a
// booking token → the Stripe payment appears right here (no cart) →
// after paying, Stripe returns them to /rezerwacja to book the slot.
// All visible text comes from messages/pl.json and messages/en.json.

"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useCurrency } from "@/lib/CurrencyContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

// Same Stripe look as the cart page, so payment feels identical everywhere.
const stripeAppearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#D4AF6A",
    colorBackground: "#1a0020",
    colorText: "#E8D7B8",
    colorDanger: "#ff6b6b",
    fontFamily: "Montserrat, sans-serif",
    borderRadius: "0px",
    colorInputBackground: "#0a0010",
    colorInputText: "#E8D7B8",
    colorInputBorder: "rgba(184,148,42,0.3)",
    colorInputPlaceholder: "rgba(232,215,184,0.4)",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(184,148,42,0.3)",
      backgroundColor: "rgba(0,0,0,0.3)",
      color: "#E8D7B8",
    },
    ".Input:focus": {
      border: "1px solid rgba(212,175,106,0.8)",
      boxShadow: "0 0 0 1px rgba(212,175,106,0.3)",
    },
    ".Label": {
      color: "#B8942A",
      fontFamily: "Montserrat, sans-serif",
      fontSize: "0.75rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    },
    ".Tab": {
      border: "1px solid rgba(184,148,42,0.3)",
      backgroundColor: "rgba(0,0,0,0.2)",
      color: "#E8D7B8",
    },
    ".Tab--selected": {
      border: "1px solid rgba(212,175,106,0.8)",
      backgroundColor: "rgba(184,148,42,0.1)",
      color: "#D4AF6A",
    },
    ".Block": {
      backgroundColor: "rgba(0,0,0,0.2)",
      border: "1px solid rgba(184,148,42,0.2)",
    },
  },
};

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
  token?: string;
  serviceName?: string;
  priceGBP?: number;
  redirectUrl?: string;
  error?: string;
};

type CheckoutSessionResponse = {
  clientSecret?: string;
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

// ── Inline payment form, shown after consent is saved ──
// Reuses the cart page's existing payment translation keys, so we don't
// have to touch the JSON files.
function BookingPaymentForm({
  token,
  priceGBP,
  locale,
  onBack,
}: {
  token: string;
  priceGBP: number;
  locale: string;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const tCart = useTranslations("cartPage");
  const tConsent = useTranslations("bookingConsent");
  const { formatPrice } = useCurrency();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(event: FormEvent) {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setPaying(true);
    setError(null);

    // After paying, Stripe returns the customer to the booking page,
    // which waits for the webhook then shows the Cal.com calendar.
    const returnUrl = new URL(`${window.location.origin}/${locale}/rezerwacja`);
    returnUrl.searchParams.set("token", token);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl.toString(),
      },
    });

    if (error) {
      setError(error.message ?? tCart("payment.fallbackError"));
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handlePay}>
      <div style={{ marginBottom: "2rem" }}>
        <PaymentElement />
      </div>

      {error && (
        <p
          style={{
            fontFamily: "var(--font-raleway)",
            fontSize: "0.85rem",
            color: "#ff6b6b",
            marginBottom: "1rem",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="cart-pay-button"
        style={{
          opacity: !stripe || paying ? 0.6 : 1,
          cursor: !stripe || paying ? "not-allowed" : "pointer",
          marginBottom: "1rem",
        }}
      >
        {paying
          ? tCart("payment.processing")
          : `🔒 ${tCart("payment.pay")} ${formatPrice(priceGBP)}`}
      </button>

      <button
        type="button"
        onClick={onBack}
        style={{
          display: "block",
          width: "100%",
          padding: "0.75rem",
          fontFamily: "var(--font-cinzel)",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          color: "rgba(245,237,216,0.4)",
          background: "transparent",
          border: "1px solid rgba(245,237,216,0.1)",
          cursor: "pointer",
        }}
      >
        ← {tConsent("back")}
      </button>

      <p className="cart-security-text" style={{ marginTop: "1rem" }}>
        🔐 {tCart("payment.ssl")} · Stripe · 🛡️ {tCart("payment.safePayment")}
      </p>
    </form>
  );
}

export default function BookingConsentPage() {
  const t = useTranslations("bookingConsent");
  const tCart = useTranslations("cartPage");
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const { currency, formatPrice } = useCurrency();

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

  // ── Payment phase state ──
  // Once consent is saved and a token exists, we reveal Stripe right here.
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingToken, setBookingToken] = useState<string | null>(null);
  const [confirmedPrice, setConfirmedPrice] = useState<number>(
    parseFloat(searchParams.get("price") ?? "0"),
  );
  const [confirmedServiceName, setConfirmedServiceName] = useState(serviceName);

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
      // 1) Save consent + create the booking token (status: pending).
      const response = await fetch("/api/booking-consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: searchParams.get("price") ?? "",
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

      if (!response.ok || !data.success || !data.token) {
        setError(data.error ?? t("errors.saveFailed"));
        setSubmitting(false);
        return;
      }

      const token = data.token;
      const canonicalServiceName = data.serviceName ?? serviceName;
      const priceGBP =
        typeof data.priceGBP === "number" ? data.priceGBP : confirmedPrice;

      // 2) Create the Stripe payment for this booking token.
      //    The server re-checks the real price — we never trust the client.
      const checkoutResponse = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ name: canonicalServiceName }],
          currency,
          locale,
          token,
        }),
      });

      const checkoutData =
        (await checkoutResponse.json()) as CheckoutSessionResponse;

      if (!checkoutData.clientSecret) {
        setError(checkoutData.error ?? t("errors.saveFailed"));
        setSubmitting(false);
        return;
      }

      // 3) Reveal the payment form on this same page.
      setBookingToken(token);
      setConfirmedServiceName(canonicalServiceName);
      setConfirmedPrice(priceGBP);
      setClientSecret(checkoutData.clientSecret);
      setSubmitting(false);
    } catch {
      setError(t("errors.connectionFailed"));
      setSubmitting(false);
    }
  }

  // ── PAYMENT PHASE ──
  if (clientSecret && bookingToken) {
    return (
      <main className="legal-page">
        <p className="legal-label">
          <span className="legal-label-line" />
          {t("label")}
        </p>

        <section className="legal-header">
          <h1 className="legal-title">
            {t("titleMain")} <span>{t("titleGold")}</span>
          </h1>

          <p className="legal-effective-date">
            {t("serviceLabel")}: {confirmedServiceName}
          </p>
        </section>

        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(184,148,42,0.2)",
              padding: "2.5rem",
              marginBottom: "1rem",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.7rem",
                letterSpacing: "0.3em",
                color: "var(--gold)",
                marginBottom: "1.5rem",
              }}
            >
              {tCart("payment.title").toUpperCase()} ·{" "}
              {formatPrice(confirmedPrice)}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(184,148,42,0.15)",
                marginBottom: "1.5rem",
                paddingBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-raleway)",
                  fontSize: "0.85rem",
                  color: "var(--cream)",
                  opacity: 0.8,
                }}
              >
                {confirmedServiceName}
              </span>

              <span
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.85rem",
                  color: "var(--gold-lt)",
                }}
              >
                {formatPrice(confirmedPrice)}
              </span>
            </div>

            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: stripeAppearance }}
            >
              <BookingPaymentForm
                token={bookingToken}
                priceGBP={confirmedPrice}
                locale={locale}
                onBack={() => {
                  setClientSecret(null);
                  setBookingToken(null);
                }}
              />
            </Elements>
          </div>
        </div>
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
