import { manifest, getWallpapersByTheme } from "@/lib/manifest";
import { ThemeGallery } from "@/components/theme-gallery";

export default function ThemePage({
  params,
}: {
  params: { theme: string };
}) {
  // Map URL slug → display name
  const themeMap: Record<string, string> = {
    catppuccin: "Catppuccin",
    nord: "Nord",
    onedark: "One Dark",
  };

  const themeName = themeMap[params.theme] ?? "Catppuccin";
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
