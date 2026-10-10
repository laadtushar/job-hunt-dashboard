import type { MetadataRoute } from "next";
import { LEGAL_LAST_UPDATED, SITE_URL } from "@/lib/seo";

/**
 * Public, indexable pages only. `lastModified` is set only where the repo has
 * a real date (the legal pages' "last updated"); the others omit it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/privacy-policy`, lastModified: LEGAL_LAST_UPDATED },
    { url: `${SITE_URL}/terms-of-service`, lastModified: LEGAL_LAST_UPDATED },
    { url: `${SITE_URL}/data-request` },
  ];
}
