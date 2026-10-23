import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages serves under /CozyPixel.web; Vercel and local previews serve at the root
  basePath: process.env.VERCEL || process.env.LOCAL_PREVIEW ? "" : "/CozyPixel.web",
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
