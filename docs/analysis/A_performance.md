# A — Analysis: performance (load, JS, rendering)

**Project:** CozyPixels Web
**Phase:** UNDERSTAND. This file feeds the development plan, so downstream agents can rely on it without re-reading the sources.
**Scope of this file:** what makes pages slow to load, slow to show content, or heavy to scroll. This covers images, client JS, hydration, animation libraries and CSS effects.
**Date of analysis:** 2026-10-23

---

## 0. Conventions, sources and coverage

### 0.1 Citation keys

| Key | Source |
|---|---|
| `BL §n` | `docs/source/baseline-2026-10-23.md` section n |
| `ctx §n` | `context.md` section n |
| `<file>:L<n>` | repo file at commit `566ffac`, line n |
| `docs:image` | `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` |
| `docs:export` | `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` |

- **derived** marks an inference of mine, not something the source states.

### 0.2 Source coverage

| Source | Coverage |
|---|---|
| `app/`, `components/`, `lib/`, `scripts/` | Every file read in full. |
| `next.config.ts`, `package.json`, `globals.css`, `tailwind.config.ts`, CI workflow | Read in full. |
| `data/manifest.json` | Profiled with a read-only script (counts, sizes); see `BL §1–2`. |
| `out/` build | Sizes listed; chunks grepped for manifest data (`BL §3`). |
| Lighthouse / real-device traces | **Do not exist.** P0-02 creates them. Runtime claims below are marked **derived**. |

---

## 1. Images (the dominant cost)

1. **Every image is a full-resolution original.** `next.config.ts:L7` sets `images.unoptimized: true` and every `<Image>` also passes `unoptimized`. The grid, theme cards, featured strip and hero all load the same file the user downloads. Median original is 0.38 MB, p90 4.17 MB (`BL §1`).
2. **Home page asks for ~23 MB of images.** Hero 3.7 MB, theme cards 7.4 MB, featured 12.0 MB (`BL §2`). The featured strip and theme cards are lazy, so the real first-load cost depends on scroll. **derived**
3. **Theme pages preload up to 12.6 MB.** `wallpaper-grid.tsx:L16` sets `priorityCount = 6`, so the first 6 cards get `priority` (`wallpaper-card.tsx:L40`). On `/catppuccin` those 6 are 12.6 MB (`BL §2`).
4. **The hero collage is preloaded on phones where it is hidden.** `app/page.tsx:L98` hides the collage below `sm` (`hidden sm:flex`), but its three images use `priority` (`L104, L111, L118`). `priority` emits a preload regardless of CSS visibility, so phones download ~3.7 MB they never show. **derived** from `docs:image` behaviour of preload; confirm in P0-02 network trace.
5. **`priority` is deprecated in Next 16.** `docs:image` L291–293: replaced by `preload`; L289 recommends `loading="eager"` or `fetchPriority="high"` in most cases.
6. **Static export cannot use the default optimizer, but a custom loader works.** `docs:export` L168–180: `images.loader: 'custom'` + `loaderFile`. This is the supported way to get resized thumbnails while keeping `output: 'export'`.
7. **No thumbnails exist anywhere.** The manifest has no width/height/thumbnail fields (`lib/types.ts:L3–11`). Generating them at build time would mean downloading ~1.3 GB of originals per build (`BL §1`). **derived**
8. **One original exceeds jsDelivr's 20 MB limit.** `Catppuccin/Transportation/van-chilling.png` is 23.48 MB (`BL §1`). `getImageUrl` prefers jsDelivr (`lib/manifest.ts:L36–38`), so this card is likely broken. **derived**
9. **The header logo is a 1024×1024, 372 KB JPEG shown at 32–40 px.** `header.tsx:L11–17`. With `unoptimized: true` the full file ships. `app/icon.png` is the same 372 KB file (`BL §2`).
10. **`sizes` values are inconsistent with layouts.** Theme-card thumbs use `sizes="20vw"` (`app/page.tsx:L180`) though cards are full-width on mobile. This is harmless while images are unoptimized but wrong once a loader is added.

## 2. Client JavaScript

