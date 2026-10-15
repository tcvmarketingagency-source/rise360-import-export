import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/business";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/handoff`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/policies/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    {
      url: `${siteUrl}/policies/order-delivery`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
