@AGENTS.md

# CozyPixels Web

A free, open-source static gallery (Next.js 16 App Router, `output: "export"`, React 19, Tailwind v4)
for the SleepyCatHey/CozyPixels wallpaper collection. Data comes from `data/manifest.json`, generated
from the GitHub tree API at build. Images are served from jsDelivr / raw GitHub. It deploys to GitHub
Pages (live demo) and Vercel. Current work: make it fast and mobile-first, polish the style without
changing its identity, then close completeness gaps (SEO/sharing, credits, deep links, CI).

- **Start every session by reading `TRACKER.md`.** It holds status, next steps and deviations from the plan. Update it before you finish.
- The plan: `docs/PLAN.md` (assumptions A-01… in §3). Backlog per wave: `docs/plan/waves.md`. Routes/components: `docs/plan/component-catalogue.md`. Data/URLs: `docs/plan/data-usage.md`.
- Analysis: `docs/analysis/` (A performance, B mobile, C style, D completeness). Frozen inputs: `docs/source/` plus `context.md`, `css_context.md` at the root.

## Hard rules

- Keep the visual identity in `docs/analysis/C_style.md` §1 (palettes, glass header, noise, glows, rounded cards, hero collage, gentle motion). Polish, don't replace.
- $0, no tracking, and images stay on GitHub. No paid services or tracking analytics; never bundle wallpaper originals into the deploy.
- Client components never import `lib/manifest.ts` (server-only). Pass slim props and use `lib/image-urls.ts`.
- Every `<Image>` goes through the custom loader with accurate `sizes`. No `unoptimized`, no `priority` (deprecated in Next 16; use `fetchPriority`/`preload` deliberately).
- Every story must build for both targets: `pnpm build:local` and `pnpm build:preview`.
- Read the relevant guide in `node_modules/next/dist/docs/` before using a Next API (see AGENTS.md).

## Commands

- `pnpm install`: first time only
- `pnpm dev`: dev server on :3000
- `pnpm lint` · `pnpm typecheck`: static checks (typecheck added in P0-02)
- `pnpm build:local`: static export from the committed manifest, Pages basePath (P0-02)
- `pnpm build:preview`: same, no basePath, which is what `preview`/`perf`/`test:e2e` serve (P0-02)
- `pnpm preview`: serve `out/` on :4173 (P0-02)
- `pnpm test:e2e`: Playwright smoke at 360 px + 1280 px (P0-03), the "test fast" suite
- `pnpm perf`: Lighthouse mobile against budgets A-11 (P0-02), part of the wave gate
- `pnpm run generate-manifest`: refresh the manifest from GitHub (`GITHUB_TOKEN` optional)

## Workflow (story loop and wave gate)

- One story at a time, in `docs/plan/waves.md` order. Do not start a story until the previous one is ticked.
- Per story: build → lint + typecheck + both builds + `test:e2e` → for UI, check 360 px and 1280 px in a light and a dark palette → tick `TRACKER.md` → commit → push.
- **Commit convention:** `W<wave>-<nn>: <story title>` (also `P0-nn`, `H-nn`). One story = one commit. Body lists what was tested.
- **Push policy:** commit locally after every story; ask before pushing (a push to `main` deploys GitHub Pages). Never force-push.
- **Wave gate:** when a wave's last story is ticked, run everything plus `pnpm perf`, check the wave's Exit line with evidence, record it in TRACKER "Wave gate results" and the performance log, then commit `Wave <n> complete` and tag `wave-<n>-done`. No next wave until it is green.
- A test that fails twice: stop and report. Never weaken or delete a test to get green.

## Conventions

- New page → `app/<route>/page.tsx` as a server component; static params for dynamic segments; per-page `generateMetadata`.
- New client component → `"use client"`, takes data via props, imports only `lib/image-urls.ts`, `lib/themes.ts`, `lib/format.ts`.
- Colors → semantic tokens only (`bg-background`, `text-primary`…); new tokens go in all 6 palette blocks in `app/globals.css` and `@theme`.
- Motion → CSS only, behind `prefers-reduced-motion: no-preference`; hover effects behind `(hover: hover)`.
- Touch targets ≥ 44 px; use `dvh`/`svh`, never `vh`; icon-only buttons need `aria-label`; alt text uses `lib/format.ts` display names.
- Filter/lightbox state on theme pages lives in the URL (`?sub=&q=&w=`, A-20).
