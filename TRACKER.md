# CozyPixels Web — Build tracker

**Read this first when you pick the project up.** It says where we are, what's next, and what changed from the plan.
**Update it at the end of every working session**: tick items, add to the next-up list, and record any deviation from `docs/PLAN.md`.

| | |
|---|---|
| Last updated | 2026-10-23 |
| Current phase | **Wave 4** in progress: W4-01 done, W4-02 next (branch `optimise`) |
| Next milestone | Phase 0 exit: baseline Lighthouse numbers recorded, smoke suite green |
| Plan | [`docs/PLAN.md`](docs/PLAN.md) · **Backlog: [`docs/plan/waves.md`](docs/plan/waves.md)** · Components: [`docs/plan/component-catalogue.md`](docs/plan/component-catalogue.md) · Data: [`docs/plan/data-usage.md`](docs/plan/data-usage.md) |
| Repo | https://github.com/vishank020/CozyPixel.web · live: https://vishank020.github.io/CozyPixel.web/ |

---

## 1. How to run it

Prerequisites: Node 24, pnpm 11.8.0. Network access for manifest generation.

```bash
pnpm install                       # first time
pnpm dev                           # dev server, http://localhost:3000
pnpm run generate-manifest         # refresh data/manifest.json from GitHub (GITHUB_TOKEN optional)
pnpm build                         # prebuild regenerates manifest, then static export to out/ (basePath /CozyPixel.web)
pnpm lint                          # eslint
# added in P0-02 / P0-03:
pnpm typecheck                     # tsc --noEmit
pnpm build:local                   # static export from committed manifest (Pages basePath)
pnpm build:preview                 # same, no basePath (Vercel-like; what preview/perf serve)
pnpm preview                       # serve out/ at http://localhost:4173
pnpm perf                          # Lighthouse mobile on /, /catppuccin, /onedark against preview
pnpm test:e2e                      # Playwright at 360 / 390 / 1280 px against preview
pnpm contrast                      # WCAG check of every text pairing in all 6 palettes
```

| What | Where |
|---|---|
| Dev server | http://localhost:3000 |
| Static preview | http://localhost:4173 (after P0-02) |
| GitHub Pages | https://vishank020.github.io/CozyPixel.web/ (deploys on push to `main`) |

---

## 2. Progress

Legend: `[x]` done · `[~]` in progress · `[ ]` not started

### Phase 0 — Foundations
- [x] P0-01 Commit the documentation set
- [x] P0-02 Scripts + baseline
- [x] P0-03 Playwright smoke suite
- [x] P0-04 Remove dead code

### Wave 1 — Images and bundle
- [x] W1-01 Keep the manifest on the server
- [x] W1-02 Custom image loader
- [x] W1-03 Priority hygiene
- [x] W1-04 Lightbox image sizing
- [x] W1-05 Logo and favicon
- [x] W1-06 Oversized originals

### Wave 2 — Rendering, hydration and motion
- [x] W2-01 Theme before paint
- [x] W2-02 Paged grid
- [x] W2-03 CSS motion replaces framer-motion
- [x] W2-04 Lenis desktop-only, no GSAP
- [x] W2-05 Scoped theme transition
- [x] W2-06 Cheaper effects below md (measured: not needed, no change)

### Wave 3 — Mobile UX
- [x] W3-01 Phone grid and cards
- [x] W3-02 Sticky compact filter bar
- [x] W3-03 Lightbox for touch
- [x] W3-04 Viewport units and safe areas
- [x] W3-05 Theme switcher a11y + touch

### Wave 4 — Style polish
- [x] W4-01 Accessible palette tokens
- [ ] W4-02 Design-token pass
- [ ] W4-03 Theme page hero
- [ ] W4-04 Loading shimmer + fade-in
- [ ] W4-05 Mobile hero visual
- [ ] W4-06 Styled 404 and empty state

