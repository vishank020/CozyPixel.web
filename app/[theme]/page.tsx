import type { Metadata } from "next";
import { manifest, getWallpapersByTheme } from "@/lib/manifest";
import { themes, type ThemeId } from "@/lib/themes";
import { ThemeGallery, type SubcategoryCount } from "@/components/theme-gallery";
import { ThemeHero } from "@/components/theme-hero";
import { CreditNote } from "@/components/credit-note";
import { SITE_NAME } from "@/lib/site";

type Params = Promise<{ theme: string }>;

export function generateStaticParams() {
  return (Object.keys(themes) as ThemeId[]).map((theme) => ({ theme }));
}

function themeFor(slug: string) {
  return themes[slug as ThemeId] ?? themes.catppuccin;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const theme = themeFor((await params).theme);
  const count = manifest.themes[theme.name]?.count ?? 0;
  const title = `${theme.name} wallpapers · CozyPixels`;
  const description = `${count} free ${theme.name} wallpapers: ${theme.description.toLowerCase()}. Browse by category and download in full resolution.`;
  const image = { url: `og/${theme.id}.png`, width: 1200, height: 630, alt: `${theme.name} wallpapers on CozyPixels` };
  return {
    title,
    description,
    alternates: { canonical: theme.id },
    // openGraph replaces (doesn't merge with) the layout's, so repeat siteName
    openGraph: { type: "website", siteName: SITE_NAME, title, description, url: theme.id, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function ThemePage({ params }: { params: Params }) {
  const theme = themeFor((await params).theme);
  const wallpapers = getWallpapersByTheme(theme.name);

  const manifestTheme = manifest.themes[theme.name];
  const subcategories: SubcategoryCount[] = Object.entries(manifestTheme?.subcategories ?? {}).map(
    ([name, count]) => ({ name, count })
  );

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <ThemeHero theme={theme} wallpaperCount={wallpapers.length} categoryCount={subcategories.length} />
      <CreditNote />
      <ThemeGallery wallpapers={wallpapers} subcategories={subcategories} />
    </main>
  );
}
