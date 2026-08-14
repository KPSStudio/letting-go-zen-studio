"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/lib/CartContext";
import { useCurrency, SYMBOLS } from "@/lib/CurrencyContext";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripeClient";


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

// NOTE: this file used to carry a second, booking-shaped checkout — details
// parsed out of the query string, a branch that re-added a service to the cart,
// and a return_url pointing at the old payment-gate page. That whole flow was
// replaced by the Cal.com embed on the consent page, and the gate page no
// longer exists, so every one of those paths was dead code pointing at a 404.
// The cart is now only a cart.

function PaymentForm({
  onBack,
  totalGbpBase,
  formatPrice,
}: {
  onBack: () => void;
  /** Always the GBP base amount — formatPrice() does the conversion. */
  totalGbpBase: number;
  formatPrice: (n: number) => string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const locale = useLocale();
  const t = useTranslations("cartPage");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Required: without an email address we cannot send the order confirmation,
  // and Joanna has no way to deliver the purchased materials.
  const [email, setEmail] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Stop before charging if there is no address to deliver to.
    if (!email) {
      setError(t("payment.emailRequired"));
      return;
    }

    setPaying(true);
    setError(null);

    const returnUrl = new URL(`${window.location.origin}/${locale}/koszyk`);
    returnUrl.searchParams.set("success", "true");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl.toString(),
        // receipt_email puts the address on the PaymentIntent itself, which is
        // what the webhook reads (pi.receipt_email) to send the confirmation.
        // We also keep it on billing_details so it shows on the Stripe charge.
        receipt_email: email,
        payment_method_data: {
          billing_details: {
            email,
          },
        },
      },
    });

    if (error) {
      setError(error.message ?? t("payment.fallbackError"));
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handlePay}>
      {/* Email is required — the order confirmation and Joanna's delivery
          both depend on it. Mirrors the field used in the shop checkout. */}
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="cart-email"
          style={{
            display: "block",
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            color: "var(--gold)",
            marginBottom: "0.5rem",
          }}
        >
          {t("payment.emailLabel")}
        </label>

        <input
          id="cart-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("payment.emailPlaceholder")}
          required
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(184,148,42,0.3)",
            color: "var(--cream)",
            fontFamily: "var(--font-raleway)",
            fontSize: "0.9rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        <p
          style={{
            marginTop: "0.4rem",
            fontFamily: "var(--font-raleway)",
            fontSize: "0.75rem",
            color: "rgba(245,237,216,0.5)",
          }}
        >
          {t("payment.emailHint")}
        </p>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <PaymentElement />
      </div>

      {/* Payment errors appear after an async round trip, so they must be
          announced rather than only drawn. */}
      <p
        role="status"
        aria-live="polite"
        style={{
          fontFamily: "var(--font-raleway)",
          fontSize: "0.85rem",
          color: "#ff6b6b",
          marginBottom: error ? "1rem" : 0,
        }}
      >
        {error}
      </p>

      <button
        type="submit"
        disabled={!stripe || paying || !email}
        className="cart-pay-button"
        style={{
          opacity: !stripe || paying || !email ? 0.6 : 1,
          cursor: !stripe || paying || !email ? "not-allowed" : "pointer",
          marginBottom: "1rem",
        }}
      >
        {paying
          ? t("payment.processing")
          : `🔒 ${t("payment.pay")} ${formatPrice(totalGbpBase)}`}
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
        ← {t("payment.backToCart")}
      </button>

      <p className="cart-security-text" style={{ marginTop: "1rem" }}>
        🔐 {t("payment.ssl")} · Stripe · 🛡️ {t("payment.safePayment")}
      </p>
    </form>
  );
}

