# CozyPixels Web — Wave backlog

The optimisation broken into **stories**, wave by wave. Companion to [`../PLAN.md`](../PLAN.md) §11 and [`../../TRACKER.md`](../../TRACKER.md) (what is done).

How to read a story:

- **ID**: `P0-nn` (foundations), `W<wave>-nn`, `H-nn` (hardening). `TRACKER.md` ticks these IDs.
- **Layer**: `IMG` image pipeline · `JS` bundle/runtime · `UI` layout/interaction · `CSS` tokens/styles · `TEST` tooling · `DOC`.
- **Rules**: `A §1.4` = `docs/analysis/A_performance.md` §1.4 (B = mobile, C = style); `A-01` = assumption in `PLAN.md` §3; `PLAN §7.1` = plan section.
- **Size**: S ≤ 1 day · M 2–3 days · L 4–5 days.
- Every story meets the **Definition of Done**:
  - `pnpm lint` and `pnpm typecheck` are green;
  - `pnpm build:local` and `VERCEL=1 pnpm build:local` both succeed;
  - `pnpm test:e2e` is green (once P0-03 exists);
  - UI stories: checked at 360 px and 1280 px, in one light and one dark palette;
  - no identity element from C §1 removed or visibly changed (unless the story says so);
  - `component-catalogue.md` status column updated.
- Every wave ends with the **wave gate** (`PLAN §10`). The next wave does not start until it passes.
- Commit message: `<ID>: <story title>` (e.g. `W1-02: Custom image loader`).

Components and routes: [`component-catalogue.md`](component-catalogue.md). Data and URLs: [`data-usage.md`](data-usage.md).

---

## Phase 0 — Foundations

Measure first, add the tooling every later story uses, and delete dead code so diffs stay clean.

| ID | Layer | Story | Done when | Size |
|---|---|---|---|---|
| P0-01 | DOC | **Commit the documentation set.** `CLAUDE.md`, `TRACKER.md`, `docs/`. | `git log` shows `P0-01: Project documentation` | S |
| P0-02 | TEST | **Scripts + baseline.** Add `typecheck` (`tsc --noEmit`), `build:local` (`next build`, no manifest regen), `preview` (`serve out -l 4173`), `perf` (`scripts/perf.mjs`: runs `lighthouse` mobile preset on `/`, `/catppuccin`, `/onedark` against `preview`, prints Perf/LCP/TBT/CLS/transfer bytes and writes JSON to `.perf/`). Run it on current code with `VERCEL=1` and record the numbers in TRACKER §2 "Baseline". Add `.perf/` to `.gitignore`. | Baseline row in TRACKER with real numbers | M |
| P0-03 | TEST | **Playwright smoke suite.** `tests/smoke.spec.ts` on `preview`: each route at 360×740 and 1280×800 loads, has no horizontal overflow (`scrollWidth <= innerWidth`), the lightbox opens from a card, ArrowRight changes the counter, Escape closes it, and the theme choice survives a reload. Also save full-page screenshots to `.perf/shots/` (git-ignored) as the visual "before". Script `test:e2e`. | `pnpm test:e2e` green on current code | M |
| P0-04 | JS | **Remove dead code.** Delete `components/Features.tsx`, `components/Hero.tsx`, the unused `FadeInUp` import, `.no-jitter`, `tailwind.config.ts`, the `tailwindcss-animate` dep, and the unused `public/*.svg` (verify with grep first). Compare the built CSS file size before and after. | Build output identical in appearance; smoke green; deps removed | S |

**Exit**: baseline numbers recorded; `lint`, `typecheck`, `build:local`, `test:e2e`, `perf` all run with one command each.

---

## Wave 1 — Images and bundle (the big bytes)

