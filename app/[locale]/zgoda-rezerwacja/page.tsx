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
import {
  useEffect,
  useState,
  type ComponentType,
  type FormEvent,
} from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_USERNAME } from "@/lib/calcom";
import TravelFeeNotice from "@/components/common/TravelFeeNotice";
import { involvesHomeVisit } from "@/lib/serviceAvailability";
import BackControl from "@/components/common/BackControl";
import BotanicalOrnament from "@/components/common/BotanicalOrnament";
import {
  ConversationIcon,
  PreparationIcon,
  ShieldIcon,
  PersonIcon,
  CycleIcon,
  LockIcon,
  SpiralFigureIcon,
  QuillIcon,
  MindIcon,
} from "@/components/home/PillarIcons";

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
  /** Decorative glyph shown beside the declaration. */
  Icon: ComponentType<{ className?: string }>;
};

type BookingConsentResponse = {
  success?: boolean;
  calSlug?: string;
  serviceName?: string;
  /** Server-derived Studio / Online / Dojazd, used for the travel-fee notice. */
  availability?: string | null;
  error?: string;
};

/**
 * The five acknowledgements. These are statements the customer confirms
 * ("I take part voluntarily", "I understand this is not medical treatment",
 * "the health information I gave is true", …) rather than GDPR consents, so
 * they are displayed as a readable list and confirmed together by ONE
 * checkbox whose label says exactly that.
 *
 * They are still stored — and submitted — as five independent booleans, so the
 * audit record is unchanged and shows precisely what was agreed.
 */
const declarationItems: ConsentItem[] = [
  {
    key: "participatesVoluntarily",
    translationKey: "checks.participatesVoluntarily",
    Icon: ConversationIcon,
  },
  {
    key: "understandsServiceNature",
    translationKey: "checks.understandsServiceNature",
    Icon: PreparationIcon,
  },
  {
    key: "understandsNotMedicalTreatment",
    translationKey: "checks.understandsNotMedicalTreatment",
    Icon: ShieldIcon,
  },
  {
    key: "truthfulHealthInformation",
    translationKey: "checks.truthfulHealthInformation",
    Icon: PersonIcon,
  },
  {
    key: "mayStopAnyTime",
    translationKey: "checks.mayStopAnyTime",
    Icon: CycleIcon,
  },
];

/**
 * What the combined checkbox sets: the five acknowledgements above plus
 * acceptance of the Terms and Privacy Policy — exactly what its label states.
 *
 * `dataProcessingConsent` is deliberately NOT in this list. That one is a
 * genuine GDPR consent covering health-related data, which has to be a
 * separate, granular opt-in rather than something bundled into a confirmation
 * of unrelated statements.
 */
const COMBINED_KEYS: ConsentKey[] = [
  ...declarationItems.map((item) => item.key),
  "termsAndPrivacyAccepted",
];

/**
 * The number of affirmative actions the customer has to take: the combined
 * confirmation and the separate data-processing consent. Shown in the progress
 * counter, so it counts controls the customer actually clicks — not the seven
 * booleans those two controls set.
 */
