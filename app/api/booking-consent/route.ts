// app/api/booking-consent/route.ts
// Saves the booking consent (the legal audit record) before the customer
// is shown the Cal.com calendar.
//
// Since bookings are now paid THROUGH the embedded Cal.com widget (Cal.com's
// own Stripe integration), this route no longer creates a payment token or
// takes payment itself. Its two jobs are:
//   1. Validate that the requested service really exists and is bookable,
//      and derive its Cal.com slug from Sanity (never trusting the URL).
//   2. Store the signed consent in Supabase with an audit trail (IP + agent),
//      then return the slug so the page can boot the correct calendar.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBookableServiceByName } from "@/lib/sanity-server";
import { getCalSlug, CAL_USERNAME } from "@/lib/calcom";

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

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseServiceRoleKey)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
    // We never trust the Cal.com slug from the URL. We look the bookable
    // service up in Sanity and derive its slug from that one row, so the
    // customer always ends up on the calendar for the service they consented
    // to. (Priority: the Sanity calComSlug, then the lib/calcom.ts fallback.)
    const service = await getBookableServiceByName(serviceName);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found, inactive, or not bookable." },
        { status: 400 },
      );
    }

    const calSlug = service.calComSlug ?? getCalSlug(service.namePl) ?? "";

    if (!calSlug) {
      return NextResponse.json(
        { error: "This service is missing its Cal.com booking slug." },
        { status: 400 },
      );
    }

    const acceptedAt = new Date().toISOString();

    // The public Cal.com link for this service, stored on the consent record
    // purely as an audit reference of what the customer was sent to book.
    const calComUrl = `${CAL_USERNAME}/${calSlug}`;

    const { error: supabaseError } = await supabase
      .from("booking_consents")
      .insert({
        service_id: calSlug,
        service_name: service.namePl,
        cal_com_url: calComUrl,
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

    // The page uses calSlug to load the correct Cal.com calendar inline.
    return NextResponse.json({
      success: true,
      calSlug,
      serviceName: service.namePl,
    });
  } catch (error) {
    console.error("Booking consent route error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