| ID | Layer | Story | Files | Rules | Size |
|---|---|---|---|---|---|
| W1-01 | JS | **Keep the manifest on the server.** Move URL helpers into `lib/image-urls.ts` (pure, no JSON import). `lib/manifest.ts` gets `import "server-only"`. Client components import only from `image-urls`. Pages pass slim wallpaper objects as props. | `lib/manifest.ts`, `lib/image-urls.ts`, `wallpaper-card`, `lightbox`, `featured-strip` | A §2.1, A-09 | S |
| W1-02 | IMG | **Custom image loader.** `lib/image-loader.ts` per A-01 (wsrv.nl, webp, `w` from Next, `q` 70 default). `next.config.ts`: `images.loader: "custom"`, `loaderFile`, and remove `unoptimized`. Remove every `unoptimized` prop. Fix `sizes` on every `<Image>` to match real layouts (PLAN §7.1). `onError` fallback to the original. | `next.config.ts`, `lib/image-loader.ts`, all `<Image>` users | A §1.1–1.3, §1.6, §1.10, A-01, ADR-01 | M |
| W1-03 | IMG | **Priority hygiene.** Remove all `priority` props (deprecated, A §1.5). Theme pages: only card 0 gets `fetchPriority="high"`. Home: the collage gets no preload; the front card gets `fetchPriority="high"` with `loading="lazy"`, so hidden-on-mobile images never download. `priorityCount` prop removed. | `app/page.tsx`, `wallpaper-grid`, `wallpaper-card` | A §1.3–1.5 | S |
| W1-04 | IMG | **Lightbox image sizing.** Lightbox `<Image>` uses `sizes="100vw"` through the loader (up to 2560 w). Preload the next/previous image at the same width. Download and GitHub links keep the original. Add a loading state (shimmer + spinner) until `onLoad`. | `lightbox.tsx` | A §1.1, B §3.5, A-01 | S |
| W1-05 | IMG | **Logo and favicon.** Replace `lib/assets/logo.png` (1024 px JPEG, 372 KB) with an 80×80 and a 160×160 WebP/PNG. Replace `app/icon.png` with 32/192 px PNGs (`icon.png` + `apple-icon.png`). | `lib/assets/`, `app/icon.png`, `header.tsx` | A §1.9 | S |
| W1-06 | IMG | **Oversized originals.** `getImageUrl` uses raw.githubusercontent when `size > 20 MB`, for both the proxy source and the download. | `lib/image-urls.ts` | A §1.8, A-13 | S |

**Exit**: no client chunk contains `"sourceCommit"`; `pnpm perf` shows initial image transfer ≤ 1.5 MB on `/` and `/catppuccin`; at 360 px the network panel shows zero collage image requests on `/`.

---

## Wave 2 — Rendering, hydration and motion

| ID | Layer | Story | Files | Rules | Size |
|---|---|---|---|---|---|
| W2-01 | JS | **Theme before paint.** Inline `<script>` in `app/layout.tsx` `<head>` per A-06. `ThemeProvider` initialises state from the `<html>` attributes and removes the `visibility:hidden` branch. Also add per-theme `<meta name="theme-color">` updated on switch. | `app/layout.tsx`, `theme-provider.tsx` | A §3.1, A-06, ADR-05, C §4.7 | M |
| W2-02 | UI | **Paged grid.** `WallpaperGrid` renders 24, adds 24 when a sentinel enters `rootMargin: 800px`, and shows a "Load more" button fallback. Resets on `wallpapers` change. Lightbox index works over the full list. | `wallpaper-grid.tsx`, `theme-gallery.tsx` | A §3.3, B §2.2, A-03, ADR-04 | M |
| W2-03 | CSS | **CSS motion replaces framer-motion.** Card lift (`translateY(-6px)` with spring cubic-bezier) under `(hover:hover)`; download-button press scale via `:active`; hero stagger via `@keyframes rise` + `--stagger`. Everything is visible by default and only animated under `prefers-reduced-motion: no-preference`. Delete `components/animations.tsx`; remove the `framer-motion` dep. The feel must match the current hover on desktop. | `globals.css`, `wallpaper-card.tsx`, `app/page.tsx` | A §2.5, §3.2, A-05, ADR-02, C §1.8 | M |
| W2-04 | JS | **Lenis desktop-only, no GSAP.** `SmoothScroll` checks `matchMedia("(pointer: fine)")` and reduced-motion, does `await import("lenis")`, and uses `new Lenis({ autoRaf: true, … })`. It exposes `stop/start` (context or a window event) and the lightbox stops Lenis while open. Remove `gsap`. | `SmoothScroll.tsx`, `lightbox.tsx` | A §2.2, §2.4, §3.6, B §3.7, A-04, ADR-03 | S |
| W2-05 | CSS | **Scoped theme transition.** Delete the `*` transition. `setTheme`/`setMode` add `html.theme-switching` for 300 ms, and the CSS transitions colors only under that class. | `globals.css`, `theme-provider.tsx` | A §3.4, A-07 | S |
| W2-06 | CSS | **Cheaper effects below `md`.** Apply A-08 only if the W2 perf/paint trace shows the orbs or noise costing > 5 ms per frame on the throttled profile; otherwise log "not needed" in TRACKER §4. | `app/page.tsx`, `globals.css` | A §3.5, A-08 | S |

**Exit**: `pnpm perf` meets every A-11 budget on `/` and `/catppuccin`; `/catppuccin.html` ≤ 150 KB; `gsap` and `framer-motion` absent from `package.json`; hero headline visible with JS disabled.

---

## Wave 3 — Mobile UX

