# B — Analysis: mobile responsiveness and touch UX

**Project:** CozyPixels Web
**Phase:** UNDERSTAND. This file feeds the development plan, so downstream agents can rely on it without re-reading the sources.
**Scope of this file:** how each screen behaves at phone widths (360–430 px) and on touch input. This covers layout, touch targets, gestures, viewport units and keyboard/focus where it affects mobile.
**Date of analysis:** 2026-10-23

---

## 0. Conventions, sources and coverage

### 0.1 Citation keys

Same as `A_performance.md` §0.1. Screen IDs used across the docs:

| ID | Screen | Code |
|---|---|---|
| SCR-01 | Home | `app/page.tsx` |
| SCR-02 | Theme gallery (`/catppuccin`, `/nord`, `/onedark`) | `app/[theme]/page.tsx`, `theme-gallery.tsx`, `wallpaper-grid.tsx`, `wallpaper-card.tsx` |
| SCR-03 | Lightbox (overlay on SCR-01 featured strip and SCR-02) | `lightbox.tsx` |
| SCR-04 | Header + theme switcher (all pages) | `header.tsx`, `ThemeSwitcher.tsx` |
| SCR-05 | Footer (all pages) | `footer.tsx` |
| SCR-06 | 404 | Next default (no custom page) |
| SCR-07 | About / credits | does not exist yet (D §2.3) |

### 0.2 Source coverage

| Source | Coverage |
|---|---|
| All screen code above | Read in full. |
| Screenshots at phone widths | **Do not exist.** P0-03 adds viewport screenshots; layout claims below come from reading class names and are marked **derived** where behaviour is inferred. |

---

## 1. SCR-01 Home

1. **No hero visual on phones.** The collage is `hidden sm:flex` (`app/page.tsx:L98`). Below 640 px the hero is text plus two full-width buttons only, so the product (wallpapers) is not visible above the fold.
2. **Hero height uses `min-h-[85vh]`** (`L39`). On iOS Safari, `vh` is the large viewport, so the hero overflows behind the URL bar. **derived**
3. **Theme cards stack 1-up until `lg`** (`L138`). Each card's third thumbnail hides at `<sm` and at `lg–xl` (`L174`). Fine, but cards are tall on phones (header + thumbs + footer). **derived**
4. **Featured strip is 2 columns on phones** (`featured-strip.tsx:L27`). The hover overlay ("View") never appears on touch. Tapping works, but there is no affordance. **derived**

## 2. SCR-02 Theme gallery

1. **Grid is 1 column below 640 px** (`wallpaper-grid.tsx:L47`). Each card is a full-width 16/10 image plus a footer, so about 2.5 cards per screen. That means a lot of scrolling through 383–413 items. **derived**
2. **No paging.** All cards render (see A §3.3), so the scroll height on a phone is roughly 400 × ~270 px ≈ 100,000 px. **derived**
3. **Filter bar is not sticky.** It scrolls away (`theme-gallery.tsx:L28`), so changing category means scrolling back to the top.
4. **Chip row** is a horizontal scroller with a custom WebKit scrollbar and `pb-3` (`L51`). There is no scroll-snap, no edge fade to hint more chips, and no counts.
5. **Touch targets below 44 px.** These are the card download button `h-8 w-8` = 32 px (`wallpaper-card.tsx:L71`), the chips at `py-1.5` + text-sm ≈ 32 px tall (`theme-gallery.tsx:L55`), and the search clear button at an icon-only 16 px hit area with no `aria-label` (`L41–46`).
6. **Search matches filename only** (`theme-gallery.tsx:L19`). The README claims subcategory search too.
7. **Page title is a bare `h1`** with no description or count (`app/[theme]/page.tsx:L34`).
8. **Hover lift (`whileHover`) does nothing useful on touch.** On some mobile browsers a first tap can trigger hover state. **derived**

## 3. SCR-03 Lightbox

1. **No swipe.** Navigation is arrow buttons + keyboard only (`lightbox.tsx:L44–52, L82–99`).
2. **Arrow buttons overlap the image on phones.** They are absolutely positioned at `left-4`/`right-4`, vertically centred, over a `max-w-[95vw]` image (`L85, L94, L102`).
3. **`vh` units** (`max-h-[90vh]`, `max-h-[75vh]`, `L102–110`) cause the image and actions to shift when the iOS toolbar collapses. **derived**
4. **Actions sit under the image**, centred, with wrapping (`L117`). They are reachable but not thumb-anchored. There is no safe-area padding for notched phones.
5. **Loads the full original** (`L105–112`). A 4 MB PNG on mobile data means a long blank wait with no loading state.
6. **No focus management.** Focus does not move into the dialog, is not trapped, and is not restored on close.
7. **Body scroll lock uses `overflow: hidden`** (`L55–60`), but Lenis keeps running underneath (`SmoothScroll.tsx`). Wheel scroll may still move the page on desktop. **derived**

## 4. SCR-04 Header and theme switcher

1. **Mobile theme menu** (`ThemeSwitcher.tsx:L43–79`) closes on outside `mousedown` only. There is no Escape key handling, no `aria-expanded`, and the active option has no `aria-pressed`/`aria-checked`.
2. **Header height 64 px, sticky, `backdrop-blur-md`.** There is no safe-area top inset for standalone/PWA use. This is low priority.
3. Desktop segmented control has no `aria-pressed` on the active theme (`L28–38`).

## 5. SCR-05 Footer, SCR-06 404

1. Footer stacks correctly on phones (`footer.tsx:L24`).
2. 404 is the unstyled Next default. It does not inherit the cozy look.

---

## 6. Findings summary

| # | Finding | Why it matters for the build |
|---|---|---|
| 1 | 1-column grid + no paging (§2.1–2.2) | Endless scroll; 2 columns + paging fixes both |
| 2 | Lightbox has no swipe, overlapping arrows, vh units (§3.1–3.3) | Core mobile journey (view → download) feels desktop-only |
| 3 | Touch targets 16–32 px (§2.5) | Mis-taps; accessibility |
| 4 | Filter bar scrolls away (§2.3) | Category switching needs scroll-to-top |
| 5 | No hero visual on phones (§1.1) | First impression lacks wallpapers |
| 6 | Focus/ARIA gaps in lightbox and theme menu (§3.6, §4.1) | Keyboard + screen-reader users |

## 7. Gaps

- No target-device list or viewport list. A-12 decides it.
- No screenshots of current mobile rendering. P0-03 captures them.

## 8. Open questions

- Q-05 How many grid columns on phones? → A-02
- Q-06 Infinite scroll or "Load more" button? → A-03
- Q-07 Should the mobile hero show wallpapers? → A-15
