# CozyPixels Web — Route and component catalogue

Companion to [`../PLAN.md`](../PLAN.md) §7. This stands in for the template's API catalogue: the site
has no API, so the surface that stories change is routes and components. `A-xx` = assumptions in
`PLAN.md` §3. Add "**Done (W#-##)**" to the Status column as stories land.

## Routes

| Route | File | Screen | Renders | Status |
|---|---|---|---|---|
| `/` | `app/page.tsx` | SCR-01 | Hero + collage, theme cards, featured strip, "Free forever" panel | baseline |
| `/catppuccin` · `/nord` · `/onedark` | `app/[theme]/page.tsx` (`generateStaticParams`) | SCR-02 | Title (→ `ThemeHero`, W4-03) + `ThemeGallery` | baseline |
| 404 | `app/not-found.tsx` (new, W4-06) | SCR-06 | Styled not-found panel | not built |
| `/about` | `app/about/page.tsx` (new, W5-02) | SCR-07 | Credits, disclaimer, takedown, no-tracking | not built |
| `/sitemap.xml` · `/robots.txt` | `app/sitemap.ts` · `app/robots.ts` (new, W5-01) | — | Static SEO files | not built |
| `/manifest.webmanifest` | `app/manifest.ts` (new, W5-06) | — | PWA install metadata | not built |
| OG images | `app/opengraph-image.png`, `app/[theme]/opengraph-image.png` (new, W5-01) | — | 1200×630 social previews | not built |

Query params on theme pages (W5-03, A-20): `sub` (subcategory slug), `q` (search), `w` (open wallpaper id).

Root layout `app/layout.tsx`: `<html>` (head theme script, W2-01) → `ThemeProvider` → `Header`, `SmoothScroll` → page, `Footer`.

## Components

| Component | Client? | Owns | Changed by | Status |
|---|---|---|---|---|
| `header.tsx` | server | Logo, glass sticky bar, About link | W1-05, W3-04, W5-02 | baseline |
| `ThemeSwitcher.tsx` | client | Theme segmented control (desktop), palette menu (mobile), mode toggle | W3-05 | baseline |
| `theme-provider.tsx` | client | Theme/mode store over `<html>` attributes + localStorage | W2-01, W2-05 | **Done (W2-01, W2-05)** |
| `lib/theme-dom.ts` | — | Applies the saved theme; serialised as the `<head>` script | W2-01 | **Done (W2-01)** |
| `SmoothScroll.tsx` | client | Lenis, lazy-loaded on fine pointers only; `setSmoothScrollPaused()` | W2-04 | **Done (W2-04)** |
| `featured-strip.tsx` | client | Home featured grid + lightbox | W1-01, W1-02, W4-04 | baseline |
| `theme-gallery.tsx` | client | Search, subcategory chips, filtered list | W2-02, W3-02 | baseline |
| `wallpaper-grid.tsx` | client | Grid layout, paging (24 per batch), empty state, lightbox host | W1-03, W2-02, W3-01, W4-06 | **Done (W1-03, W2-02)** |
| `wallpaper-card.tsx` | client | Thumbnail, hover lift, name, download button | W1-01–03, W2-03, W3-01, W4-04 | **Done (W1-01–03, W2-03, W3-01)** |
| `lightbox.tsx` | client | Full-screen viewer, navigation, download | W1-01, W1-04, W2-04, W3-03, W4-04 | baseline |
| `footer.tsx` | server | Disclaimer, credits, "updated" date | W5-06 | baseline |
| `theme-hero.tsx` | server | Per-theme page header (new) | W4-03 | not built |
| `toast.tsx` | client | Status toasts with `role="status"` (new) | W5-04 | not built |
| `animations.tsx` | client | framer-motion wrappers | **deleted** in W2-03 | **Done (W2-03)** |
| `Features.tsx`, `Hero.tsx` | client | Unused template leftovers | **deleted** in P0-04 | **Done (P0-04)** |

## Lib modules

| Module | Purpose | Import rule | Changed by |
|---|---|---|---|
| `lib/manifest.ts` | Read manifest, filter by theme/subcategory | **Server only** (`import "server-only"`) | **Done (W1-01)** |
| `lib/image-urls.ts` | `getImageUrl`, `getRawUrl`, `getJsDelivrUrl`, `getGithubBlobUrl`; >20 MB rule (W1-06) | Anywhere | **Done (W1-01, W1-06)** |
| `lib/image-loader.ts` | `next/image` custom loader → wsrv.nl | Referenced by `next.config.ts` only | **Done (W1-02)** |
| `components/wallpaper-image.tsx` | `next/image` wrapper: falls back to the original if the proxy fails | Use for every remote wallpaper image | **Done (W1-02)** |
| `lib/format.ts` | `displayName()` (strips `ign_`/`od_`, splits words, UUID → "Untitled wallpaper"), `wallpaperAlt()` | Anywhere | **Done (W3-01)** |
| `lib/themes.ts` | Theme metadata, storage keys | Anywhere | W4-03 |
| `lib/download.ts` | Blob download with progress callback + new-tab fallback | Lazy-imported on click | W5-04 |
