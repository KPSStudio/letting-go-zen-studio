// lib/serviceAvailability.ts
//
// One place that decides whether a service involves Joanna travelling to the
// customer, so the travel-fee disclosure appears in exactly the same cases
// everywhere it is shown.
//
// The source of truth is the Sanity `availability` string on each service.
// Its option list is:
//
//   Studio · Online · Studio | Online · Dojazd · Studio | Dojazd · Studio | Online | Dojazd
//
// Only the values containing a travel token mean "Joanna comes to you". Studio
// and Online visits must NOT show a travel-fee notice — quoting a fee for an
// appointment that has no travel is its own kind of misleading.
//
// ⚠️ AS OF THIS CHANGE NO SERVICE IN SANITY IS MARKED AS A TRAVEL VISIT. All 16
// active services are Studio, Online, or Studio | Online, so the notice renders
// nowhere yet. It will appear automatically the moment Joanna sets a service's
// Dostępność to one of the Dojazd options in the Studio.

/** Tokens that mean the appointment happens at the customer's address. */
const HOME_VISIT_TOKENS = [
    'dojazd',      // PL: travel to the client
    'home visit',  // EN, if the field is ever filled in English
    'u klienta',   // PL: "at the client's"
]

/**
 * True when the service's availability says Joanna travels to the customer.
 *
 * Deliberately conservative: an empty, missing or unrecognised availability
 * returns false, because we can only justify showing a fee notice when the
 * data positively says there is travel.
 */
export function involvesHomeVisit(availability?: string | null): boolean {
    if (!availability) return false

    const normalised = availability.toLowerCase()

    return HOME_VISIT_TOKENS.some((token) => normalised.includes(token))
}
