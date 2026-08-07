"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import type { Wallpaper } from "@/lib/types";
import { getImageUrl } from "@/lib/manifest";
import { Lightbox } from "./lightbox";

export function FeaturedStrip({ wallpapers }: { wallpapers: Wallpaper[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const navigateLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {wallpapers.map((wallpaper, idx) => (
          <button
            key={wallpaper.id}
            onClick={() => openLightbox(idx)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Image
              src={getImageUrl(wallpaper)}
              alt={wallpaper.filename}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm shadow-sm scale-95 group-hover:scale-100 transition-transform duration-300">
                <Expand className="h-3.5 w-3.5" />
                View
              </span>
            </div>
          </button>
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
