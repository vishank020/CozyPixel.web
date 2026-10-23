# CozyPixels Web — Data and image URL usage

Companion to [`../PLAN.md`](../PLAN.md) §8. This stands in for the template's schema usage. The only
data is `data/manifest.json` (built by `scripts/generate-manifest.ts`) and the image URLs derived
from it.

## 1. Screen → data map

| Screen / feature | Reads | Sent to client | Image URL used | Notes |
|---|---|---|---|---|
| SCR-01 hero collage | `getWallpapersByTheme(x)[1|3|2]` | — (server-rendered `<Image>`) | loader(jsDelivr) ~600 w | Front card only gets `fetchPriority="high"` (W1-03) |
| SCR-01 theme cards | `manifest.themes[x].count`, first 3 per theme | — | loader ~320 w | |
| SCR-01 featured strip | 8 fixed slices | slim wallpaper[] (A-09) | loader ~480 w; lightbox ≤ 2560 w | |
| SCR-02 gallery | `getWallpapersByTheme`, `manifest.themes[x].subcategories` (names **and counts** after W3-02) | slim wallpaper[] (all of the theme) | loader 240–960 w by `sizes` | Paging is client-side over the full list (A-03) |
| SCR-03 lightbox | wallpaper from list | — | loader ≤ 2560 w (view); original (download) | GitHub blob link for "GitHub" |
| SCR-04 theme switcher | `lib/themes.ts` | — | — | |
| SCR-05 footer "updated" (W5-06) | `manifest.generatedAt` | date string prop | — | Formatted at build, not in the client |
| Deep links (W5-03) | wallpaper `id`, subcategory name → slug | — | — | Slug = same `slugify` as `generate-manifest.ts`; move it to `lib/format.ts` so both share it |
| Metadata / sitemap (W5-01) | `manifest.themes[x].count`, theme ids | — | OG: static files | |

**Slim wallpaper** (A-09): `{ id, theme, subcategory, filename, path, size }`. This is the same as the
manifest entry minus `extension`. The point is that the client receives it **as props for one theme**,
never as an import of the whole manifest.

## 2. URL rules

| Purpose | URL | Rule |
|---|---|---|
| Original (default) | `https://cdn.jsdelivr.net/gh/SleepyCatHey/CozyPixels@main/<encodeURI(path)>` | `size ≤ 20 MB` |
| Original (oversized) | `https://raw.githubusercontent.com/SleepyCatHey/CozyPixels/main/<encodeURI(path)>` | `size > 20 MB` (A-13) |
| Resized for display | `https://wsrv.nl/?url=<encodeURIComponent(original)>&w=<w>&q=<q>&output=webp` | Every `<Image>` via the loader (A-01) |
| Download | raw.githubusercontent original | Unchanged (`lightbox.tsx`, `wallpaper-card.tsx`) |
| View on GitHub | `https://github.com/SleepyCatHey/CozyPixels/blob/main/<encodeURI(path)>` | Unchanged |

## 3. Gaps and how we handle them in code

| Gap | Handling |
|---|---|
| No thumbnails in the source repo | wsrv.nl loader (A-01); build-time thumbnails stay as the ADR-01 fallback |
| No width/height in the manifest | Grid keeps a fixed 16/10 `object-cover` frame; the lightbox uses `object-contain` |
| GIFs (2 files) | The loader passes `output=webp`, so animation is lost in thumbnails. This is acceptable; the lightbox can skip the loader for `.gif` |
| jsDelivr 20 MB limit (1 file) | Raw GitHub URL (A-13) |

## 4. Setup and test data

- `pnpm run generate-manifest` regenerates from the GitHub API (needs network; set `GITHUB_TOKEN` to avoid rate limits).
- `pnpm build` runs it automatically through `prebuild`. Use `pnpm build:local` (P0-02) to build from the committed manifest.
- A regenerated manifest only changes `generatedAt` unless the source repo changed. Do not commit it unless the wallpaper set actually changed.