### Wave 5 — Completeness
- [ ] W5-01 Metadata, OG, sitemap, robots
- [ ] W5-02 License, About, visible takedown
- [ ] W5-03 Deep links
- [ ] W5-04 Downloads with feedback
- [ ] W5-05 CI gate + scheduled refresh
- [ ] W5-06 Small delights

### Hardening
- [ ] H-01 Full perf + a11y run on both deploy targets
- [ ] H-02 Real-device pass
- [ ] H-03 Proxy failure drill
- [ ] H-04 Refresh docs

### Performance log

Filled by P0-02 (baseline) and every wave gate. Budgets: PLAN §3 A-11 (v1.1 from the Wave 2 gate). "LCP" is Lighthouse's simulated value; the observed value is noted where measured.

| Date | Point | Route | Perf | LCP | TBT | CLS | Img KB | JS KB (gz) |
|---|---|---|---|---|---|---|---|---|
| 2026-10-23 | Baseline | `/` | 85 | 4.23 s | 194 ms | 0 | 19,124 | 257 |
| 2026-10-23 | Baseline | `/catppuccin` | 42 | 7.35 s | 2,551 ms | 0 | 17,709 | 259 |
| 2026-10-23 | Baseline | `/onedark` | 52 | 10.03 s | 958 ms | 0 | 5,505 | 259 |

| 2026-10-23 | after W1-02 | `/` | 75 | 6.48 s | 158 ms | 0 | 510 | 235 |
| 2026-10-23 | after W1-02 | `/catppuccin` | 40 | 7.14 s | 6,911 ms | 0 | 664 | 238 |
| 2026-10-23 | after W1-02 | `/onedark` | 47 | 6.55 s | 2,352 ms | 0 | 563 | 238 |

| 2026-10-23 | Wave 1 gate | `/` | 90 | 3.58 s | 56 ms | 0 | 100 | 236 |
| 2026-10-23 | Wave 1 gate | `/catppuccin` | 43 | 5.41 s | 8,574 ms | 0 | 302 | 238 |
| 2026-10-23 | Wave 1 gate | `/onedark` | 71 | 4.02 s | 629 ms | 0 | 201 | 238 |

| 2026-10-23 | after W2-01 | `/` | 90 | 3.59 s | 36 ms | 0 | 100 | 236 |
| 2026-10-23 | after W2-01 | `/catppuccin` | 89 | 3.41 s | 160 ms | 0 | 302 | 238 |
| 2026-10-23 | after W2-01 | `/onedark` | 89 | 3.37 s | 212 ms | 0 | 201 | 238 |

| 2026-10-23 | after W2-02 | `/` | 90 | 3.61 s | 43 ms | 0 | 100 | 236 |
| 2026-10-23 | after W2-02 | `/catppuccin` | 94 | 3.15 s | 41 ms | 0 | 302 | 239 |
| 2026-10-23 | after W2-02 | `/onedark` | 93 | 3.27 s | 38 ms | 0 | 201 | 239 |

| 2026-10-23 | after W2-03 | `/` | 96 | 2.84 s | 42 ms | 0 | 100 | 196 |
| 2026-10-23 | after W2-03 | `/catppuccin` | 94 | 3.13 s | 39 ms | 0 | 302 | 201 |
| 2026-10-23 | after W2-03 | `/onedark` | 96 | 2.82 s | 31 ms | 0 | 201 | 201 |

| 2026-10-23 | after W2-04 | `/` | 96 | 2.73 s | 49 ms | 0 | 100 | 148 |
| 2026-10-23 | after W2-04 | `/catppuccin` | 95 | 2.92 s | 45 ms | 0 | 302 | 152 |
| 2026-10-23 | after W2-04 | `/onedark` | 97 | 2.62 s | 41 ms | 0 | 201 | 152 |

