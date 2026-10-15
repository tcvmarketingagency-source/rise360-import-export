/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BUSINESS FACTS — single source of truth.
 *
 * EVERY value in `verified` is publicly posted by Maitri Residency / Hotel Maitri
 * and is safe to display. Everything under `unconfirmed` is intentionally empty
 * or null until the restaurant approves it. The UI renders those as clearly
 * labelled placeholders in preview mode instead of inventing answers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CONCEPT_DISCLAIMER =
  "Private concept build — not Maitri Residency's official live website. Menu items, prices, delivery areas and timings shown are placeholders for review.";

export const brand = {
  name: "Maitri Residency",
  shortName: "Maitri",
  hospitalityName: "Hotel Maitri",
  /** Working wordmark. Replace with the official logo file when supplied. */
  logoSrc: null as string | null,
  tagline: "A taste that feels closer.",
  city: "Karimnagar",
  region: "Telangana",
  country: "India",
  /** Working concept headline for the delivery experience. */
  concept: "From Maitri's Kitchen to Your Doorstep",
} as const;

/** Verified, publicly posted details. Safe to render in production copy. */
export const verified = {
  address: {
    line1: "H.No. 2-8-266 & 267",
    line2: "Beside Circus Grounds, Mukaram Pura",
    locality: "Mukaram Pura",
    city: "Karimnagar",
    region: "Telangana",
    postalCode: "505001",
    country: "India",
    countryCode: "IN",
    full: "H.No. 2-8-266 & 267, beside Circus Grounds, Mukaram Pura, Karimnagar – 505001, Telangana, India",
  },
  /** Publicly posted food-delivery order number. */
  deliveryPhone: {
    e164: "+918985051111",
    display: "+91 89850 51111",
    tel: "+918985051111",
    whatsapp: "918985051111",
  },
  links: {
    instagram: "https://www.instagram.com/maitriresidency/",
    legacyWebsite: "https://www.maitriresidency.com/",
  },
  instagramHandle: "@maitriresidency",
} as const;

/**
 * Contact details published on the restaurant's existing website that still need
 * to be reconciled against the publicly posted delivery number. Surfaced in the
 * UI (preview mode) and in the handoff checklist — never silently merged.
 */
export const legacyContactConflicts = [
  {
    id: "legacy-phone",
    label: "Legacy contact number listed on maitriresidency.com",
    detail:
      "The existing site lists older contact details that differ from the publicly posted delivery number. Confirm which numbers stay live, and whether calls and delivery orders should share one line.",
  },
  {
    id: "legacy-hours",
    label: "Opening hours and kitchen cut-off times",
    detail:
      "Not stated consistently across public channels. Needed before any delivery window, order cut-off or 'open now' indicator is shown.",
  },
  {
    id: "legacy-menu",
    label: "Official menu, prices and portion sizes",
    detail:
      "The menu on this concept site is authored sample content, not Maitri's menu. Restaurant menu sheets (with current prices) must replace it before launch.",
  },
  {
    id: "legacy-delivery-area",
    label: "Delivery areas, charges and minimum order",
    detail:
      "Delivery radius, per-area charges, free-delivery thresholds and minimum order value are unconfirmed. Fields exist in configuration and are switched off until supplied.",
  },
] as const;

/** Values the UI must never assume. Kept null so nothing can leak into copy. */
export const unconfirmed = {
  hours: null,
  deliveryAreas: null,
  deliveryCharge: null,
  minimumOrder: null,
  taxes: null,
  ratings: null,
  awards: null,
  signatureDishes: null,
} as const;

/** Owned accounts this concept links out to. */
export const externalLinks = [
  {
    id: "instagram",
    label: "Instagram",
    handle: verified.instagramHandle,
    href: verified.links.instagram,
    note: "Official account — delivery announcement posted here.",
  },
  {
    id: "website",
    label: "Hotel website",
    handle: "maitriresidency.com",
    href: verified.links.legacyWebsite,
    note: "Existing hotel site — stays, dining and celebration enquiries.",
  },
] as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const telHref = `tel:${verified.deliveryPhone.tel}`;

export const whatsappBaseHref = `https://wa.me/${verified.deliveryPhone.whatsapp}`;
