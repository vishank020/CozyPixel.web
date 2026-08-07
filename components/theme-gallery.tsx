"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import type { Wallpaper } from "@/lib/types";
import { WallpaperGrid } from "./wallpaper-grid";

interface ThemeGalleryProps {
  wallpapers: Wallpaper[];
  subcategories: string[];
}

export function ThemeGallery({ wallpapers, subcategories }: ThemeGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  const filteredWallpapers = useMemo(() => {
    return wallpapers.filter((w) => {
      const matchesSearch = w.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubcategory = activeSubcategory ? w.subcategory === activeSubcategory : true;
      return matchesSearch && matchesSubcategory;
    });
  }, [wallpapers, searchQuery, activeSubcategory]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col gap-4 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search wallpapers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Subcategory Chips */}
        <div className="w-full overflow-x-auto pb-3 custom-scrollbar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubcategory(null)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeSubcategory === null
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubcategory(sub)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeSubcategory === sub
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <WallpaperGrid wallpapers={filteredWallpapers} />
    </div>
  );
}