| ID | Layer | Story | Files | Rules | Size |
|---|---|---|---|---|---|
| W3-01 | UI | **Phone grid and cards.** 2 columns below `sm` (A-02). Compact card footer on phones (name only, subcategory hidden below `sm`). Download button with a 44 px hit area, always visible. Display names via `lib/format.ts` (strip `ign_`/`od_` prefixes and extension; `-`/`_` → spaces; title case), used for visible names **and** `alt` text ("Nordic rose, Nord abstract & artistic wallpaper"). | `wallpaper-grid`, `wallpaper-card`, `lib/format.ts` | B §2.1, §2.5, A-02, A-10, C §4.5, D §1.4 | M |
| W3-02 | UI | **Sticky compact filter bar.** On scroll, the search + chips bar sticks under the header (`top: 64px` + safe area) with glass styling. Chips get `scroll-snap`, edge fade masks, counts (`Anime & Gaming · 42`) and 44 px height. The clear button gets `aria-label` and a 44 px target. Search matches filename **and** subcategory. A result count shows ("128 wallpapers"). | `theme-gallery.tsx`, `app/[theme]/page.tsx` | B §2.3–2.6, A-10, C §4.3 | M |
| W3-03 | UI | **Lightbox for touch.** Horizontal swipe (pointer events, 50 px threshold, follows the finger), `dvh` units, safe-area padding, and a bottom action bar (name, download, GitHub, counter) anchored for thumbs. Side arrows only on `(hover:hover)`. Focus moves to the close button, is trapped, and is restored on close. Tap on the backdrop closes. Tint the backdrop from `--overlay`. | `lightbox.tsx` | B §3.1–3.6, C §3.2, PLAN §7.3, §7.5 | L |
| W3-04 | CSS | **Viewport units and safe areas.** Replace `min-h-[85vh]`, `min-h-screen` and `vh` uses with `svh`/`dvh`. Add `viewport` export (`viewportFit: "cover"`). Add safe-area padding on the header. | `app/page.tsx`, `app/layout.tsx`, `header.tsx` | B §1.2, §4.2, PLAN §7.3 | S |
| W3-05 | UI | **Theme switcher a11y + touch.** The mobile menu closes on Escape and outside `pointerdown`, has `aria-expanded`/`aria-haspopup`, and options use `aria-pressed`. The desktop segmented buttons get `aria-pressed`. Use one active style for both (solid primary). | `ThemeSwitcher.tsx` | B §4.1, §4.3, C §3.3 | S |

**Exit**: smoke suite green at 360 and 390 px; extended Playwright checks pass (swipe changes the lightbox counter, the filter bar is visible after scrolling 2000 px, no tap target < 44 px via a script check); Lighthouse a11y ≥ 95 on all routes.

---

## Wave 4 — Style polish (same identity)

| ID | Layer | Story | Files | Rules | Size |
|---|---|---|---|---|---|
| W4-01 | CSS | **Accessible palette tokens.** Apply A-14 in `globals.css`. Re-run the contrast script; every text token must be ≥ 4.5 in all 6 palettes. Add the script as `scripts/contrast.mjs` and record its output in TRACKER. | `globals.css`, `scripts/contrast.mjs` | C §2, A-14 | S |
| W4-02 | CSS | **Design-token pass.** Radius scale and `focus-ring` utility (PLAN §7.4) applied across components. Fluid headings with `clamp()` (hero `clamp(2.25rem, 6vw + 1rem, 4.5rem)`). Consistent section spacing. | `globals.css`, all components | C §3.1, §3.5, §3.6 | M |
| W4-03 | UI | **Theme page hero.** New `components/theme-hero.tsx`: name, description from `lib/themes.ts`, wallpaper and subcategory counts, 5 palette swatches from tokens, and a soft glow in the theme's primary. Visiting a theme page does **not** change the user's active site theme; the swatches only preview it. Add `generateMetadata` per theme. | `app/[theme]/page.tsx`, `components/theme-hero.tsx`, `lib/themes.ts` | C §3.4, §4.2 | M |
| W4-04 | CSS | **Loading shimmer + fade-in.** The card and lightbox image wrapper shows a token-tinted shimmer (`bg-secondary` → `bg-card` gradient). The image fades in on `onLoad` (200 ms). Respects reduced-motion. | `wallpaper-card`, `featured-strip`, `lightbox`, `globals.css` | C §4.1 | S |
| W4-05 | UI | **Mobile hero visual.** Below `sm`, show a single tilted wallpaper card (the Catppuccin front image, ~360 w via loader) under the CTA, with the same border/shadow language as the collage. The desktop collage is unchanged. | `app/page.tsx` | B §1.1, C §4.4, A-15 | S |
| W4-06 | UI | **Styled 404 and empty state.** `app/not-found.tsx` uses the "Free forever" panel style with links to the 3 themes. The grid empty state uses the same panel and a "Clear filters" button. | `app/not-found.tsx`, `wallpaper-grid.tsx` | B §5.2, C §4.6 | S |

