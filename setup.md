# 🛠️ Tech Stack & Setup Guide

## 🛠️ Tech Stack

| Layer | What we use |
|---|---|
| Framework | **Next.js 16.3** (App Router, Turbopack) with a **static export** to `out/` — no server at runtime |
| UI | **React 19.2**, **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.ts`), **lucide-react** icons |
| Data | `data/manifest.json`, generated from the upstream GitHub repository |
| Images | **wsrv.nl** resizing proxy in front of raw GitHub; jsDelivr/raw GitHub as the browser fallback |
| Hosting | **GitHub Pages** (live demo, `basePath: /CozyPixel.web`) and **Vercel** (root, no basePath) |
| Tooling | Node 24, pnpm 11.8.0, Playwright, Lighthouse, ESLint, TypeScript |

There is no database, no API route and no tracking. Every wallpaper stays in the
[original CozyPixels repository](https://github.com/SleepyCatHey/CozyPixels); the deployment only contains code and a JSON manifest.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/vishank020/CozyPixel.web.git
cd CozyPixel.web
```

### 2. Install dependencies

Requires **Node 24** and **pnpm 11.8.0** (`corepack enable` is the easiest way to get pnpm).

```bash
pnpm install
```

### 3. Generate the manifest (optional)

`data/manifest.json` is committed, so the site builds without network access. To refresh it from the
upstream repository:

```bash
pnpm run generate-manifest
# or, if GitHub's anonymous rate limit is too low:
GITHUB_TOKEN=your_token pnpm run generate-manifest
```

`pnpm build` refreshes it automatically through the `prebuild` hook. `build:local` and `build:preview`
use the committed file as-is, so CI can build even when the GitHub API is unavailable.

### 4. Start the development server

```bash
pnpm dev
```

Open **http://localhost:3000/CozyPixel.web** — dev serves under the same basePath as GitHub Pages.
The bare root (`http://localhost:3000`) returns 404 by design.

---

## 📜 Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Dev server at `/CozyPixel.web` |
| `pnpm build` | Refresh the manifest, static export **with** the Pages basePath, then patch route prefetch files |
| `pnpm build:local` | Same export **without** refreshing the manifest (what CI deploys) |
| `pnpm build:preview` | Static export **without** basePath, as on Vercel — use this for local preview, tests and Lighthouse |
| `pnpm preview` | Serve `out/` at **http://localhost:4173** |
| `pnpm typecheck` | `next typegen && tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm contrast` | WCAG contrast check for every text pairing in all six palettes |
| `pnpm test:e2e` | Playwright smoke suite at 360 / 390 / 1280 px (against `preview`) |
| `pnpm perf` | Lighthouse mobile on `/`, `/catppuccin`, `/onedark` (against `preview`, or set `PERF_URL`) |
| `pnpm make-og` | Regenerate the social images in `public/og/` (needs network) |

Run `pnpm build:preview` before `pnpm preview`, `pnpm test:e2e` or `pnpm perf`: all three write to the
same `out/`, and a Pages build served at the root loads no JavaScript. The tools now refuse to run
against the wrong build.

---

## 🚢 Deploying

### GitHub Pages (live demo)

`.github/workflows/nextjs.yml` runs on every push to `main`, daily at 03:00 UTC (manifest refresh) and
on manual dispatch. Steps: refresh the manifest (non-blocking) → lint → typecheck → contrast →
`build:preview` → Playwright → `build:local` → deploy. Pull requests run the same checks without
deploying.

The workflow uses the `GITHUB_TOKEN` to refresh the manifest; if that fails it logs a warning and
builds from the committed `data/manifest.json`.

### Vercel

Import the repository in Vercel and keep the default Next.js settings. `vercel.json` sets
`cleanUrls` (so `/about` works) and the pnpm install command. Vercel builds with `VERCEL=1`, which
removes the basePath, and `SITE_ORIGIN` can override the public origin for a custom domain.

---

## 📝 Notes

- **Images:** `lib/image-loader.ts` points every `<Image>` at `wsrv.nl`. If the proxy fails,
  `WallpaperImage` retries the original URL (jsDelivr or raw GitHub) automatically. If wsrv.nl ever
  becomes unusable, ADR-01's build-time thumbnails are the plan B; the swap is one loader file.
- **Sharing:** the site URL comes from `SITE_ORIGIN` (default `https://vishank020.github.io`) plus the
  basePath, exposed as `NEXT_PUBLIC_SITE_URL`. On GitHub Pages, `robots.txt` lives under
  `/CozyPixel.web/`, so submit the sitemap URL to search consoles directly.
- **Manifest:** some wallpapers appear in two categories upstream; that is left as-is.
- `pnpm dev` rewrites `AGENTS.md` on purpose (Next's agent-rules block).
- **License:** the code is MIT (see [`LICENSE`](LICENSE)); the wallpapers are **not** covered by that
  licence and remain the property of their authors — see the
  [original repository](https://github.com/SleepyCatHey/CozyPixels).