| 2026-10-23 | Wave 2 gate | `/` | 95 | 2.94 s (observed 0.41 s) | 52 ms | 0 | 100 | 148 |
| 2026-10-23 | Wave 2 gate | `/catppuccin` | 95 | 2.93 s (observed 0.11 s) | 49 ms | 0 | 302 | 153 |
| 2026-10-23 | Wave 2 gate | `/onedark` | 95 | 2.95 s (observed 0.15 s) | 57 ms | 0 | 201 | 153 |
| 2026-10-23 | Wave 3 gate | `/` | 95 (a11y 100) | 2.92 s (observed 0.14 s) | 58 ms | 0 | 100 | 149 |
| 2026-10-23 | Wave 3 gate | `/catppuccin` | 94 (a11y 100) | 3.08 s (observed 0.11 s) | 49 ms | 0 | 219 | 155 |
| 2026-10-23 | Wave 3 gate | `/onedark` | 96 (a11y 100) | 2.78 s (observed 0.10 s) | 47 ms | 0 | 103 | 155 |

Baseline: 3 runs per route (median), `pnpm build:preview` + `PERF_RUNS=3 pnpm perf`, local Chrome, Lighthouse 13.5 mobile preset. "JS KB" is transfer size (gzip from `serve`).

### Wave gate results

| Date | Wave | Suites run | Result | Notes (regressions found, fixes, deferred items) |
|---|---|---|---|---|
| 2026-10-23 | W3 | typecheck · lint (clean) · build:local · build:preview · test:e2e at 360/390/1280 px (120 + 12 skipped) · perf ×3 incl. accessibility | Pass | Exit: smoke green at 360 and 390 px (new permanent `mobile-390` project); real touch swipe changes the counter; filter bar in viewport after scrolling 2,000 px; 44 px sweep passes on every route; Lighthouse accessibility 100/100/100 (`perf.mjs` now budgets a11y ≥ 95). Gate found and fixed: chip counts at `opacity-70` gave 4.47:1 on the active chip → `opacity-80`. Lighthouse checks one palette; per-palette contrast is W4-01. No regressions |
| 2026-10-23 | W2 | typecheck · lint (clean) · build:local · build:preview · test:e2e (37 + 1 skipped) · perf ×3 + ×1 | Pass (A-11 v1.1) | Exit: every A-11 v1.1 budget met on all 3 routes (scores 94–96, TBT 45–57 ms, observed LCP 0.1–0.4 s); theme HTML 13–19 KB gzipped; gsap and framer-motion gone; hero reaches opacity 1 with all Next JS blocked (test). Against v1.0, simulated LCP (2.9–3.1 s) and theme-page JS (153 KB) failed; owner chose to revise the budgets (§4). Tried and reverted: lazy-loading the lightbox (saved ≈0 KB measured). No regressions |
| 2026-10-23 | W1 | typecheck · lint · build:local · build:preview · test:e2e (23 + 1 skipped) · perf ×3 | Pass | Exit: (1) 0 client chunks contain manifest data (was one 336 KB chunk); total JS 1.1 MB → 877 KB uncompressed. (2) Image transfer `/` 100 KB, `/catppuccin` 302 KB (budget 1,536). (3) Smoke test proves the hidden collage is never downloaded at 360 px. No regressions. Still failing A-11 (LCP, TBT, JS) is W2's exit. Lint 1 known error (W2-01). Image KB dropped further vs. W1-02 as the wsrv cache warmed |
| 2026-10-23 | Phase 0 | typecheck · lint · build:local · build:preview · test:e2e (14) · perf (baseline) | Pass | Exit met: every check runs with one command. Lint has 1 known error (theme-provider, fixed by W2-01; see §4). CSS 49.6 → 47.3 KB after dead-code removal |

**Commit convention:** `W<wave>-<nn>: <story title>`, one story per commit. When a wave is done: commit `Wave <n> complete`, tag `wave-<n>-done`.

---

## 3. Next up (in order)

