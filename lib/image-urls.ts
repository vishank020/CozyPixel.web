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

const JSDELIVR_PREFIX = `https://cdn.jsdelivr.net/gh/${SOURCE_REPO}@main/`;
const RAW_PREFIX = `https://raw.githubusercontent.com/${SOURCE_REPO}/main/`;

/**
 * Source URL for the resizing proxy. jsDelivr refuses many requests from wsrv.nl
 * (403, seen 2026-10-23) while serving browsers fine, so the proxy reads raw GitHub
 * and jsDelivr stays the browser-side fallback.
 */
export function toProxySource(url: string): string {
  return url.startsWith(JSDELIVR_PREFIX) ? RAW_PREFIX + url.slice(JSDELIVR_PREFIX.length) : url;
}

/** Prefer jsDelivr for better caching; raw GitHub for files jsDelivr won't serve */
export function getImageUrl(wallpaper: WallpaperRef, preferCdn = true): string {
  const tooBigForCdn = (wallpaper.size ?? 0) > JSDELIVR_MAX_BYTES;
  return preferCdn && !tooBigForCdn ? getJsDelivrUrl(wallpaper) : getRawUrl(wallpaper);
}
