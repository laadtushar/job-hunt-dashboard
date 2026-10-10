/**
 * The LabyNator family of sites: one list, read by the footer block and the
 * JSON-LD, so a name, blurb or URL changes in one place.
 *
 * Source of truth: labynator `src/lib/apps.ts` (laadtushar/labynator, branch
 * master). Change a name, blurb or URL there first, then mirror it here.
 * URLs are the final host after redirects, so the links never go through one.
 */

/** The studio behind the apps. */
export const STUDIO = {
  name: "LabyNator",
  url: "https://www.labynator.com",
} as const;

/** The founder, who builds every app in the family. */
export const FOUNDER = {
  name: "Tushar Laad",
  url: "https://www.tusharlaad.com",
} as const;

/** Every app in the family, in display order. */
export const FAMILY_APPS = [
  { name: "MemryLab", blurb: "Local AI Memory", url: "https://www.memrylab.com" },
  { name: "XpenseLab", blurb: "Expense tracking", url: "https://xpenselab.com" },
  { name: "HyredLab", blurb: "Job tracking", url: "https://www.hyredlab.com" },
  { name: "edytlab", blurb: "AI audio editor", url: "https://www.edytlab.com" },
] as const;

/** This site's own entry in FAMILY_APPS. */
export const CURRENT_APP = "HyredLab";

/** The family footer lists the other apps, never this one. */
export const SIBLING_APPS = FAMILY_APPS.filter((app) => app.name !== CURRENT_APP);
