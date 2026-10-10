import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Public pages are crawlable. Everything behind sign-in, the API and the
 * access-pending page is disallowed. Keep this list in step with the pages
 * that carry `robots: { index: false }`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/analytics",
          "/import",
          "/kanban",
          "/tasks",
          "/access-denied",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