export default function KoszykPage() {
  const t = useTranslations("cartPage");
  const locale = useLocale();
  // addItem is deliberately not pulled in: the only caller was the removed
  // `booked=true` branch that re-added a booked service to the cart.
  const { items, removeItem, clearCart, count, totalGBP } = useCart();
  const { currency, formatPrice } = useCurrency();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Read the post-payment flag AFTER mount so the server render and the first
  // client render agree. Reading window.location during render would make the
  // server (no window) and client disagree and break hydration.
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsPaymentSuccess(params.get("success") === "true");
  }, []);

  // formatPrice() takes a GBP amount and converts it to the active currency,
  // so it must always be handed the GBP base. This used to pass totalPLN when
  // PLN was selected, which multiplied by the 5.2 rate a SECOND time and showed
  // roughly 27x the real price — while the PaymentIntent was charged correctly.
  const totalGbpBase = totalGBP;

  const currencySymbol = SYMBOLS[currency];

  const typeLabels: Record<string, string> = {
    sesja: t("types.session"),
    session: t("types.session"),
    pakiet: t("types.package"),
    package: t("types.package"),
    pdf: t("types.pdf"),
    ebook: t("types.ebook"),
    produkt: t("types.product"),
    product: t("types.product"),
  };

  async function handleCheckout() {
    if (!termsAccepted) {
      setCheckoutError(t("errors.acceptTerms"));
      return;
    }

    // Guard against a second click landing while the first request is still in
    // flight, which would create a second PaymentIntent.
    if (loading) return;

    setLoading(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only names go up; every price is re-read from Sanity server-side.
        body: JSON.stringify({
          items: items.map((item) => ({ name: item.name })),
          currency,
          locale,
        }),
      });

      const data = await res.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setCheckoutError(data.error ?? t("errors.generic"));
      }
    } catch {
      setCheckoutError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  if (isPaymentSuccess) {
    return (
      <div className="thankyou-page">
        <div className="thankyou-orbit">
          <div className="thankyou-orbit-dot" />
          <div className="thankyou-orbit-dot" />
          <div className="thankyou-orbit-dot" />
        </div>

        <div className="thankyou-aura" />

        <div className="thankyou-rising-dots">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="thankyou-content">
          <div className="thankyou-symbol">✦</div>

          <p className="thankyou-label">
            <span />
            {t("thankYou.label")}
            <span />
          </p>

          <h1 className="thankyou-title">{t("thankYou.title")}</h1>

          <div className="thankyou-divider" />

          <p className="thankyou-text">{t("thankYou.paymentText")}</p>

          <p className="thankyou-subtext">{t("thankYou.subtext")}</p>

          <Link href={`/${locale}`} className="thankyou-button">
            {t("thankYou.homeButton")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="cart-page">
      <p className="cart-label">
        <span />
        {t("label")}
      </p>

      <section className="cart-header">
        <h1 className="cart-title">{t("title")}</h1>
      </section>

      {count === 0 && !clientSecret && (
        <section className="cart-empty-card">
          <div className="cart-empty-icon">🛒</div>
          <h2 className="cart-empty-title">{t("emptyTitle")}</h2>
          <p className="cart-empty-text">{t("emptyText")}</p>

          <Link href={`/${locale}`} className="cart-primary-link">
            {t("browseButton")}
          </Link>
        </section>
      )}

      {count > 0 && !clientSecret && (
        <section className="cart-layout">
          <div className="cart-items-column">
            <div className="cart-items-card">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  className={`cart-item ${index < items.length - 1 ? "cart-item-border" : ""}`}
                >
                  <div className="cart-item-main">
                    <p className="cart-item-name">{item.name}</p>

                    <p className="cart-item-type">
                      {typeLabels[item.type] ?? item.type}
                    </p>
                  </div>

                  <p className="cart-item-price">{formatPrice(item.gbp)}</p>

                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={t("removeItem")}
                    className="cart-remove-button"
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>

            <button onClick={clearCart} className="cart-clear-button">
              {t("clearCart")}
            </button>
          </div>

          <aside className="cart-summary-card">
            <p className="cart-summary-label">{t("summary.title")}</p>

            <div className="cart-summary-rows">
              {[
                { label: t("summary.products"), value: count.toString() },
                {
                  label: t("summary.currency"),
                  value: `${currency} ${currencySymbol}`,
                },
                {
                  label: t("summary.delivery"),
                  value: t("summary.deliveryValue"),
                },
              ].map((row) => (
                <div key={row.label} className="cart-summary-row">
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>

            <div className="cart-total-row">
              <span>{t("totalLabel")}</span>
              <strong>{formatPrice(totalGbpBase)}</strong>
            </div>

            <label className="cart-terms-row">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />

              <span>
                {t("terms.accept")}{" "}
                <Link href={`/${locale}/regulamin`} className="cart-terms-link">
                  {t("terms.regulamin")}
                </Link>
                {", "}
                <Link
                  href={`/${locale}/polityka-prywatnosci`}
                  className="cart-terms-link"
                >
                  {t("terms.privacy")}
                </Link>
                {", "}
                <Link
                  href={`/${locale}/zasady-uslug`}
                  className="cart-terms-link"
                >
                  {t("terms.serviceRules")}
                </Link>{" "}
                {t("terms.and")}{" "}
                <Link
                  href={`/${locale}/zgoda-swiadoma`}
                  className="cart-terms-link"
                >
                  {t("terms.informedConsent")}
                </Link>
              </span>
            </label>

            <button
              onClick={handleCheckout}
              disabled={!termsAccepted || loading}
              className="cart-pay-button"
              style={{
                opacity: !termsAccepted || loading ? 0.5 : 1,
                cursor: !termsAccepted || loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? t("payment.loading") : `🔒 ${t("payButton")}`}
            </button>

            {/* Replaces a blocking alert(): announced to screen readers and
                dismissible by simply fixing the problem. */}
            <p
              role="status"
              aria-live="polite"
              style={{
                margin: checkoutError ? "0.75rem 0 0" : 0,
                fontFamily: "var(--font-raleway)",
                fontSize: "0.85rem",
                color: "#ff6b6b",
              }}
            >
              {checkoutError}
            </p>

            <p className="cart-security-text">
              🔐 {t("security.ssl")} · Stripe · 🛡️ {t("security.safePayment")}
            </p>
          </aside>
        </section>
      )}

      {clientSecret && (
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
              {t("payment.title").toUpperCase()} · {formatPrice(totalGbpBase)}
            </p>

            <div
              style={{
                borderBottom: "1px solid rgba(184,148,42,0.15)",
                marginBottom: "1.5rem",
                paddingBottom: "1.5rem",
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
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
                    {item.name}
                  </span>

                  <span
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.85rem",
                      color: "var(--gold-lt)",
                    }}
                  >
                    {formatPrice(item.gbp)}
                  </span>
                </div>
              ))}
            </div>

            <Elements
              stripe={getStripe()}
              options={{ clientSecret, appearance: stripeAppearance }}
            >
              <PaymentForm
                onBack={() => setClientSecret(null)}
                totalGbpBase={totalGbpBase}
                formatPrice={formatPrice}
              />
            </Elements>
          </div>
        </div>
      )}
    </main>
  );
}
