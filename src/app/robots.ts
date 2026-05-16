import type { MetadataRoute } from "next";

const SITE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Block authenticated areas from crawlers; the public surface is
        // limited to the login screen at "/".
        allow: ["/"],
        disallow: [
          "/api/",
          "/dashboard",
          "/repositories",
          "/stars",
          "/projects",
          "/packages",
          "/orgs",
          "/settings",
          "/notifications",
          "/issues",
          "/pulls",
          "/actions",
          "/report-bug",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
