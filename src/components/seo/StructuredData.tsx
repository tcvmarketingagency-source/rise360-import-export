import { brand, siteUrl, verified } from "@/lib/config/business";

/**
 * Structured data — built ONLY from publicly posted facts. No ratings, no price
 * range, no cuisine claims, no delivery promises: those all need Maitri's
 * confirmation first (see HANDOFF.md).
 */
export function StructuredData() {
  const restaurant = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${siteUrl}/#restaurant`,
    name: brand.hospitalityName,
    alternateName: brand.name,
    description:
      "Hotel and restaurant in Karimnagar, Telangana. This page is a concept experience prepared for Maitri Residency and is not the restaurant's official website.",
    disambiguatingDescription:
      "Concept build. Menu items, prices, delivery areas and timings shown here are placeholders pending approval by Maitri Residency.",
    telephone: verified.deliveryPhone.display,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${verified.address.line1}, ${verified.address.line2}`,
      addressLocality: verified.address.city,
      addressRegion: verified.address.region,
      postalCode: verified.address.postalCode,
      addressCountry: verified.address.countryCode,
    },
    sameAs: [verified.links.instagram, verified.links.legacyWebsite],
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/#webpage`,
    name: "Maitri Residency — concept menu & delivery experience",
    url: siteUrl,
    isPartOf: { "@id": `${siteUrl}/#restaurant` },
    about: { "@id": `${siteUrl}/#restaurant` },
    inLanguage: "en-IN",
    // Makes the unreleased status machine-readable too.
    creativeWorkStatus: "Draft",
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify([restaurant, webPage]) }}
    />
  );
}
