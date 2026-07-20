// app/api/booking-consent/route.ts
// Saves booking/session consent before the client is sent to payment.
// Generates a single-use booking token. The token only advances to
// 'payment_confirmed' via the Stripe webhook — never from the client.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { getBookableServiceByName } from "@/lib/sanity-server";
import { getCalSlug } from "@/lib/calcom";

type BookingConsentRequestBody = {
  serviceId: string;
  serviceName: string;
  locale: string;

  customerFullName: string;
  customerEmail: string;
  customerPhone: string;

  participatesVoluntarily: boolean;
  understandsServiceNature: boolean;
  understandsNotMedicalTreatment: boolean;
  truthfulHealthInformation: boolean;
  mayStopAnyTime: boolean;
  dataProcessingConsent: boolean;
  termsAndPrivacyAccepted: boolean;

  typedSignature: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const contactEmailValue = process.env.CONTACT_EMAIL;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseServiceRoleKey)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) return null;
  return forwardedFor.split(",")[0]?.trim() ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingConsentRequestBody;

    const serviceId = normalizeText(body.serviceId);
    const serviceName = normalizeText(body.serviceName);
    const requestedLocale = normalizeText(body.locale || "pl");
    const locale = requestedLocale === "en" ? "en" : "pl";

    const customerFullName = normalizeText(body.customerFullName);
    const customerEmail = normalizeText(body.customerEmail);
    const customerPhone = normalizeText(body.customerPhone);
    const typedSignature = normalizeText(body.typedSignature);

    if (!serviceId || !serviceName) {
      return NextResponse.json(
        { error: "Missing service information." },
        { status: 400 },
      );
    }

    if (!customerFullName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 },
      );
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 },
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 },
      );
    }

    if (!typedSignature) {
      return NextResponse.json(
        { error: "Typed signature is required." },
        { status: 400 },
      );
    }

    const allRequiredConsentAccepted =
      body.participatesVoluntarily &&
      body.understandsServiceNature &&
      body.understandsNotMedicalTreatment &&
      body.truthfulHealthInformation &&
      body.mayStopAnyTime &&
      body.dataProcessingConsent &&
      body.termsAndPrivacyAccepted;

    if (!allRequiredConsentAccepted) {
      return NextResponse.json(
        { error: "All consent confirmations are required." },
        { status: 400 },
      );
    }

    // ── SERVER-SIDE SERVICE LOOKUP ──
    // We do NOT trust the price or Cal.com slug from the URL. We look up
    // the bookable service in Sanity, then derive both from that one row.
    const service = await getBookableServiceByName(serviceName);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found, inactive, or not bookable." },
        { status: 400 },
      );
    }

    const trustedServiceId = service.calComSlug ?? getCalSlug(service.namePl) ?? "";

    if (!trustedServiceId) {
      return NextResponse.json(
        { error: "This service is missing its Cal.com booking slug." },
        { status: 400 },
      );
    }

    const acceptedAt = new Date().toISOString();

    // ── BOOKING TOKEN ──
    // 64-char random hex string. Expires in 2 hours.
    // Status starts at 'pending' — only the Stripe webhook can
    // advance it to 'payment_confirmed'.
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2);

    const { error: tokenError } = await supabase.from("booking_tokens").insert({
      token,
      service_id: trustedServiceId,
      service_name: service.namePl,
      price_gbp: service.priceGBP,
      customer_email: customerEmail,
      locale,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    });

    if (tokenError) {
      console.error("Booking token insert error:", tokenError);
      return NextResponse.json(
        { error: "Could not create booking token." },
        { status: 500 },
      );
    }

    const bookingUrl = `/${locale}/rezerwacja?service=${encodeURIComponent(trustedServiceId)}&serviceName=${encodeURIComponent(service.namePl)}&price=${encodeURIComponent(service.priceGBP)}&locale=${locale}`;

    // Redirect to Koszyk carries the token + the REAL price from Sanity
    const redirectUrl = `/${locale}/koszyk?booked=true&serviceId=${encodeURIComponent(trustedServiceId)}&serviceName=${encodeURIComponent(service.namePl)}&price=${encodeURIComponent(service.priceGBP)}&token=${token}&locale=${locale}`;

    const { error: supabaseError } = await supabase
      .from("booking_consents")
      .insert({
        service_id: trustedServiceId,
        service_name: service.namePl,
        cal_com_url: bookingUrl,
        customer_full_name: customerFullName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        participates_voluntarily: body.participatesVoluntarily,
        understands_service_nature: body.understandsServiceNature,
        understands_not_medical_treatment: body.understandsNotMedicalTreatment,
        truthful_health_information: body.truthfulHealthInformation,
        may_stop_any_time: body.mayStopAnyTime,
        data_processing_consent: body.dataProcessingConsent,
        terms_and_privacy_accepted: body.termsAndPrivacyAccepted,
        typed_signature: typedSignature,
        locale,
        accepted_at: acceptedAt,
        ip_address: getClientIp(request),
        user_agent: request.headers.get("user-agent"),
      });

    if (supabaseError) {
      console.error("Supabase booking consent error:", supabaseError);
      return NextResponse.json(
        { error: "Could not save consent record." },
        { status: 500 },
      );
    }

    if (resend && contactEmailValue) {
      const safeServiceName = escapeHtml(service.namePl);
      const safeCustomerFullName = escapeHtml(customerFullName);
      const safeCustomerEmail = escapeHtml(customerEmail);
      const safeCustomerPhone = escapeHtml(customerPhone);
      const safeTypedSignature = escapeHtml(typedSignature);

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Letting Go Zen Studio <onboarding@resend.dev>",
          to: contactEmailValue,
          subject: `Nowa zgoda na rezerwację: ${service.namePl}`,
          html: `
                <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px;">
                    <h1 style="color: #B8942A;">Nowa zgoda na rezerwację</h1>

                    <p><strong>Usługa:</strong> ${safeServiceName}</p>
                    <p><strong>Cena:</strong> £${service.priceGBP}</p>
                    <p><strong>Imię i nazwisko:</strong> ${safeCustomerFullName}</p>
                    <p><strong>Email:</strong> ${safeCustomerEmail}</p>
                    <p><strong>Telefon:</strong> ${safeCustomerPhone}</p>
                    <p><strong>Podpis wpisany:</strong> ${safeTypedSignature}</p>
                    <p><strong>Data akceptacji:</strong> ${acceptedAt}</p>

                    <hr />

                    <h2 style="color: #B8942A;">Potwierdzenia klienta</h2>

                    <ul>
                        <li>Uczestniczy dobrowolnie: TAK</li>
                        <li>Rozumie charakter usługi: TAK</li>
                        <li>Rozumie, że usługa nie jest leczeniem medycznym: TAK</li>
                        <li>Potwierdza prawdziwość informacji zdrowotnych: TAK</li>
                        <li>Rozumie, że może przerwać sesję w dowolnym momencie: TAK</li>
                        <li>Wyraża zgodę na przetwarzanie danych: TAK</li>
                        <li>Akceptuje Regulamin i Politykę Prywatności: TAK</li>
                    </ul>

                    <p style="font-size: 13px; color: #777;">
                        Rekord zapisany w Supabase (booking_consents).
                    </p>
                </div>
            `,
        });

        if (emailError) {
          console.error("Booking consent email error:", emailError);
        }
      } catch (emailError) {
        console.error("Booking consent email error:", emailError);
      }
    } else {
      console.warn("Booking consent email skipped: missing Resend API key or contact email.");
    }

    return NextResponse.json({
      success: true,
      token,
      serviceName: service.namePl,
      priceGBP: service.priceGBP,
      redirectUrl,
    });
  } catch (error) {
    console.error("Booking consent route error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
