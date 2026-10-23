"use client";

import { WallpaperImage } from "./wallpaper-image";
import { Download, Expand } from "lucide-react";
import type { Wallpaper } from "@/lib/types";
import { getImageUrl, getRawUrl } from "@/lib/image-urls";
import { displayName, wallpaperAlt } from "@/lib/format";

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  onOpen: (wallpaper: Wallpaper) => void;
  /** The likely LCP image: load eagerly with high fetch priority */
  isFirst?: boolean;
}

export function WallpaperCard({
  wallpaper,
  onOpen,
  isFirst = false,
}: WallpaperCardProps) {
  const imageUrl = getImageUrl(wallpaper);
  const downloadUrl = getRawUrl(wallpaper);
  const name = displayName(wallpaper.filename);

  return (
    <div className="card-lift group relative overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40">
      {/* Image */}
      <button
        onClick={() => onOpen(wallpaper)}
        className="img-shimmer block w-full aspect-[16/10] relative overflow-hidden focus-visible:-outline-offset-4"
        aria-label={`View ${name}`}
      >
        <WallpaperImage
          src={imageUrl}
          alt={wallpaperAlt(wallpaper)}
          fill
          sizes="(max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] will-change-transform"
          loading={isFirst ? "eager" : "lazy"}
          fade={!isFirst}
          fetchPriority={isFirst ? "high" : "auto"}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
            <Expand className="h-3.5 w-3.5" />
            Preview
          </span>
        </div>
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs sm:text-sm font-medium text-foreground" title={name}>
            {name}
          </p>
          {/* Phones show two columns, so the category only appears from sm up */}
          <p className="hidden sm:block truncate text-xs text-muted-foreground">
            {wallpaper.subcategory}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            import("@/lib/download").then((m) => m.downloadImage(downloadUrl, wallpaper.filename));
          }}
          className="press-pop relative shrink-0 inline-flex h-8 w-8 items-center after:absolute after:-inset-1.5 after:content-[''] justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
          aria-label={`Download ${name}`}
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
