// Absolute URL of the deployed site including any base path, e.g.
// "https://vishank020.github.io/CozyPixel.web" (set in next.config.ts)
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vishank020.github.io/CozyPixel.web";

export const SITE_NAME = "CozyPixels";

/** Absolute URL for a path on this site: absoluteUrl("/nord") */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "/" : path}`;
}
