import type { MetadataRoute } from "next";

// Required for output: "export": render once at build time
export const dynamic = "force-static";

// URLs are relative to the manifest's own location, so they work with or without the
// GitHub Pages basePath (/CozyPixel.web/manifest.webmanifest → /CozyPixel.web/icons/…)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CozyPixels – Aesthetic Wallpaper Gallery",
    short_name: "CozyPixels",
    description: "Free cozy wallpapers in Catppuccin, Nord and One Dark themes.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    // Catppuccin Mocha base, the site's default palette
    background_color: "#1e1e2e",
    theme_color: "#1e1e2e",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
