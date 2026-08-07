import manifestData from "@/data/manifest.json";
import type { Wallpaper, Manifest } from "./types";

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

export function getRawUrl(wallpaper: Wallpaper): string {
  return `https://raw.githubusercontent.com/SleepyCatHey/CozyPixels/main/${encodeURI(
    wallpaper.path
  )}`;
}

export function getJsDelivrUrl(wallpaper: Wallpaper): string {
  return `https://cdn.jsdelivr.net/gh/SleepyCatHey/CozyPixels@main/${encodeURI(
    wallpaper.path
  )}`;
}

/** Prefer jsDelivr for better caching, fall back to raw */
export function getImageUrl(wallpaper: Wallpaper, preferCdn = true): string {
  return preferCdn ? getJsDelivrUrl(wallpaper) : getRawUrl(wallpaper);
}
