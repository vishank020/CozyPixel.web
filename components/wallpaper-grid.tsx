"use client";

import { useState, useCallback, useMemo } from "react";
import type { Wallpaper } from "@/lib/types";
import { WallpaperCard } from "./wallpaper-card";
import { Lightbox } from "./lightbox";

interface WallpaperGridProps {
  wallpapers: Wallpaper[];
  /** Number of images to prioritize (above the fold) */
  priorityCount?: number;
}

export function WallpaperGrid({
  wallpapers,
  priorityCount = 6,
}: WallpaperGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {wallpapers.map((wallpaper, index) => (
          <WallpaperCard
            key={wallpaper.id}
            wallpaper={wallpaper}
            onOpen={openLightbox}
            priority={index < priorityCount}
          />
        ))}
      </div>

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
