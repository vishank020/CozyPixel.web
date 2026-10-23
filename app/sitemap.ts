import type { MetadataRoute } from "next";

// Required for output: "export": render once at build time
export const dynamic = "force-static";
import { manifest } from "@/lib/manifest";
import { themes, type ThemeId } from "@/lib/themes";
import { absoluteUrl } from "@/lib/site";

// Static at build time; lastModified follows the wallpaper data, not the build clock
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(manifest.generatedAt);
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    ...(Object.keys(themes) as ThemeId[]).map((id) => ({
      url: absoluteUrl(`/${id}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
