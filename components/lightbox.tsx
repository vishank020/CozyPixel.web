"use client";

import { useCallback, useEffect, useState } from "react";
import { preload } from "react-dom";
import { getImageProps } from "next/image";
import { WallpaperImage } from "./wallpaper-image";
import { setSmoothScrollPaused } from "./SmoothScroll";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { Wallpaper } from "@/lib/types";
import { getImageUrl, getRawUrl, getGithubBlobUrl } from "@/lib/image-urls";
import { displayName, wallpaperAlt } from "@/lib/format";

// Shared by the visible image and neighbour preloads so both resolve to the same URL
const VIEW_SIZE = { width: 1920, height: 1080, sizes: "100vw" } as const;

// The resizer outputs static WebP, so GIFs are shown as originals to keep their animation
function isAnimated(wallpaper: Wallpaper) {
  return wallpaper.extension === "gif";
}

function preloadWallpaper(wallpaper: Wallpaper | undefined) {
  if (!wallpaper || isAnimated(wallpaper)) return;
  const { props } = getImageProps({ src: getImageUrl(wallpaper), alt: "", ...VIEW_SIZE });
  preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes });
}

interface LightboxProps {
  wallpapers: Wallpaper[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({
  wallpapers,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const wallpaper = wallpapers[currentIndex];
  const imageUrl = getImageUrl(wallpaper);
  const downloadUrl = getRawUrl(wallpaper);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < wallpapers.length - 1;

  const [loadedId, setLoadedId] = useState<string | null>(null);
  const isLoading = loadedId !== wallpaper.id;

  // Warm the cache for the neighbours so prev/next feel instant
  useEffect(() => {
    preloadWallpaper(wallpapers[currentIndex - 1]);
    preloadWallpaper(wallpapers[currentIndex + 1]);
  }, [wallpapers, currentIndex]);

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1);
  }, [hasPrev, currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1);
  }, [hasNext, currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goPrev, goNext]);

  // Prevent page scroll underneath, including desktop smooth scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    setSmoothScrollPaused(true);
    return () => {
      document.body.style.overflow = "";
      setSmoothScrollPaused(false);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Wallpaper preview"
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Navigation arrows */}
      {hasPrev && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Previous wallpaper"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Next wallpaper"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-[95vw] max-h-[90vh] gap-4">
        {/* Image */}
        <div className="relative max-w-full max-h-[75vh] overflow-hidden rounded-lg shadow-2xl">
          <WallpaperImage
            key={wallpaper.id}
            src={imageUrl}
            alt={wallpaperAlt(wallpaper)}
            {...VIEW_SIZE}
            className={`max-h-[75vh] w-auto h-auto object-contain transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            loading="eager"
            fetchPriority="high"
            unoptimized={isAnimated(wallpaper)}
            onLoad={() => setLoadedId(wallpaper.id)}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5" role="status">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" aria-hidden />
              <span className="sr-only">Loading wallpaper</span>
            </div>
          )}
        </div>

        {/* Info + actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-white">
          <div className="text-center sm:text-left">
            <p className="font-medium">{displayName(wallpaper.filename)}</p>
            <p className="text-sm text-white/70">
              {wallpaper.theme} · {wallpaper.subcategory}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                import("@/lib/download").then((m) => m.downloadImage(downloadUrl, wallpaper.filename));
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <a
              href={getGithubBlobUrl(wallpaper)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>

        {/* Counter */}
        <p className="text-sm text-white/50">
          {currentIndex + 1} / {wallpapers.length}
        </p>
      </div>
    </div>
  );
}
