# CozyPixels – UI & CSS Context Guide

This is the design-system reference for CozyPixels: how the palettes, glass, noise and motion are built, and how to reuse them. It matches `app/globals.css`, `lib/theme-dom.ts` and `components/` as of October 2026 (Wave 5 + Hardening).

## 1. Architecture Overview

- **CSS framework**: [Tailwind CSS v4](https://tailwindcss.com/) — CSS-first configuration, no `tailwind.config.ts`.
- **Theme management**: `<html data-theme data-mode>` attributes, written by a tiny inline script **before first paint**. React reads them through `useSyncExternalStore` (`components/theme-provider.tsx`); it never owns the initial state, so there is no flash of the wrong theme.
- **Icons**: `lucide-react`.
- **Font**: Inter, self-hosted at build time with `next/font/google` and exposed as `--font-sans`.
- **Motion**: CSS transitions and keyframes only — no animation library. Lenis adds desktop smooth scrolling and is downloaded lazily, only on `(pointer: fine)` without reduced motion.
- **Components**: no UI kit. Semantic Tailwind utilities plus a few small CSS classes (`card-lift`, `press-pop`, `theme-noise`, `img-shimmer`, `custom-scrollbar`).

The site is a static export (`output: "export"`), so this all ships as HTML + CSS + JS chunks. There is no runtime CSS-in-JS.

---

## 2. The Theme Engine

Two attributes on `<html>` encode the choice:

```html
<html data-theme="catppuccin" data-mode="dark">
```

- `data-theme`: `catppuccin` | `nord` | `onedark`
- `data-mode`: `light` | `dark` (already resolved; `system` is stored separately)

The attributes are the source of truth. An inline `<head>` script (serialised from `lib/theme-dom.ts`) reads `localStorage` and the OS `prefers-color-scheme`, then sets both attributes before the first paint. React hydrates from the same attributes, so the server HTML and the client agree.

### Reading and updating

`components/theme-provider.tsx` wraps a `useSyncExternalStore` around the DOM:

- `subscribe` also listens to `matchMedia("(prefers-color-scheme: dark)")` while the mode is `system`.
- `setTheme` / `setMode` persist the choice, call `applyThemeWithTransition()`, then notify subscribers.
- Storage keys: `cozypixels-theme` and `cozypixels-mode` (see `lib/themes.ts`).

`useLayoutEffect` re-applies the stored theme once on mount (Strict Mode remounts reset `<html>` in dev) and adds the `hydrated` class, which lets JS-driven effects such as image fade-in run without ever hiding content from no-JS visitors.

### Variables and `@theme`

Palette values are raw HSL triplets, so Tailwind opacity modifiers work (`bg-primary/50`):

```css
:root {
  --background: 40 33% 98%;
  --foreground: 240 10% 10%;
  --primary: 250 65% 60%;
  /* ... */
}

[data-theme="catppuccin"][data-mode="dark"] {
  --background: 240 21% 15%;
  --foreground: 226 64% 88%;
  --primary: 267 84% 81%; /* Mauve */
  --card: 240 21% 12%;    /* Mantle */
  /* ... */
}
```

`@theme` maps them to Tailwind colours once:

```css
@import "tailwindcss";

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-card: hsl(var(--card));
  /* ... */
}
```

Components only use semantic names (`bg-background`, `text-muted-foreground`, `border-border`), so a palette swap needs no component change.

### Contrast

Every text/token pairing in all six palettes is checked by `pnpm contrast` (`scripts/contrast.mjs`). A few tokens are deliberately darker than the upstream palette — for example Nord light `--primary: 213 32% 45%` and Catppuccin Latte `--muted-foreground: 233 13% 41%` — because the original values failed AA on a light background. Keep the script green when editing colours.

### Smooth switching, without a permanent `*` rule

A global `* { transition: ... }` would override every component's own transition, so the cross-fade is scoped to the moment of a switch:

```css
@media (prefers-reduced-motion: no-preference) {
  html.theme-switching *,
  html.theme-switching *::before,
  html.theme-switching *::after {
    transition:
      background-color 0.25s ease,
      border-color 0.25s ease,
      color 0.2s ease,
      fill 0.2s ease,
      box-shadow 0.25s ease !important;
  }
}
```

`applyThemeWithTransition()` adds `theme-switching`, applies the new attributes, and removes the class after 300 ms (`lib/theme-dom.ts`). It therefore exists only during a switch, and only when the visitor has not asked for reduced motion.

---

## 3. The Color Palettes

Three developer-centric themes, each with tuned light and dark variants:

1. **Catppuccin (Latte / Mocha)**
   - **Vibe**: soft, pastel, warm.
   - **Characteristics**: a slightly purple/blue-tinted dark background (Mocha) and warm, creamy whites (Latte). Accents are soft Mauve and Pink.

2. **Nord**
   - **Vibe**: arctic, cold, clean, professional.
   - **Characteristics**: built around "Polar Night" (dark bluish-grey) and "Snow Storm" (icy white). Accents are "Frost" blues and Aurora colours. Light-mode primary is darkened for readable buttons.

3. **One Dark**
   - **Vibe**: classic hacker, vibrant, high-contrast.
   - **Characteristics**: deep neutral greys with punchy syntax colours (cyan, purple, red).

The light palettes are first-class: every component must be checked in both modes, not just in dark.

---

## 4. Key Visual Components & Styles

### A. Glassmorphism

Frosted glass is reserved for fixed chrome:

- **Header**: `bg-background/80 backdrop-blur-md`
- **Theme dropdown**: `bg-background/95 backdrop-blur-md shadow-xl`
- **Lightbox chrome**: translucent background plus `backdrop-blur`
- **Overlays on cards**: `bg-overlay` (an HSL variable with alpha), no blur

Rule of thumb: glass on fixed chrome (header, menus, lightbox), never on scrolling content where it would force continuous repaints.

### B. Ambient glows

Decorative blurred orbs sit behind the theme hero:

```tsx
<div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl sm:h-80 sm:w-80" />
```

They are absolutely positioned, `pointer-events-none`, coloured with the active `primary`, and static — the old `animate-pulse` was removed (calmer, and less paint work).

### C. The "cozy" film grain

One fixed SVG-noise layer on `<body>`, no image request and no JavaScript:

```css
.theme-noise::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* feTurbulence fractalNoise */
  pointer-events: none;
  z-index: 50;
  opacity: 0.4;
}
```

It breaks up harsh gradients and makes flat colours feel tactile.

### D. Cards and motion

All interactions are CSS; there is no `framer-motion`.

- **Lift**: `.card-lift` uses a spring ease and only runs under `(hover: hover)` with motion allowed:

  ```css
  .card-lift {
    transition:
      transform 0.45s var(--ease-spring),
      box-shadow 0.3s ease,
      border-color 0.3s ease;
  }
  .card-lift:hover { transform: translateY(-6px); }
  ```

  `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`.

- **Image zoom**: `transition-transform duration-500 group-hover:scale-[1.03]` with `will-change-transform`; the featured strip uses a slower 700 ms / 1.05.
- **Overlay reveal**: `opacity-0 group-hover:opacity-100 transition-opacity duration-300`.
- **Buttons**: `.press-pop` scales to 1.1 on hover and 0.9 while pressed.
- **Image fade-in**: `html.hydrated img[data-fade]` fades from 0 once `data-loaded="true"` (guarded by reduced motion). The likely LCP image opts out.

### E. Radius scale

Use Tailwind's scale plus one custom token:

- `rounded-lg` — controls, lightbox image
- `rounded-xl` — cards, thumbnail frames
- `rounded-2xl` — panels and menus
- `rounded-panel` (`--radius-panel: 2.5rem`) — large hero/CTA panels
- `rounded-full` — chips, pills, icon buttons

Avoid arbitrary `rounded-[…]` values; the only intentional exception is the 10 px filter-chip scrollbar thumb.

### F. Motion and accessibility

- Non-essential animation lives inside `@media (prefers-reduced-motion: no-preference)` or is skipped by the Lenis guard.
- Lenis initialises only on `(pointer: fine)` with motion allowed, and is loaded with `import("lenis")`, so touch devices never download it.
- Focus styles use `ring-ring`; interactive targets are at least 44 px.
- Text contrast is enforced by `pnpm contrast`.

---

## 5. How to Replicate in Another Project

1. **Install**: Tailwind CSS v4, `lucide-react`, and Inter via `next/font`.
2. **Copy the tokens**: the `@theme` block, the `:root` fallback and at least one palette block from `app/globals.css`.
3. **Copy the theme engine**: `lib/theme-dom.ts` (pre-paint script + `applyThemeWithTransition`) and `components/theme-provider.tsx`. Inline the serialised script in `<head>` before the body renders.
4. **Add the atmosphere**: `theme-noise` on `<body>`, the `.theme-switching` rule, `.card-lift` / `.press-pop`, and the image fade-in rules.
5. **Use semantic utilities only** — never hardcoded colours:
   - Layout: `bg-background`, `text-foreground`
   - Surfaces: `bg-card`, `bg-secondary`, `border-border`
   - Text: `text-foreground`, `text-muted-foreground`
   - Accents: `text-primary`, `bg-primary`, `ring-ring`
6. **Verify**: both modes in all palettes, keyboard focus, reduced motion, and a contrast checker (or copy `scripts/contrast.mjs`).
