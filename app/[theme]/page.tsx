import { manifest, getWallpapersByTheme } from "@/lib/manifest";
import { ThemeGallery } from "@/components/theme-gallery";

export function generateStaticParams() {
  return [
    { theme: "catppuccin" },
    { theme: "nord" },
    { theme: "onedark" },
  ];
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const resolvedParams = await params;
  
  // Map URL slug → display name
  const themeMap: Record<string, string> = {
    catppuccin: "Catppuccin",
    nord: "Nord",
    onedark: "One Dark",
  };

  const themeName = themeMap[resolvedParams.theme] ?? "Catppuccin";
  const wallpapers = getWallpapersByTheme(themeName);
  
  const manifestTheme = manifest.themes[themeName];
  const subcategories = manifestTheme ? Object.keys(manifestTheme.subcategories) : [];

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">{themeName}</h1>
      <ThemeGallery wallpapers={wallpapers} subcategories={subcategories} />
    </main>
  );
}
