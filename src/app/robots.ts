import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/business";
import { previewBanner } from "@/lib/config/order";

/**
 * While this is an unreleased concept build, the whole site is kept out of
 * search results — an unfinished page must never outrank the restaurant's real
 * public presence. Flip `previewBanner.enabled` to false (after approval) to
 * publish the production rules below.
 */
export default function robots(): MetadataRoute.Robots {
  if (previewBanner.enabled) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