1. **The entire manifest ships to the browser.** Client components `wallpaper-card.tsx:L7`, `lightbox.tsx:L13` and `featured-strip.tsx:L7` import URL helpers from `lib/manifest.ts`. Line 1 of that file imports `data/manifest.json` (273 KB). Result: a 336 KB chunk containing the manifest (`BL §3`).
2. **Three animation/scroll libraries load on every page.** `SmoothScroll` (in `app/layout.tsx:L28`) pulls `lenis` + `gsap` + `ScrollTrigger`. `animations.tsx` and `wallpaper-card.tsx` pull `framer-motion`. GSAP is used only to drive Lenis's rAF and `ScrollTrigger.update` (`SmoothScroll.tsx:L23–31`). Nothing on a live page uses ScrollTrigger.
3. **Dead components.** `components/Features.tsx` and `components/Hero.tsx` are not imported anywhere and contain unrelated agency copy ("Start a Project"). `FadeInUp` is imported in `app/page.tsx:L7` but unused. `.no-jitter` (`globals.css:L241`) is unused. `tailwindcss-animate` and `tailwind.config.ts` are not loaded by Tailwind v4 (no `@config` in `globals.css`). **derived**: verify the build CSS is unchanged when removed.
4. **Ticker leak.** `SmoothScroll.tsx:L36–38` removes a *new* arrow function from `gsap.ticker`, not the one added at `L26`, so the callback is never removed.
5. **One `motion.div` per wallpaper card.** `wallpaper-card.tsx:L24, L64`: two motion components × up to 413 cards. This is only for a hover lift and a tap scale, which CSS can do. **derived**: costly to hydrate on low-end phones.

## 3. Rendering and hydration

1. **The whole site is invisible until JS hydrates.** `theme-provider.tsx:L136–143` renders children inside `visibility: hidden` until a `useEffect` runs. The static HTML has content, but nothing paints until all JS downloads, parses and hydrates. On a mid-range phone on 4G this delays first paint and LCP by seconds. **derived**
2. **Hero text starts at opacity 0.** `StaggerContainer`/`StaggerItem` (`animations.tsx:L36–48, L63–67`) use `initial="hidden"`. The headline, which is the likely LCP element on mobile, stays invisible until framer-motion runs. **derived**
3. **Theme pages render every card at once.** `wallpaper-grid.tsx:L48–55` maps all wallpapers. That yields 1.1 MB HTML for `/catppuccin` and `/nord` (`BL §3`) and hundreds of DOM nodes and image elements at hydration.
4. **Universal transition on every element.** `globals.css:L232–238` applies `transition` to `*`. Every color/shadow change anywhere animates, and a theme switch transitions every node at once. **derived**: janky on low-end devices.
5. **Expensive full-screen effects.** Home orbs use `blur-[120px]`/`blur-[150px]` + `mix-blend-screen` on 40–50 % viewport elements (`app/page.tsx:L32–33`). The noise overlay is a fixed, full-viewport SVG `feTurbulence` at `z-index: 50` (`globals.css:L222–230`). The sticky header uses `backdrop-blur-md`. **derived**: each is fine alone; together they raise paint cost on mobile GPUs. Measure in P0-02 before changing.
6. **Lenis runs a permanent rAF loop** via the GSAP ticker (`SmoothScroll.tsx:L26`), even on touch devices where Lenis does not smooth scrolling by default. **derived**

## 4. Build and data

1. **`prebuild` regenerates the manifest from the GitHub API on every build** (`package.json` `prebuild`). Local builds need network access and can hit rate limits. They also rewrite `generatedAt`, which is why `data/manifest.json` shows as modified in git.
2. **`basePath` depends on the `VERCEL` env** (`next.config.ts:L5`). A plain local build serves under `/CozyPixel.web`, which matters for local Lighthouse runs.

---

## 5. Findings summary

| # | Finding | Why it matters for the build |
|---|---|---|
| 1 | Full-res originals everywhere (§1.1–1.3) | Biggest single win: thumbnails via a custom loader |
| 2 | Hidden hero preloads 3.7 MB on phones (§1.4) | Easy win on the most-visited page |
| 3 | Manifest in client JS (§2.1) | 336 KB of JS for nothing; fix by splitting helpers |
| 4 | Page hidden until hydration (§3.1–3.2) | Directly delays LCP on mobile |
| 5 | All cards rendered at once (§3.3) | 1.1 MB HTML, heavy hydration |
| 6 | Three motion libs, GSAP only for Lenis (§2.2) | Remove GSAP; gate Lenis to desktop |
| 7 | `*` transition, heavy blurs (§3.4–3.5) | Scroll/theme-switch jank on low-end phones |
| 8 | 372 KB logo + favicon (§1.9) | Easy win |

## 6. Gaps — what the sources do NOT provide

- No Lighthouse, Web Vitals or device traces. A-11 sets budgets; P0-02 measures.
- No image dimensions in the manifest. Grid aspect ratio is fixed at 16/10, so this is not blocking.
- No thumbnail source. A-01 decides it.

## 7. Open questions

- Q-01 Where do thumbnails come from, at $0? → A-01
- Q-02 Keep Lenis smooth scrolling at all? → A-04
- Q-03 Keep framer-motion? → A-05
- Q-04 What are the performance budgets, and on which device profile? → A-11
