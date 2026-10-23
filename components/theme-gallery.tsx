"use client";

import { useState, useMemo, useRef } from "react";
import { Search, X } from "lucide-react";
import type { Wallpaper } from "@/lib/types";
import { displayName } from "@/lib/format";
import { WallpaperGrid } from "./wallpaper-grid";
import { scrollToElement } from "./SmoothScroll";

export interface SubcategoryCount {
  name: string;
  count: number;
}

interface ThemeGalleryProps {
  wallpapers: Wallpaper[];
  subcategories: SubcategoryCount[];
}

// Everything a visitor might type: the shown name, the raw filename and the category
function searchText(w: Wallpaper) {
  return `${displayName(w.filename)} ${w.filename} ${w.subcategory}`.toLowerCase();
}

export function ThemeGallery({ wallpapers, subcategories }: ThemeGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  const searchIndex = useMemo(() => wallpapers.map(searchText), [wallpapers]);

  const filteredWallpapers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return wallpapers.filter((w, i) => {
      const matchesSearch = !query || searchIndex[i].includes(query);
      const matchesSubcategory = activeSubcategory ? w.subcategory === activeSubcategory : true;
      return matchesSearch && matchesSubcategory;
    });
  }, [wallpapers, searchIndex, searchQuery, activeSubcategory]);

  // When the bar is stuck (user scrolled into the grid), jump back to the first result
  function showResultsFromTop() {
    const top = resultsTopRef.current;
    if (top && top.getBoundingClientRect().top < 0) scrollToElement(top);
  }

  function selectSubcategory(sub: string | null) {
    setActiveSubcategory(sub);
    showResultsFromTop();
  }

  const chipClass = (active: boolean) =>
    // ::after widens the tap area to 44px tall without changing the chip's look
    `relative snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    }`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div ref={resultsTopRef} className="scroll-mt-[calc(4rem+env(safe-area-inset-top))]" />

      {/* Filter bar: stays under the header while browsing */}
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 flex flex-col gap-3 sm:gap-4 rounded-2xl border border-border/50 bg-card/85 p-3 sm:p-4 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/70">

        {/* Search */}
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Search wallpapers..."
            aria-label="Search wallpapers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-11 pl-9 pr-11 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground after:absolute after:-inset-1.5 after:content-['']"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Subcategory chips: swipeable row, faded edge hints there are more */}
        <div
          role="group"
          aria-label="Filter by category"
          className="-mx-3 sm:mx-0 overflow-x-auto overscroll-x-contain snap-x scroll-px-3 px-3 sm:px-0 py-1.5 custom-scrollbar [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:[mask-image:none]"
        >
          <div className="flex w-max items-center gap-2 pr-6 sm:pr-0">
            <button
              onClick={() => selectSubcategory(null)}
              aria-pressed={activeSubcategory === null}
              className={chipClass(activeSubcategory === null)}
            >
              All <span className="opacity-80 tabular-nums">· {wallpapers.length}</span>
            </button>
            {subcategories.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => selectSubcategory(name)}
                aria-pressed={activeSubcategory === name}
                className={chipClass(activeSubcategory === name)}
              >
                {name} <span className="opacity-80 tabular-nums">· {count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="px-1 text-sm text-muted-foreground tabular-nums">
        {filteredWallpapers.length} {filteredWallpapers.length === 1 ? "wallpaper" : "wallpapers"}
      </p>

      {/* Grid */}
      <WallpaperGrid
        wallpapers={filteredWallpapers}
        onClearFilters={() => {
          setSearchQuery("");
          setActiveSubcategory(null);
        }}
      />
    </div>
  );
}