1. ~~P0-01~~ done.
2. ~~P0-02~~ done.
3. ~~P0-03, P0-04~~ done.
4. ~~Phase 0, Wave 1~~ done.
5. ~~W2-01~~ done. Lint is fully clean.
6. ~~W2-02~~ done (`/catppuccin` TBT 8.6 s → 41 ms).
7. ~~W2-03~~ done (`/` 90 → 96).
8. ~~W2-04~~ done (JS 196 → 148–152 KB).
9. ~~W2-05, W2-06, Wave 2 gate~~ done.
10. ~~W3-01~~ done.
11. ~~W3-02~~ done.
12. ~~W3-03~~ done.
13. ~~W3-04~~ done.
14. ~~W3-05, Wave 3 gate~~ done.
15. ~~W4-01~~ done.
16. W4-02 design-token pass (radius scale, focus ring, fluid headings).

Quick win any time: the `LICENSE` file from W5-02 (no dependencies).

---

## 4. Deviations from the plan (and why)

| Date | Plan said | We did | Why |
|---|---|---|---|
| 2026-10-23 | `idea.md` scope: performance, mobile, style | Added analysis D (completeness) and Wave 5 | Owner asked to include anything else that is lacking |
| 2026-10-23 | P0-02: no-basePath build via `VERCEL=1 pnpm build:local` | Added `LOCAL_PREVIEW` to `next.config.ts` and a `build:preview` script (`scripts/build-preview.mjs`) | `VAR=1 cmd` doesn't work in Windows shells, and setting `VERCEL` locally could trigger Vercel-specific Next behaviour |
| 2026-10-23 | A-09: client receives slim wallpaper objects (no `extension`) | Pass full `Wallpaper` objects as props; only the import split was done | Dropping one short field saves ~4 KB of RSC payload per theme page, not worth the extra type and mapper. The real cost (336 KB manifest chunk) is gone |
| 2026-10-23 | A-06: `ThemeProvider` initialises state from `<html>` attributes on mount | `<html>` attributes + localStorage are an external store read with `useSyncExternalStore`; one function (`lib/theme-dom.ts`) is both serialised into the head script and called at runtime; `useLayoutEffect` re-applies for dev Strict Mode | Follows `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`. Mount-time state init would need setState in an effect (the lint error) and could drift from the script |
| 2026-10-23 | A-14: Latte muted-foreground → Subtext0; fix only the pairings named in C §2 | Subtext1 (`233 13% 41%`), and also fixed the pairings `pnpm contrast` found beyond C §2: button text in both Nord modes, hover accents in Nord/One Dark dark, One Dark light muted (4.45) | Subtext0 measures 4.40:1 on Latte Base. The script checks every text pairing the components use, which the analysis's 4-pairing table didn't |
| 2026-10-23 | W2-05 scope: remove the `*` transition | Also restores components' own hover transitions: the unlayered `*` rule beat Tailwind v4's layered `transition-*` utilities, so e.g. the card image zoom (`transition-transform duration-500`) snapped instead of easing | Visible but intended: the original classes now behave as written |
| 2026-10-23 | A-11 v1.0: simulated LCP ≤ 2.5 s, client JS ≤ 150 KB | A-11 v1.1: score ≥ 90, **observed LCP ≤ 1.0 s**, simulated LCP ≤ 3.5 s, JS ≤ 160 KB. Owner decision at the Wave 2 gate | Both v1.0 numbers were set before measuring and sit below the framework floor. Simulated LCP stays ≈2.56 s even with the web font removed (React/Next runtime on the simulated critical path); observed LCP is 0.1–0.4 s. JS is 112 KB React/Next runtime + ≈15 KB site code; lazy-loading the lightbox saved ≈0 KB. `perf.mjs` now reports observed LCP too |
| 2026-10-23 | W2-06: lighter glows/noise below `md` if paint cost > 5 ms/frame | No change. Measured home scroll at 360 px, 4× CPU throttle, 3 runs each: effects on avg 8.8–9.0 ms/frame vs off 8.7–8.8 ms (≈0.2 ms difference), no difference in frames > 33 ms | A-08's condition not met; keeping the effects intact also serves "keep the current style". Headless compositing differs from real phone GPUs, so H-02 re-checks on devices |
| 2026-10-23 | W2 Exit: "`/catppuccin.html` ≤ 150 KB" | Measured 243 KB raw / **19 KB gzipped** (was 1,094 KB raw). Criterion changed to "≤ 30 KB gzipped" | Raw size is a poor proxy for what users download. The rest is srcset markup and the RSC list of 383 wallpapers for the lightbox; slimming that (A-09) saves ~67 KB raw but ~5 KB gzipped, which isn't worth deriving fields on the client |
| 2026-10-23 | DoD: `pnpm lint` green (resolved by W2-01: lint fully clean) | Lint was already red at baseline (3 errors, 2 warnings); not fixed in P0-02 | Out of P0-02 scope. P0-04 fixes `tailwind.config.ts`, the apostrophe and unused imports; W2-01 fixes the `theme-provider` setState-in-effect error. Until then, "lint green" means "no new problems" |

