"use client";

import { WallpaperImage } from "./wallpaper-image";
import { Download, Expand } from "lucide-react";
import { motion } from "framer-motion";
import type { Wallpaper } from "@/lib/types";
import { getImageUrl, getRawUrl } from "@/lib/image-urls";

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

  return (
    <motion.div 
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
      className="group relative overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40"
    >
      {/* Image */}
      <button
        onClick={() => onOpen(wallpaper)}
        className="block w-full aspect-[16/10] relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View ${wallpaper.filename}`}
      >
        <WallpaperImage
          src={imageUrl}
          alt={wallpaper.filename}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] will-change-transform"
          loading={isFirst ? "eager" : "lazy"}
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
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {wallpaper.filename.replace(/\.[^.]+$/, "")}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {wallpaper.subcategory}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            import("@/lib/download").then((m) => m.downloadImage(downloadUrl, wallpaper.filename));
          }}
          className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Download ${wallpaper.filename}`}
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
