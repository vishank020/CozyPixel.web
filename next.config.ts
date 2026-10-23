import type { NextConfig } from "next";

// GitHub Pages serves under /CozyPixel.web; Vercel and local previews serve at the root
const basePath = process.env.VERCEL || process.env.LOCAL_PREVIEW ? "" : "/CozyPixel.web";

// Public origin of the deployed site, for absolute links in metadata, sitemap and robots
// (PLAN A-17). Override with SITE_ORIGIN, e.g. for a custom domain.
const siteOrigin =
  process.env.SITE_ORIGIN ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://vishank020.github.io");

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: {
    NEXT_PUBLIC_SITE_URL: `${siteOrigin.replace(/\/$/, "")}${basePath}`,
  },
  images: {
    // Static export can't use the built-in optimizer; resize through a custom loader instead
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    // Largest is 2560: lightbox on large screens; originals are only for download
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
    ],
  },
};

export default nextConfig;