const TOTAL_CONSENTS = 2;

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
  // Whether THIS service is a home visit, per Sanity (never per the URL).
  const [isHomeVisit, setIsHomeVisit] = useState(false);

  // The combined confirmation is "on" only when every key it covers is set.
  const combinedAccepted = COMBINED_KEYS.every((key) => consent[key]);

  // Counts the two affirmative controls, so the progress text always matches
  // what the customer sees rather than the underlying booleans.
  const acceptedConsentCount =
    (combinedAccepted ? 1 : 0) + (consent.dataProcessingConsent ? 1 : 0);

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

  /**
   * The combined confirmation. It sets exactly the keys its label names — the
   * five acknowledgements and the Terms/Privacy acceptance — and never touches
   * `dataProcessingConsent`, which the customer opts into separately.
   */
  function updateCombinedConsent(value: boolean) {
    setConsent((previousConsent) => {
      const next = { ...previousConsent };
      for (const key of COMBINED_KEYS) next[key] = value;
      return next;
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
      setIsHomeVisit(involvesHomeVisit(data.availability));
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

        {/* The location is chosen INSIDE the Cal.com widget, so we cannot read
            it from here. For a service Sanity marks as a home visit we
            therefore disclose the travel fee immediately above the calendar —
            before the customer picks a slot and before Cal.com takes payment. */}
        {isHomeVisit && <TravelFeeNotice variant="standalone" />}

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
  //
  // Layout: one open header, a single hairline rule, then two columns on
  // desktop — the seven declarations on the left, the customer's details and
  // signature on the right. Nothing here is boxed except the form controls
  // themselves, which are functional.
  return (
    <main className="consent-page">
      {/* The shared floating glyph replaces the old "← POWRÓT" text link, so
          this page uses the same back affordance as Ciało / Umysł / Dusza. */}
      <BackControl
        href={`/${locale}/body`}
        label={t("back")}
        ariaLabel={t("backAria")}
      />

      {/* Botanical line art, as in the reference: a bloom behind the header
          on the right and a sprig in the top corner. Both are clipped by
          .consent-page and hidden from assistive technology. */}
      <BotanicalOrnament className="consent-art-bloom" />
      <BotanicalOrnament variant="sprig" className="consent-art-sprig" />

      <header className="consent-header">
        <p className="consent-eyebrow">
          <span className="consent-eyebrow-line" aria-hidden="true" />
          <span className="consent-eyebrow-diamond" aria-hidden="true" />
          {t("label")}
        </p>

        <h1 className="consent-title">
          {t("titleMain")} <span>{t("titleGold")}</span>
        </h1>

        <p className="consent-intro">{t("intro")}</p>

        {/* The chosen service, with a small lotus glyph beside it. */}
        <p className="consent-service">
          <span className="consent-service-icon" aria-hidden="true">
            <MindIcon />
          </span>

          <span className="consent-service-copy">
            <span className="consent-service-label">{t("serviceLabel")}</span>
            <span className="consent-service-name">{serviceName}</span>
          </span>
        </p>
      </header>

      <form id="consent-form" onSubmit={handleSubmit} className="consent-form">
        <section className="consent-col" aria-labelledby="consent-checks-title">
          <h2 id="consent-checks-title" className="consent-section-title">
            {t("confirmationsTitle")}
            <span className="consent-title-diamond" aria-hidden="true" />
          </h2>

          {/* Announced politely as the count changes, so a screen-reader user
              knows how many declarations remain without hunting the list. */}
          <p
            className={`consent-progress${allConsentsAccepted ? " is-complete" : ""}`}
            aria-live="polite"
          >
            {allConsentsAccepted
              ? t("completionDone", { total: TOTAL_CONSENTS })
              : t("completion", {
                  done: acceptedConsentCount,
                  total: TOTAL_CONSENTS,
                })}
          </p>

          <div
            className={`consent-list${allConsentsAccepted ? " is-complete" : ""}`}
          >
            {/* The statements being confirmed, shown in full so the single
                confirmation below is an informed one. They are text, not
                controls — the checkbox that follows is what agrees to them. */}
            <ul className="consent-declarations">
              {declarationItems.map((item) => (
                <li key={item.key} className="consent-declaration">
                  <span className="consent-row-icon" aria-hidden="true">
                    <item.Icon />
                  </span>

                  <span className="consent-declaration-text">
                    {t(item.translationKey)}
                  </span>
                </li>
              ))}
            </ul>

            {/* ONE confirmation covering the statements above plus the Terms
                and Privacy Policy — and its label says exactly that, so the
                click matches what it does.

                It deliberately does NOT set `dataProcessingConsent`. That is a
                GDPR consent for health-related data and has to be its own
                granular opt-in; bundling it into a confirmation of unrelated
                statements is what makes such consent challengeable. */}
            <label
              className={`consent-row${combinedAccepted ? " is-checked" : ""}`}
            >
              <input
                type="checkbox"
                className="consent-checkbox"
                checked={combinedAccepted}
                onChange={(event) => updateCombinedConsent(event.target.checked)}
              />

              <span className="consent-row-icon" aria-hidden="true">
                <SpiralFigureIcon />
              </span>

              <span className="consent-row-text">
                {t("checks.confirmAllPrefix")}{" "}
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

            {/* The one genuine GDPR consent, kept separate on purpose. */}
            <label
              className={`consent-row${consent.dataProcessingConsent ? " is-checked" : ""}`}
            >
              <input
                type="checkbox"
                className="consent-checkbox"
                checked={consent.dataProcessingConsent}
                onChange={(event) =>
                  updateConsent("dataProcessingConsent", event.target.checked)
                }
              />

              <span className="consent-row-icon" aria-hidden="true">
                <LockIcon />
              </span>

              <span className="consent-row-text">
                {t("checks.dataProcessingConsent")}
              </span>
            </label>
          </div>
        </section>

        <section className="consent-col" aria-labelledby="consent-details-title">
          <h2 id="consent-details-title" className="consent-section-title">
            {t("detailsTitle")}
            <span className="consent-title-diamond" aria-hidden="true" />
          </h2>

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

          {/* Read-only: it is what the customer chose, not something to edit
              here. Styled flatter than the editable fields so that reads at a
              glance rather than only on focus. */}
          <div className="contact-form-field consent-field-readonly">
            <label htmlFor="serviceName">{t("fields.serviceName")}</label>
            <input id="serviceName" type="text" value={serviceName} readOnly />
          </div>

          {/* The signature closes the record, so it is given its own quiet
              emphasis: a wider field, a ruled baseline to sign on, and the
              existing notice immediately beneath it. No extra frame. */}
          <div className="contact-form-field consent-signature">
            <label htmlFor="typedSignature">{t("fields.typedSignature")}</label>

            <span className="consent-signature-field">
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

              {/* Decorative quill sitting on the signature line. */}
              <span className="consent-signature-quill" aria-hidden="true">
                <QuillIcon />
              </span>
            </span>
          </div>

          {/* The signature notice reads as its own quiet strip, with a shield
              glyph — the one other bounded element on the page. */}
          <p className="consent-notice">
            <span className="consent-notice-icon" aria-hidden="true">
              <ShieldIcon />
            </span>
            <span>{t("signatureNotice")}</span>
          </p>

          {/* Errors sit with the form they belong to, as a line with a red
              accent rather than another bordered panel. */}
          {!serviceId && (
            <p className="consent-error" role="alert">
              {t("errors.noBookingConfigured")}
            </p>
          )}

          {error && (
            <p className="consent-error" role="alert">
              {error}
            </p>
          )}

        </section>
      </form>

      {/* Full-width CTA beneath the panel, as in the reference. It is inside
          the form element via the `form` attribute, so Enter-to-submit and
          native validation behave exactly as before. */}
      <button
        type="submit"
        form="consent-form"
        disabled={!canSubmit}
        className="consent-submit"
      >
        {submitting ? t("submitting") : t("submit")}
        <span className="consent-submit-arrow" aria-hidden="true">
          &rarr;
        </span>
      </button>
    </main>
  );
}
