# C — Analysis: visual style (what to keep, what to polish)

**Project:** CozyPixels Web
**Phase:** UNDERSTAND. This file feeds the development plan, so downstream agents can rely on it without re-reading the sources.
**Scope of this file:** the visual identity as built (`globals.css`, components) and as documented (`css_context.md`). It sorts out what defines the identity (keep), where it is inconsistent or inaccessible (fix), and where it could be richer without changing character (polish).
**Date of analysis:** 2026-10-23

---

## 0. Conventions, sources and coverage

### 0.1 Citation keys

Same as `A_performance.md` §0.1, plus `css §n` = `css_context.md` section n.

### 0.2 Source coverage

| Source | Coverage |
|---|---|
| `app/globals.css` | Read in full; contrast computed for all 6 palettes (`BL §4`). |
| `css_context.md` | Read in full. |
| All components | Read in full for class usage. |
| Rendered screenshots | **Do not exist.** P0-03 captures them, and visual claims are from code. |

---

## 1. The identity (KEEP, do not change)

These define "the current style" the owner wants kept (`idea.md`):

1. **Three palettes × light/dark** via `data-theme` / `data-mode` on `<html>` (`globals.css:L62–219`, `css §2`).
2. **Semantic tokens only** (`bg-background`, `text-primary`…), mapped in `@theme` (`globals.css:L3–24`, `css §5`).
3. **Glass header**: `bg-background/80 backdrop-blur-md` (`header.tsx:L8`, `css §4A`).
4. **Film-grain noise overlay** (`globals.css:L222–230`, `css §4C`).
5. **Soft primary glows** behind the hero (`app/page.tsx:L31–34`, `css §4B`).
6. **Rounded, bordered cards** (`rounded-xl` to `rounded-[2.5rem]`) with lift-on-hover and a primary-tinted shadow (`css §4D`).
7. **Hero**: "Soft colors for quiet screens." headline with gradient span, pill badge and the tilted, blurred three-image collage.
8. **Gentle motion**: stagger-in hero, card lift with spring feel (recent commit `8bc5acd` deliberately added framer-motion hovers).
9. **Inter** via `next/font` (`app/layout.tsx:L6`).

## 2. Accessibility defects in the palettes (FIX)

1. **Catppuccin light `primary` is the Mocha mauve.** `globals.css:L70` uses `267 84% 81%` in Latte. The real Latte mauve is `#8839ef` ≈ `266 85% 58%`. Result: `text-primary` on background is **1.80:1** (`BL §4`). This affects the "Pixels" in the logo, footer links, "Support the project", badges and the hero gradient text.
2. **Nord dark `primary` text is 3.03:1** (`BL §4`). It uses Frost `nord10`-ish `213 32% 52%`. Nord's lighter Frost `nord8` (`#88c0d0` ≈ `193 43% 67%`) is the usual accent on Polar Night. **derived**
3. **Nord light `primary` text 3.69:1** and **One Dark light 4.05:1**. Both are below 4.5 for small text (`BL §4`).
4. **Catppuccin light `muted-foreground` is 3.97:1** (`BL §4`). This is used for all secondary text.
5. Buttons (`primary-foreground` on `primary`) pass everywhere (≥ 4.05).

## 3. Inconsistencies (FIX)

1. **Radius scale is ad hoc**: `rounded-lg`, `xl`, `2xl`, `3xl`, `[2.5rem]`, `full` all appear. `--radius` (`globals.css:L52`) is defined but only referenced by the unused `tailwind.config.ts`.
2. **Hard-coded colors in the lightbox**: `bg-black/90`, `text-white`, `bg-white/10` (`lightbox.tsx:L64–75`). This is acceptable for a photo viewer, but it is the only place tokens are bypassed. Keep it dark but tint it with `--overlay` hue. **derived**
3. **Two `ThemeSwitcher` layouts** with different active styles: solid primary on desktop vs `bg-primary/10 text-primary` on mobile (`ThemeSwitcher.tsx:L31–34` vs `L67–71`).
4. **Theme page header** is a plain `text-3xl` `h1` (`app/[theme]/page.tsx:L34`), much flatter than the home page. The gallery pages are where users spend their time.
5. **Focus styles vary**: some elements use `focus-visible:ring-ring`, some `ring-primary`, some `ring-white/50`, and chips, theme buttons and the search clear button have none.
6. **Heading sizes jump** at one breakpoint (`text-5xl md:text-7xl`, `app/page.tsx:L49`) instead of scaling fluidly. On 360 px, `text-5xl` (48 px) for "Soft colors for quiet screens." wraps to 4 lines. **derived**
7. **`prefers-reduced-motion` is ignored** everywhere (framer-motion, Lenis, CSS transitions, `animate-pulse`).

## 4. Polish opportunities (same character, richer)

1. **Image loading states**: cards show an empty `bg-card` box until a multi-MB image arrives. A theme-tinted shimmer and a fade-in on load would make the wait feel intentional.
2. **Theme page hero**: title, palette description (`lib/themes.ts`), wallpaper count, subcategory count and a row of palette swatches. This gives each gallery its own mood.
3. **Chips with counts** (`manifest.themes[x].subcategories` already has them).
4. **Mobile hero visual**: a single tilted card or a short auto-scrolling strip, so phones see wallpapers above the fold.
5. **Card footer**: format names nicely (strip `ign_`/`od_` prefixes, replace `-`/`_` with spaces) and use a 44 px download button that blends into the footer.
6. **Styled 404 and empty state**: reuse the "Free forever" panel style.
7. **Per-theme `<meta name="theme-color">`** so the mobile browser chrome matches the palette.

---

## 5. Findings summary

| # | Finding | Why it matters for the build |
|---|---|---|
| 1 | Identity elements listed (§1) | Hard constraint: polish must not remove any of them |
| 2 | Catppuccin Latte primary 1.80:1 (§2.1) | Visible defect in the default palette's light mode |
| 3 | Other sub-4.5 text tokens (§2.2–2.4) | Token-only fix; no component changes |
| 4 | Radius/focus/heading inconsistencies (§3) | Small tokens + utilities pass |
| 5 | Flat theme pages, empty loading boxes (§4) | Where the "improve style" effort pays off most |

## 6. Gaps

- No design reference beyond `css_context.md`. The palette specs (catppuccin.com, nordtheme.com) are the reference for token fixes.

## 7. Open questions

- Q-08 Change palette tokens to official values, or tweak lightness only? → A-14
- Q-09 What does "improve style" include? → A-15
