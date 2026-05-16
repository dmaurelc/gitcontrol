import type { MetadataRoute } from "next";

const SITE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// Sitemap only lists publicly indexable URLs. Authenticated routes stay
// out — they require a session and are disallowed in robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
