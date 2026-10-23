"use client";

import { useMemo, useSyncExternalStore } from "react";

// Gallery state lives in the URL (?sub=&q=&w=, PLAN A-20) so views can be shared and Back
// works. Read through useSyncExternalStore rather than useSearchParams: under static export
// useSearchParams would client-render the whole gallery, losing it from the static HTML.

const CHANGE_EVENT = "cozypixels:urlchange";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const getSnapshot = () => window.location.search;
// Static HTML is the unfiltered gallery; the URL's state applies right after hydration
const getServerSnapshot = () => "";

export function useUrlParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => new URLSearchParams(search), [search]);
}

/**
 * Set (string) or remove (null/empty) query params. "replace" for filters, so typing doesn't
 * flood history; "push" for opening a wallpaper, so Back closes it.
 */
export function updateUrlParams(changes: Record<string, string | null>, mode: "push" | "replace") {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Whether the open wallpaper's history entry was pushed by this page (then closing = Back).
// A wallpaper opened from a shared link has no entry of ours to go back to.
let pushedWallpaperEntry = false;

/** Open a wallpaper in the lightbox (?w=id) with its own history entry, so Back closes it */
export function openWallpaper(id: string) {
  pushedWallpaperEntry = true;
  updateUrlParams({ w: id }, "push");
}

/** Close the lightbox: go back if we pushed its entry, otherwise just drop ?w= */
export function closeWallpaper() {
  if (pushedWallpaperEntry) {
    pushedWallpaperEntry = false;
    window.history.back();
  } else {
    updateUrlParams({ w: null }, "replace");
  }
}
