import type { Wallpaper } from "./types";

// Pure URL helpers, safe to import from client components (no manifest import here)

const SOURCE_REPO = "SleepyCatHey/CozyPixels";

// jsDelivr refuses GitHub files over 20 MB (403), so those must come from raw GitHub (PLAN A-13)
const JSDELIVR_MAX_BYTES = 20 * 1024 * 1024;

type WallpaperRef = Pick<Wallpaper, "path" | "size">;

export function getRawUrl(wallpaper: WallpaperRef): string {
  return `https://raw.githubusercontent.com/${SOURCE_REPO}/main/${encodeURI(wallpaper.path)}`;
}

export function getJsDelivrUrl(wallpaper: WallpaperRef): string {
  return `https://cdn.jsdelivr.net/gh/${SOURCE_REPO}@main/${encodeURI(wallpaper.path)}`;
}

export function getGithubBlobUrl(wallpaper: WallpaperRef): string {
  return `https://github.com/${SOURCE_REPO}/blob/main/${encodeURI(wallpaper.path)}`;
}

/** Prefer jsDelivr for better caching; raw GitHub for files jsDelivr won't serve */
export function getImageUrl(wallpaper: WallpaperRef, preferCdn = true): string {
  const tooBigForCdn = (wallpaper.size ?? 0) > JSDELIVR_MAX_BYTES;
  return preferCdn && !tooBigForCdn ? getJsDelivrUrl(wallpaper) : getRawUrl(wallpaper);
}
