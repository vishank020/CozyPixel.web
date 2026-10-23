import { Sparkles } from "lucide-react";
import type { ThemeMeta } from "@/lib/themes";

interface ThemeHeroProps {
  theme: ThemeMeta;
  wallpaperCount: number;
  categoryCount: number;
}

/** Header for a theme's gallery page, in the site's panel + glow style */
export function ThemeHero({ theme, wallpaperCount, categoryCount }: ThemeHeroProps) {
  const [accent, second] = theme.swatches;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-5 py-6 shadow-sm sm:px-10 sm:py-12">
      {/* Soft glows in the page's own palette, independent of the active site theme */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl sm:h-80 sm:w-80"
        style={{ backgroundColor: accent.hex }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 right-1/3 h-48 w-48 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: second.hex }}
      />

      <div className="relative space-y-3 sm:space-y-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Wallpaper collection
        </p>

        <h1 className="text-section sm:text-hero font-extrabold tracking-tight leading-[1.1] text-foreground">
          {theme.name}
        </h1>
        <p className="max-w-xl text-base sm:text-lg text-muted-foreground">{theme.description}</p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="sr-only">Wallpapers</dt>
              <dd>
                <span className="font-semibold text-foreground tabular-nums">{wallpaperCount}</span>{" "}
                <span className="text-muted-foreground">wallpapers</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Categories</dt>
              <dd>
                <span className="font-semibold text-foreground tabular-nums">{categoryCount}</span>{" "}
                <span className="text-muted-foreground">categories</span>
              </dd>
            </div>
          </dl>

          <ul className="flex items-center -space-x-1.5" aria-label={`${theme.name} palette`}>
            {theme.swatches.map((swatch) => (
              <li
                key={swatch.hex}
                title={`${swatch.name} ${swatch.hex}`}
                className="h-7 w-7 rounded-full border-2 border-card shadow-sm"
                style={{ backgroundColor: swatch.hex }}
              >
                <span className="sr-only">{swatch.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
