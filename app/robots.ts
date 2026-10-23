import type { MetadataRoute } from "next";

// Required for output: "export": render once at build time
export const dynamic = "force-static";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
