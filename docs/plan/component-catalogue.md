# CozyPixels Web — Route and component catalogue

Companion to [`../PLAN.md`](../PLAN.md) §7. This stands in for the template's API catalogue: the site
has no API, so the surface that stories change is routes and components. `A-xx` = assumptions in
`PLAN.md` §3. Add "**Done (W#-##)**" to the Status column as stories land.

## Routes

| Route | File | Screen | Renders | Status |
|---|---|---|---|---|
| `/` | `app/page.tsx` | SCR-01 | Hero + collage, theme cards, featured strip, "Free forever" panel | baseline |
| `/catppuccin` · `/nord` · `/onedark` | `app/[theme]/page.tsx` (`generateStaticParams`, `generateMetadata`) | SCR-02 | `ThemeHero` + `ThemeGallery` | **Done (W4-03)** |
| 404 | `app/not-found.tsx` → `out/404.html` | SCR-06 | Styled panel with links to each collection and home | **Done (W4-06)** |
| `/about` | `app/about/page.tsx` | SCR-07 | Credits, verbatim disclaimer, takedown link, privacy, license | **Done (W5-02)** |
| `/sitemap.xml` · `/robots.txt` | `app/sitemap.ts` · `app/robots.ts` (`force-static`) | — | Static SEO files | **Done (W5-01)** |
| `/manifest.webmanifest` | `app/manifest.ts` (new, W5-06) | — | PWA install metadata | not built |
| OG images | `public/og/{home,catppuccin,nord,onedark}.png` from `scripts/make-og.ts` | — | 1200×630 social previews, referenced from metadata | **Done (W5-01)** |

Query params on theme pages (W5-03, A-20): `sub` (subcategory slug), `q` (search), `w` (open wallpaper id).

Root layout `app/layout.tsx`: `<html>` (head theme script, W2-01) → `ThemeProvider` → `Header`, `SmoothScroll` → page, `Footer`.

## Components

| Component | Client? | Owns | Changed by | Status |
|---|---|---|---|---|
| `header.tsx` | server | Logo, glass sticky bar, About link (icon on phones) | W1-05, W3-04, W5-02 | **Done (W1-05, W3-04, W5-02)** |
| `ThemeSwitcher.tsx` | client | Theme segmented control (desktop), palette menu (mobile), mode toggle; aria-pressed/expanded, Escape + outside tap, 44px targets | W3-05 | **Done (W3-05)** |
| `theme-provider.tsx` | client | Theme/mode store over `<html>` attributes + localStorage | W2-01, W2-05 | **Done (W2-01, W2-05)** |
| `lib/theme-dom.ts` | — | Applies the saved theme; serialised as the `<head>` script | W2-01 | **Done (W2-01)** |
| `SmoothScroll.tsx` | client | Lenis, lazy-loaded on fine pointers only; `setSmoothScrollPaused()`, `scrollToElement()` | W2-04, W3-02 | **Done (W2-04, W3-02)** |
| `featured-strip.tsx` | client | Home featured grid + lightbox | W1-01, W1-02, W4-04 | baseline |
| `theme-gallery.tsx` | client | Sticky glass filter bar: search (name + filename + category), chips with counts, live result count | W2-02, W3-02 | **Done (W3-02)** |
| `wallpaper-grid.tsx` | client | Grid layout, paging (24 per batch), empty state, lightbox host | W1-03, W2-02, W3-01, W4-06 | **Done (W1-03, W2-02, W3-01, W4-06)** |
| `wallpaper-card.tsx` | client | Thumbnail, hover lift, name, download button | W1-01–03, W2-03, W3-01, W4-04 | **Done (W1-01–03, W2-03, W3-01)** |
| `lightbox.tsx` | client | Full-screen viewer: swipe, top bar (counter, close), bottom action bar, hover-only arrows, focus trap/restore, palette-tinted backdrop | W1-01, W1-04, W2-04, W3-03, W4-04 | **Done (W1-04, W2-04, W3-03)** |
| `footer.tsx` | server | Disclaimer, credits, "updated" date | W5-06 | baseline |
| `theme-hero.tsx` | server | Per-theme page header: eyebrow, name, description, counts, palette swatches + glow in the page's own palette | W4-03 | **Done (W4-03)** |
| `toast.tsx` | client | App-wide `showToast()` + `<Toaster>` (`role="status"`); countdown only while the page is visible | W5-04 | **Done (W5-04)** |
| `download-button.tsx` + `use-download.ts` | client | Original-file download with progress, busy/saved states, new-tab fallback + toast | W5-04 | **Done (W5-04)** |
| `credit-note.tsx` | client | Slim dismissible credit + takedown pointer on theme pages; hidden pre-paint once dismissed (`lib/credit-note.ts`) | W5-02 | **Done (W5-02)** |
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
| `lib/themes.ts` | Theme metadata, official palette swatches, storage keys | Anywhere | **Done (W4-03)** |
| `lib/download.ts` | Blob download with progress callback + new-tab fallback | Lazy-imported on click | **Done (W5-04)** |