**Exit**: screenshots at all A-12 viewports × 6 palettes reviewed against the P0-03 "before" set, with no identity element lost; contrast script all ≥ 4.5; perf budgets still met.

---

## Wave 5 — Completeness (sharing, credits, deep links, downloads, CI)

| ID | Layer | Story | Files | Rules | Size |
|---|---|---|---|---|---|
| W5-01 | UI | **Metadata, OG, sitemap, robots.** `metadataBase` + default `openGraph`/`twitter` in the root layout (A-17). Per-theme `generateMetadata` (title "Nord wallpapers · CozyPixels", count in the description). Static `app/opengraph-image.png` + one per theme (A-19). `app/sitemap.ts` + `app/robots.ts` as static output; check the Next 16 docs for static export first. | `app/layout.tsx`, `app/[theme]/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, OG images | D §1, A-17, A-19 | M |
| W5-02 | DOC/UI | **License, About, visible takedown.** Add an MIT `LICENSE` (A-18). New `app/about/page.tsx`: what this is, credits to SleepyCatHey, the source disclaimer verbatim, how to request credit/removal (Issues link), and a "No tracking" statement. Add an "About" link in the header (icon on mobile) and a slim dismissible credit note on theme pages linking to `/about`. | `LICENSE`, `app/about/page.tsx`, `header.tsx`, `app/[theme]/page.tsx` | D §2, `ctx §11`, A-18 | S |
| W5-03 | UI | **Deep links.** Sync chip, search and the open wallpaper with the URL per A-20. Opening a link with `?w=` opens the lightbox on that wallpaper (rendering its page of the grid if needed). Back closes the lightbox. Add a "Copy link" button in the lightbox. | `theme-gallery.tsx`, `wallpaper-grid.tsx`, `lightbox.tsx` | D §4.2, A-20 | M |
| W5-04 | UI | **Downloads with feedback.** The download button shows a spinner/progress (via `Content-Length` when available) and is disabled while running. On failure it shows a token-styled toast ("Opened in a new tab instead") with `role="status"`. The lightbox shows format + size ("PNG · 4.2 MB"). The grid announces the result count via `aria-live="polite"`. | `lib/download.ts`, `wallpaper-card.tsx`, `lightbox.tsx`, `theme-gallery.tsx`, `components/toast.tsx` (new) | D §4.3–4.5 | M |
| W5-05 | TEST | **CI gate + scheduled refresh.** In `nextjs.yml`: lint → typecheck → build → Playwright (`--project=chromium`, browsers cached) before upload. Add a daily `schedule` + keep `workflow_dispatch`. The manifest step uses `continue-on-error` with a warning, so the build falls back to the committed manifest (A-21). | `.github/workflows/nextjs.yml`, `scripts/generate-manifest.ts` | D §5, A-21 | S |
| W5-06 | UI | **Small delights.** A "Surprise me" button on theme pages (random wallpaper from the current filtered list → lightbox). "Copy image URL" in the lightbox. "Updated <date>" in the footer from `manifest.generatedAt` (passed as a prop). `app/manifest.ts` web app manifest + 192/512 icons (from W1-05), `theme_color` = Catppuccin Mocha base. | `theme-gallery.tsx`, `lightbox.tsx`, `footer.tsx`, `app/manifest.ts` | D §3, A-22 | S |

**Exit**: sharing `/nord?sub=anime-and-gaming&w=<id>` in a fresh browser opens that wallpaper; Discord/OG debugger shows an image for `/` and a theme page; `/about`, `/sitemap.xml`, `/robots.txt` resolve on Pages; a deliberately broken lint commit on a branch fails CI before deploy; Lighthouse SEO ≥ 95 and "installable" on `/`.

---

## Hardening

| ID | Layer | Story | Done when | Size |
|---|---|---|---|---|
| H-01 | TEST | **Full perf + a11y run on both deploy targets.** `pnpm perf` against the live Pages URL and the Vercel URL. | A-11 budgets met on both; numbers in TRACKER | S |
| H-02 | TEST | **Real-device pass.** Safari iOS + Chrome Android: browse → filter → open → swipe → download, in two palettes. | Checklist signed off in TRACKER §6 | S |
| H-03 | TEST | **Proxy failure drill.** Block `wsrv.nl` in DevTools and confirm originals load via fallback. | Pages remain usable; noted in TRACKER | S |
| H-04 | DOC | **Refresh docs.** README/setup.md (Next 16, not 15; Pages + Vercel; new scripts; real clone URL; license section points to `LICENSE` and states wallpapers are not covered) and `css_context.md` (tokens, motion, radius). Decide whether `context.md`/`css_context.md` should stop being git-ignored so collaborators see them (D §6.1). Log changes in TRACKER §4. | Docs match code | S |
