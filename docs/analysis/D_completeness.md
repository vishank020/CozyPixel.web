# D — Analysis: everything else that is lacking

**Project:** CozyPixels Web
**Phase:** UNDERSTAND. This file feeds the development plan, so downstream agents can rely on it without re-reading the sources.
**Scope of this file:** gaps outside performance, mobile and style. It covers SEO/sharing, credits and legal, the original MVP list in `context.md` §8, discovery features, CI/quality, data freshness, accessibility not covered in [B], and repo hygiene. Added at the owner's request on 2026-10-23: "apart from performance, responsiveness and style, if anything else is lacking you can include that as well."
**Date of analysis:** 2026-10-23

---

## 0. Conventions, sources and coverage

### 0.1 Citation keys

Same as `A_performance.md` §0.1, plus `ctx §n` = `context.md` section n.

### 0.2 Source coverage

| Source | Coverage |
|---|---|
| `context.md` §8 (MVP + nice-to-have), §11 (legal) | Read in full and compared item by item against the code. |
| `app/`, `components/`, `.github/workflows/nextjs.yml`, repo root | Read in full; checked for `LICENSE`, `sitemap`, `robots`, `opengraph-image`, `manifest`, `about/`. **None exist.** |
| Search engine / social preview results | **Not checked** (needs the live site). |

---

## 1. SEO and sharing

1. **Only root metadata exists.** `app/layout.tsx:L8–12` sets `title` + `description`. There is no `metadataBase`, `openGraph`, `twitter` or `alternates.canonical`, and theme pages have no `generateMetadata`. All three galleries share the home title. **derived**
2. **No social preview image.** There is no `app/opengraph-image.*`. Links shared in Discord, Reddit or X show no picture, which is a real loss for a wallpaper site. **derived**
3. **No `sitemap.xml` / `robots.txt`.** Both can be static files in an export (`app/sitemap.ts`, `app/robots.ts` with `dynamic = "force-static"`). **derived**: check the Next 16 docs in `node_modules/next/dist/docs/` before implementing.
4. **Wallpaper names are raw filenames** (`ign_FluidifiedST-2.png`) in `alt` text and titles (`wallpaper-card.tsx:L36`). That is poor for image search and screen readers.

## 2. Credits, legal, trust

1. **No LICENSE file.** `ctx §1`, `§4` and the README say "MIT / open source", but the repo has no `LICENSE`. Legally, without one the code is all-rights-reserved.
2. **Takedown notice is footer-only.** `ctx §11` says the notice must appear "prominently (header banner + dedicated About page)". Today it exists only in `footer.tsx:L8–23`.
3. **No About / credits page** (`ctx §5` lists `app/about/page.tsx`; `ctx §8` MVP "clear, permanent credit & takedown notice").
4. **"Free forever… without any cost, ads, or tracking"** (`app/page.tsx:L223`) is true today. Keep it true: add no analytics that track.

## 3. Original MVP / nice-to-have list vs reality (`ctx §8`)

| Item (`ctx §8`) | Status in code |
|---|---|
| Landing with three theme cards | ✅ |
| Theme pages with subcategory chips | ✅ |
| Responsive grid | ✅ (phone layout weak, see [B]) |
| Full-screen lightbox with keyboard nav | ✅ (no swipe, see [B]) |
| One-click download | ✅ |
| Client-side search (filename + subcategory) | ⚠️ filename only (`theme-gallery.tsx:L19`) |
| Clear credit & takedown notice | ⚠️ footer only (§2.2) |
| Mobile-first | ⚠️ see [B] |
| Dark/light per theme | ✅ |
| **Open Graph / Twitter cards** | ❌ (§1) |
| **MIT license + link back** | ⚠️ link yes, LICENSE file no (§2.1) |
| Random wallpaper button | ❌ |
| **Shareable deep links with filters** | ❌ filter state is component state only; a lightbox can't be linked |
| "Copy raw URL" button | ❌ |
| Resolution / aspect badges | ❌ (no dimensions in manifest) |
| PWA manifest | ❌ |
| "Last updated" badge | ❌ (`manifest.generatedAt` exists) |
| Auto-redeploy when CozyPixels changes | ❌ (§5.2) |

## 4. Discovery and usability

1. **Search is per theme only.** There is no way to search all 939 wallpapers (`ctx §5` lists `app/search`). **derived**: low priority, since most users browse by theme.
2. **No way to link to a wallpaper or a filtered view.** Refreshing or sharing loses the chip, the search and the open lightbox.
3. **Download failures are silent.** `lib/download.ts:L17–20` falls back to a new tab with only a `console.error`. There is no "downloading…" state on the button, even though a 4–20 MB fetch can take seconds on mobile.
4. **No result count or `aria-live` announcement** when filtering changes the grid. A screen reader gets no feedback.
5. **The lightbox doesn't show file info** (format, size) though `size` is in the manifest. This is useful before a 20 MB download on mobile data.

## 5. CI, quality and data freshness

1. **CI deploys without checks.** `.github/workflows/nextjs.yml` runs install → generate-manifest → build → deploy. It has no lint, no typecheck and no tests, so a broken UI can deploy straight to the live demo.
2. **Data only refreshes on push to `main`.** There is no `schedule` or `repository_dispatch` trigger, so new wallpapers in the source repo appear only when someone pushes here.
3. **Manifest generation failure kills the deploy.** If the GitHub API rate-limits, `generate-manifest` exits 1 (`scripts/generate-manifest.ts:L179–182`) even though a committed manifest exists to fall back on.
4. **No tests of any kind** (also noted in `PLAN §10`; P0-02/P0-03 add them).

## 6. Repo hygiene

1. `.gitignore` ignores `CLAUDE.md`/`AGENTS.md` (already tracked, so it has no effect) and `context.md`/`css_context.md` (so the design docs are local-only). Collaborators can't see the design context.
2. `setup.md` clone URL is `YOUR_USERNAME/cozypixels-web` and it says Next 15. The README says Vercel while the live demo is Pages.
3. ~~`project-docs-template/` is a nested git repo inside this repo.~~ Resolved 2026-10-23: folder removed after the docs were generated.

---

## 7. Findings summary

| # | Finding | Why it matters |
|---|---|---|
| 1 | No OG image / per-page metadata / sitemap (§1) | Shared links look bare; galleries are not individually indexable |
| 2 | No LICENSE (§2.1) | Contradicts the stated MIT; blocks forks legally |
| 3 | Takedown notice not prominent; no About page (§2.2–2.3) | The project's own non-negotiable (`ctx §11`) |
| 4 | No deep links (§4.2) | Can't share "this wallpaper" or "Nord › Anime" |
| 5 | Silent, slow downloads (§4.3, §4.5) | Main conversion action feels broken on mobile |
| 6 | CI deploys unchecked; no scheduled refresh; brittle manifest step (§5) | Live breakage; stale content |
| 7 | Missing nice-to-haves: random, copy URL, last-updated, PWA (§3) | Cheap delight; optional |

## 8. Gaps

- No social-preview design exists. A-19 decides it.
- No owner decision on license holder name/year. A-18 decides it.

## 9. Open questions

- Q-10 License text and holder? → A-18
- Q-11 OG image: static or generated per theme? → A-19
- Q-12 Deep-link format? → A-20
- Q-13 How often to refresh the manifest automatically? → A-21
- Q-14 Which nice-to-haves are in scope? → A-22
