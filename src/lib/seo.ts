import type { Metadata } from "next";
import { FOUNDER, STUDIO } from "@/lib/family";

/**
 * Canonical origin: the final host. hyredlab.com redirects to www, so www is
 * the URL that actually serves the page.
 */
export const SITE_URL = "https://www.hyredlab.com";
export const SITE_NAME = "HyredLab";

export const HOME_TITLE = "HyredLab | AI Job Application Tracker with Gmail Sync";
export const HOME_DESCRIPTION =
  "HyredLab syncs your Gmail, uses AI to extract job applications, and organizes them in a Kanban board, grid and analytics dashboard for your job hunt.";

/** Static 1200x630 share image in /public. */
export const OG_IMAGE = {
  url: "/og-dark.png",
  width: 1200,
  height: 630,
  alt: "HyredLab, an AI-powered job tracker",
} as const;

/**
 * The date the privacy policy and terms were last edited (the last commit that
 * changed their text). Update it when the text changes. It replaces a
 * `new Date()` that showed the build date as "Last updated".
 */
export const LEGAL_LAST_UPDATED = "2026-02-26";

export function formatLegalDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Metadata for an indexable page: unique title and description, a
 * self-referencing canonical, and matching Open Graph and Twitter tags.
 * `title` is the full title as it should appear, so it is not templated.
 * Next replaces a layout's `openGraph` and `twitter` wholesale when a page sets
 * its own, so every field is set here.
 */
export function publicPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }],
    },
  };
}

/**
 * Metadata for a signed-in or utility page: kept out of search results. The
 * title is templated to "<title> | HyredLab" by the root layout.
 */
export function privatePageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: { index: false, follow: false },
  };
}

const STUDIO_ORG = {
  "@type": "Organization",
  name: STUDIO.name,
  url: STUDIO.url,
} as const;

const FOUNDER_PERSON = {
  "@type": "Person",
  name: FOUNDER.name,
  url: FOUNDER.url,
} as const;

/**
 * Home page JSON-LD. A WebApplication, because HyredLab runs in the browser.
 * No `offers`: the app sits behind an invite allowlist and nothing in the repo
 * says it is free. No ratings, reviews or user counts.
 */
export const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: HOME_DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  inLanguage: "en",
  image: `${SITE_URL}${OG_IMAGE.url}`,
  publisher: STUDIO_ORG,
  creator: STUDIO_ORG,
  author: FOUNDER_PERSON,
} as const;
