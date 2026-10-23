import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages serves under /CozyPixel.web; Vercel and local previews serve at the root
  basePath: process.env.VERCEL || process.env.LOCAL_PREVIEW ? "" : "/CozyPixel.web",
  images: {
    unoptimized: true,
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
