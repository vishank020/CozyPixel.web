"use client";

import type { ImageLoaderProps } from "next/image";

// Custom next/image loader (PLAN A-01): remote wallpapers are resized to WebP by the free
// wsrv.nl proxy. Swapping provider means editing only this file.
// Local assets (static imports such as the logo) are served as-is.

const DEFAULT_QUALITY = 70;

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!/^https?:\/\//.test(src)) {
    return `${src}?w=${width}`;
  }

  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality ?? DEFAULT_QUALITY),
    output: "webp",
    // Never upscale small originals
    we: "",
  });
  return `https://wsrv.nl/?${params.toString()}`;
}
