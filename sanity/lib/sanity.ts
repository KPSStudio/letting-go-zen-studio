// lib/sanity.ts
// Sanity client setup
// Used to fetch content from Sanity in all pages
// Two clients:
// - publicClient: for reading published content (no token needed)
// - adminClient: for reading drafts (uses token — server only)

import { createClient } from "@sanity/client";

// Public client — used in pages to fetch published content
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: true, // Cache responses for faster page loads
});

// Types for our content
export interface SanityService {
  _id: string;
  namePl: string;
  nameEn?: string;
  category: "body" | "mind" | "soul";
  type: "sesja" | "pakiet" | "ebook";
  descPl?: string;
  descEn?: string;
  priceGBP: number;
  pricePLN?: number;
  duration?: string;
  availability?: string;
  pdfNote?: string;
  requiresBooking?: boolean;
  calComSlug?: string;
  freeConsultation?: string;
  freeConsultationEn?: string;
  includes?: string[];
  includesEn?: string[];
  whoFor?: string[];
  whoForEn?: string[];
  warning?: string;
  warningEn?: string;
  order?: number;
  isActive?: boolean;
}

export interface SanitySklepImage {
  _key?: string;
  _type?: string;
  alt?: string;
  asset?: { _ref: string; _type: string };
}

export interface SanitySklepProduct {
  _id: string;
  productType?: "digital" | "physical" | "bundle" | "course";
  namePl: string;
  nameEn?: string;
  descPl?: string;
  descEn?: string;
  keywords?: string[];
  images?: SanitySklepImage[];
  priceGBP: number;
  pricePLN?: number;
  shippingFeeGBP?: number;
  fileName?: string;
  deliveryNote?: string;
  includes?: string[];
  isActive?: boolean;
  order?: number;
}

export interface SanityTestimonial {
  _id: string;
  name: string;
  text: string;
  service?: string;
  isActive?: boolean;
  order?: number;
}

export interface SanitySiteSettings {
  _id: string;
  yearsExperience?: number;
  phone?: string;
  email?: string;
  studioAddress?: string;
  qualifications?: string[];
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

// Fetch all active services by category
export async function getServicesByCategory(
  category: "body" | "mind" | "soul",
): Promise<SanityService[]> {
  return sanityClient.fetch(
    `*[_type == "service" && category == $category && isActive == true] | order(order asc)`,
    { category },
  );
}

// Fetch all active Sklep products
export async function getSklepProducts(): Promise<SanitySklepProduct[]> {
  return sanityClient.fetch(
    `*[_type == "sklepProduct" && isActive == true] | order(order asc)`,
  );
}

// Fetch active testimonials
export async function getTestimonials(): Promise<SanityTestimonial[]> {
  return sanityClient.fetch(
    `*[_type == "testimonial" && isActive == true] | order(order asc)`,
  );
}

// Fetch site settings (there should only be one document)
export async function getSiteSettings(): Promise<SanitySiteSettings | null> {
  return sanityClient.fetch(`*[_type == "siteSettings"][0]`);
}
