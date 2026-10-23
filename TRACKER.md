# CozyPixels Web — Build tracker

**Read this first when you pick the project up.** It says where we are, what's next, and what changed from the plan.
**Update it at the end of every working session**: tick items, add to the next-up list, and record any deviation from `docs/PLAN.md`.

| | |
|---|---|
| Last updated | 2026-10-23 |
| Current phase | **Wave 1** in progress: W1-01…W1-04 done; W1-05 next (branch `optimise`) |
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
pnpm test:e2e                      # Playwright smoke at 360 px + 1280 px against preview
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
- [ ] W1-05 Logo and favicon
- [ ] W1-06 Oversized originals

### Wave 2 — Rendering, hydration and motion
- [ ] W2-01 Theme before paint
- [ ] W2-02 Paged grid
- [ ] W2-03 CSS motion replaces framer-motion
- [ ] W2-04 Lenis desktop-only, no GSAP
- [ ] W2-05 Scoped theme transition
- [ ] W2-06 Cheaper effects below md

### Wave 3 — Mobile UX
- [ ] W3-01 Phone grid and cards
- [ ] W3-02 Sticky compact filter bar
- [ ] W3-03 Lightbox for touch
- [ ] W3-04 Viewport units and safe areas
- [ ] W3-05 Theme switcher a11y + touch

### Wave 4 — Style polish
- [ ] W4-01 Accessible palette tokens
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

Filled by P0-02 (baseline) and every wave gate. Budgets: PLAN §3 A-11.

| Date | Point | Route | Perf | LCP | TBT | CLS | Img KB | JS KB (gz) |
|---|---|---|---|---|---|---|---|---|
| 2026-10-23 | Baseline | `/` | 85 | 4.23 s | 194 ms | 0 | 19,124 | 257 |
| 2026-10-23 | Baseline | `/catppuccin` | 42 | 7.35 s | 2,551 ms | 0 | 17,709 | 259 |
| 2026-10-23 | Baseline | `/onedark` | 52 | 10.03 s | 958 ms | 0 | 5,505 | 259 |

| 2026-10-23 | after W1-02 | `/` | 75 | 6.48 s | 158 ms | 0 | 510 | 235 |
| 2026-10-23 | after W1-02 | `/catppuccin` | 40 | 7.14 s | 6,911 ms | 0 | 664 | 238 |
| 2026-10-23 | after W1-02 | `/onedark` | 47 | 6.55 s | 2,352 ms | 0 | 563 | 238 |

Baseline: 3 runs per route (median), `pnpm build:preview` + `PERF_RUNS=3 pnpm perf`, local Chrome, Lighthouse 13.5 mobile preset. "JS KB" is transfer size (gzip from `serve`).

### Wave gate results

| Date | Wave | Suites run | Result | Notes (regressions found, fixes, deferred items) |
|---|---|---|---|---|
| 2026-10-23 | Phase 0 | typecheck · lint · build:local · build:preview · test:e2e (14) · perf (baseline) | Pass | Exit met: every check runs with one command. Lint has 1 known error (theme-provider, fixed by W2-01; see §4). CSS 49.6 → 47.3 KB after dead-code removal |

**Commit convention:** `W<wave>-<nn>: <story title>`, one story per commit. When a wave is done: commit `Wave <n> complete`, tag `wave-<n>-done`.

---

## 3. Next up (in order)

1. ~~P0-01~~ done.
2. ~~P0-02~~ done.
3. ~~P0-03, P0-04~~ done.
4. ~~Phase 0 gate, W1-01, W1-02~~ done. Next: W1-05 logo and favicon.

Quick win any time: the `LICENSE` file from W5-02 (no dependencies).

---

## 4. Deviations from the plan (and why)

| Date | Plan said | We did | Why |
|---|---|---|---|
| 2026-10-23 | `idea.md` scope: performance, mobile, style | Added analysis D (completeness) and Wave 5 | Owner asked to include anything else that is lacking |
| 2026-10-23 | P0-02: no-basePath build via `VERCEL=1 pnpm build:local` | Added `LOCAL_PREVIEW` to `next.config.ts` and a `build:preview` script (`scripts/build-preview.mjs`) | `VAR=1 cmd` doesn't work in Windows shells, and setting `VERCEL` locally could trigger Vercel-specific Next behaviour |
| 2026-10-23 | A-09: client receives slim wallpaper objects (no `extension`) | Pass full `Wallpaper` objects as props; only the import split was done | Dropping one short field saves ~4 KB of RSC payload per theme page, not worth the extra type and mapper. The real cost (336 KB manifest chunk) is gone |
| 2026-10-23 | DoD: `pnpm lint` green | Lint was already red at baseline (3 errors, 2 warnings); not fixed in P0-02 | Out of P0-02 scope. P0-04 fixes `tailwind.config.ts`, the apostrophe and unused imports; W2-01 fixes the `theme-provider` setState-in-effect error. Until then, "lint green" means "no new problems" |

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
- Lightbox at 360 px (checked 2026-10-23): image 46 KB at 1080 w instead of the multi-MB original; neighbours preloaded (7–20 KB). The prev/next arrows are fully covered by the image on phones (B §3.2); W3-03 replaces them with swipe + a bottom bar.
- These docs were generated from the project-docs-template kit (removed from the repo on 2026-10-23 after use). The workflow it defines is fully captured in `CLAUDE.md` § Workflow and `docs/plan/waves.md`.
- `data/manifest.json` shows as modified: only `generatedAt` changed (any `pnpm build` regenerates it through `prebuild`). Revert with `git checkout data/manifest.json` unless the content changed.
- `CLAUDE.md`, `AGENTS.md`, `context.md` and `css_context.md` are listed in `.gitignore`, but `CLAUDE.md`/`AGENTS.md` are already tracked, so edits still show up. `context.md`/`css_context.md` are local only (revisit in H-04).
- A plain `pnpm build` uses `basePath: /CozyPixel.web`. For local preview or Lighthouse use `pnpm build:preview` (sets `LOCAL_PREVIEW=1`), so pages are served at `/`.
- `next dev` rewrites `AGENTS.md`. That is expected (see its header).
- A-01 relies on the free wsrv.nl proxy. If it is ever unreliable, ADR-01's fallback (build-time thumbnails) is the plan B; the swap is one loader file.
- README/setup.md say "Next.js 15" and recommend Vercel; the code is Next 16.3 and the live demo is GitHub Pages. Fixed in H-04.
