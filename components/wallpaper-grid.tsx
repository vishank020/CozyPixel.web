"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Wallpaper } from "@/lib/types";
import { WallpaperCard } from "./wallpaper-card";
import { Lightbox } from "./lightbox";

// Cards rendered per batch (PLAN A-03): keeps the HTML and hydration small on long themes
const PAGE_SIZE = 24;
// Start rendering the next batch well before the user reaches the end
const PRELOAD_MARGIN = "800px";

interface WallpaperGridProps {
  wallpapers: Wallpaper[];
}

export function WallpaperGrid({
  wallpapers,
}: WallpaperGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // A new filter result starts again from the first batch
  const [shownList, setShownList] = useState(wallpapers);
  if (shownList !== wallpapers) {
    setShownList(wallpapers);
    setVisibleCount(PAGE_SIZE);
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

  const openLightbox = useCallback((wallpaper: Wallpaper) => {
    const index = wallpapers.findIndex((w) => w.id === wallpaper.id);
    if (index !== -1) setLightboxIndex(index);
  }, [wallpapers]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const navigateLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  // Empty state
  if (wallpapers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-foreground">No wallpapers found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different theme or subcategory
        </p>
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
