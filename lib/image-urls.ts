import type { Wallpaper } from "./types";

// Pure URL helpers, safe to import from client components (no manifest import here)

const SOURCE_REPO = "SleepyCatHey/CozyPixels";

type WallpaperRef = Pick<Wallpaper, "path">;

export function getRawUrl(wallpaper: WallpaperRef): string {
  return `https://raw.githubusercontent.com/${SOURCE_REPO}/main/${encodeURI(wallpaper.path)}`;
}

export function getJsDelivrUrl(wallpaper: WallpaperRef): string {
  return `https://cdn.jsdelivr.net/gh/${SOURCE_REPO}@main/${encodeURI(wallpaper.path)}`;
}

export function getGithubBlobUrl(wallpaper: WallpaperRef): string {
  return `https://github.com/${SOURCE_REPO}/blob/main/${encodeURI(wallpaper.path)}`;
}

/** Prefer jsDelivr for better caching, fall back to raw */
export function getImageUrl(wallpaper: WallpaperRef, preferCdn = true): string {
  return preferCdn ? getJsDelivrUrl(wallpaper) : getRawUrl(wallpaper);
}
