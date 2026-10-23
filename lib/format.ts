import type { Wallpaper } from "./types";

// Source-collection tags, not part of the name ("ign_FluidifiedST-2.png", "od_gnome.png")
const SOURCE_PREFIX = /^(ign|od)_/i;

// Uploads named by UUID ("551098957-3e9e1c05-0c5b-48c3-….png") have no readable name
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Human-readable wallpaper name: "ign_MaterialMountains-2.png" → "Material Mountains 2" */
export function displayName(filename: string): string {
  if (UUID.test(filename)) return "Untitled wallpaper";

  return filename
    .replace(/\.[^.]+$/, "")
    .replace(SOURCE_PREFIX, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** Descriptive alt text for screen readers and image search */
export function wallpaperAlt(wallpaper: Pick<Wallpaper, "filename" | "theme" | "subcategory">): string {
  return `${displayName(wallpaper.filename)}, ${wallpaper.theme} ${wallpaper.subcategory} wallpaper`;
}