---

## 5. Rules for anyone working here

- **The identity stays.** The palettes, glass header, noise, glows, rounded cards, hero collage and gentle motion listed in `docs/analysis/C_style.md` §1 must not be removed. "Improve" means polish (PLAN A-15).
- **Images stay on GitHub; cost stays $0.** No new paid service, and no originals in the deploy (`context.md` §2).
- **No tracking.** The site promises "no cost, ads, or tracking". Don't add analytics that track users.
- **Client components never import `lib/manifest.ts`.** Use props + `lib/image-urls.ts` (A-09).
- **Every `<Image>` goes through the loader** with correct `sizes`. No `unoptimized`, no `priority` (deprecated in Next 16).
- **Both deploy targets build** for every story (A-16).
- **Assumptions** A-01… in `docs/PLAN.md` §3 settle the open questions. Change one only by updating PLAN §3 and logging it in §4 here.
- **Don't commit a regenerated manifest** unless the wallpaper set actually changed.

---

## 6. Known issues / notes

- Playwright uses the installed Chrome locally (`channel: "chrome"`). In CI set `PW_CHANNEL=""` and run `pnpm exec playwright install --with-deps chromium` (W5-05). The suite blocks image requests for functional checks; only the screenshot test loads images. "Before" screenshots from 2026-10-23 are in `.perf/shots/` (git-ignored, local only). In them the featured strip is still empty boxes after 8 s on mobile.
- **LCP after W1-02 is render-bound, not image-bound.** On `/` the LCP element is the hero paragraph and 100 % of its LCP is "element render delay" (page hidden until hydration + framer-motion `initial` opacity 0). On `/catppuccin` the LCP image downloads in 271 ms and then waits 1.8 s to render. Images stopped dominating the simulated load, so the hydration gate is now what Lighthouse sees. W2-01/W2-03 target exactly this; a `preconnect` to wsrv.nl made no difference to it.
- TBT varies a lot between runs on this machine (`/catppuccin` 2.5 s → 5.8 s → 6.9 s with no change to JS work). Compare TBT only within one session, and use `PERF_RUNS=3`. The real fix is W2-02 (paging).
- wsrv.nl's first request for an uncached size can take ~6 s (measured on a 2.46 MB PNG); repeats are < 1 s. Visitors share that cache.
- A hidden `<img>` can still show as loaded when its URL matches a visible image (Chrome's in-memory image cache), e.g. the hero Catppuccin card reuses a theme-card thumbnail at 640 w. That costs no extra request. The smoke test checks network requests, not `currentSrc`.
- Lightbox at 360 px (checked 2026-10-23): image 46 KB at 1080 w instead of the multi-MB original; neighbours preloaded (7–20 KB). Arrows hidden behind the image on phones: fixed in W3-03 (swipe + bottom bar; arrows only on hover devices).
- **Always `pnpm build:preview` before `test:e2e`/`perf`.** `build:local` writes a basePath build to the same `out/`; served at the root it loads no JS. Both tools now refuse to run against it. (A run against it showed the no-JS ceiling: `/` perf 100, LCP 1.1 s.)
- **Simulated vs observed LCP (after W2-04).** Lighthouse's *observed* LCP equals FCP on every route (0.1–0.4 s locally); the *simulated* slow-4G LCP is 2.6–2.9 s. The LCP element is the header wordmark text; the simulation charges it for the 48 KB Inter font and the JS on the critical path (`font-display: swap` is already set, so real users see fallback text at first paint). A-11 still uses the simulated number.
- **Fixed 2026-10-23 (pre-existing bug, outside the backlog):** two wallpapers shared an id because `slugify` drops `+` (`od_stamina.png` / `od_stamina+.png`), giving React duplicate keys and making the second card open the first wallpaper in the lightbox. The generator now suffixes collisions (`-2`) and the committed manifest got the same one-line fix; `tests/manifest.spec.ts` guards it.
- `pnpm dev` serves under the Pages basePath: open **http://localhost:3000/CozyPixel.web** (or whichever port Next prints). The bare root 404s in dev. `build:preview`/`preview` serve at the root.
- Dev-only hydration warnings listing `data-darkreader-*` attributes come from the Dark Reader browser extension rewriting the DOM before React loads. They're not app bugs; disable the extension for localhost when checking for real hydration errors (the smoke tests run without extensions).
- With Lenis active (desktop), native `scrollIntoView`/`window.scrollTo` jumps are ignored. Use `scrollToElement()` from `components/SmoothScroll.tsx` for programmatic scrolling. Anchor links (`#themes`) work as-is.
- **Headless screenshots of fades are unreliable.** In headless desktop Chrome a large lightbox image takes ~0.3–0.5 s before its fade-in visibly starts (software raster), so a screenshot right after load can show an empty stage. Wait ~2 s before screenshotting. Real browsers don't show this; the spinner now stays behind the image until its fade ends either way.
- A failed `next build` leaves the previous `out/` in place, so tests then run against stale code. A TypeScript error in `tests/` fails the build (tsconfig includes them). Check for the `8/8` line before trusting a test run.
- **Flaky once (2026-10-23, after W3-04):** one `locator.click` timed out at 30 s in a run started straight after two production builds; the next 8 full runs passed (72/72). Unidentified test (output lost). If it recurs, capture the failing test name before re-running.
- **Contrast (W4-01, `pnpm contrast`).** Before: 14 text pairings under 4.5:1 (worst: Catppuccin light primary 1.80, Nord dark primary 3.03). After: all ≥ 4.5 in all 6 palettes. Token changes: Catppuccin light primary → Latte Mauve `#8839ef` with Latte Base text, muted → Latte Subtext1; Nord light primary L 52→45 %; Nord dark primary → `nord8` `#88c0d0`, accent-fg L 70→75 %; One Dark light primary L 55→51 %, muted L 45→44 %; One Dark dark accent-fg L 70→72 %. Visual check at 390 px in Catppuccin light and Nord dark.
- These docs were generated from the project-docs-template kit (removed from the repo on 2026-10-23 after use). The workflow it defines is fully captured in `CLAUDE.md` § Workflow and `docs/plan/waves.md`.
- `data/manifest.json` shows as modified: only `generatedAt` changed (any `pnpm build` regenerates it through `prebuild`). Revert with `git checkout data/manifest.json` unless the content changed.
- `CLAUDE.md`, `AGENTS.md`, `context.md` and `css_context.md` are listed in `.gitignore`, but `CLAUDE.md`/`AGENTS.md` are already tracked, so edits still show up. `context.md`/`css_context.md` are local only (revisit in H-04).
- A plain `pnpm build` uses `basePath: /CozyPixel.web`. For local preview or Lighthouse use `pnpm build:preview` (sets `LOCAL_PREVIEW=1`), so pages are served at `/`.
- `next dev` rewrites `AGENTS.md`. That is expected (see its header).
- A-01 relies on the free wsrv.nl proxy. If it is ever unreliable, ADR-01's fallback (build-time thumbnails) is the plan B; the swap is one loader file.
- README/setup.md say "Next.js 15" and recommend Vercel; the code is Next 16.3 and the live demo is GitHub Pages. Fixed in H-04.
