"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Wallpaper } from "@/lib/types";
import { WallpaperCard } from "./wallpaper-card";
import { Lightbox } from "./lightbox";
import { closeWallpaper, openWallpaper, updateUrlParams, useUrlParams } from "@/lib/url-state";

// Cards rendered per batch (PLAN A-03): keeps the HTML and hydration small on long themes
const PAGE_SIZE = 24;
// Start rendering the next batch well before the user reaches the end
const PRELOAD_MARGIN = "800px";

interface WallpaperGridProps {
  wallpapers: Wallpaper[];
  /** Shown as an action in the empty state when filters hide everything */
  onClearFilters?: () => void;
}

export function WallpaperGrid({
  wallpapers,
  onClearFilters,
}: WallpaperGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // The open wallpaper lives in the URL (?w=<id>) so it can be shared and Back closes it
  const openId = useUrlParams().get("w");
  const foundIndex = openId ? wallpapers.findIndex((w) => w.id === openId) : -1;
  const lightboxIndex = foundIndex === -1 ? null : foundIndex;
  const sentinelRef = useRef<HTMLDivElement>(null);

  // A new filter result starts again from the first batch
  const [shownList, setShownList] = useState(wallpapers);
  if (shownList !== wallpapers) {
    setShownList(wallpapers);
    setVisibleCount(PAGE_SIZE);
  }

  // A linked wallpaper deep in the list: render up to its batch so its card exists
  if (lightboxIndex !== null && lightboxIndex >= visibleCount) {
    setVisibleCount(Math.ceil((lightboxIndex + 1) / PAGE_SIZE) * PAGE_SIZE);
  }

  const hasMore = visibleCount < wallpapers.length;

  const showMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, wallpapers.length));
  }, [wallpapers.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) showMore();
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, showMore, visibleCount]);

  const openLightbox = useCallback((wallpaper: Wallpaper) => openWallpaper(wallpaper.id), []);
  const closeLightbox = useCallback(() => closeWallpaper(), []);

  // Browsing inside the lightbox replaces the entry, so Back still closes it in one step
  const navigateLightbox = useCallback(
    (index: number) => updateUrlParams({ w: wallpapers[index].id }, "replace"),
    [wallpapers]
  );

  // Empty state
  if (wallpapers.length === 0) {
    return (
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-3 overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-14 text-center shadow-sm">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <p className="relative text-lg font-semibold text-foreground">No wallpapers match</p>
        <p className="relative text-sm text-muted-foreground">
          Try another word or category.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="relative mt-2 inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {wallpapers.slice(0, visibleCount).map((wallpaper, index) => (
          <WallpaperCard
            key={wallpaper.id}
            wallpaper={wallpaper}
            onOpen={openLightbox}
            isFirst={index === 0}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex flex-col items-center gap-2 pt-10 pb-4">
          {/* Fallback for when the observer doesn't fire (and for keyboard users) */}
          <button
            onClick={showMore}
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary"
          >
            Load more
          </button>
          <p className="text-xs text-muted-foreground">
            Showing {visibleCount} of {wallpapers.length}
          </p>
        </div>
      )}

      {/* The lightbox browses the whole filtered list, not just the rendered batch */}
      {lightboxIndex !== null && (
        <Lightbox
          wallpapers={wallpapers}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </>
  );
}
