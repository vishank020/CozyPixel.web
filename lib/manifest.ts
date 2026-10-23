import "server-only";
import manifestData from "@/data/manifest.json";
import type { Wallpaper, Manifest } from "./types";

// Server only: importing this from a client component would ship the whole manifest.
// Client code gets wallpapers via props and URL helpers from ./image-urls.

export const manifest = manifestData as Manifest;

export function getAllWallpapers(): Wallpaper[] {
  return manifest.wallpapers;
}

export function getWallpapersByTheme(theme: string): Wallpaper[] {
  return manifest.wallpapers.filter((w) => w.theme === theme);
}

export function getWallpapersBySubcategory(
  theme: string,
  subcategory: string
): Wallpaper[] {
  return manifest.wallpapers.filter(
    (w) => w.theme === theme && w.subcategory === subcategory
  );
}
