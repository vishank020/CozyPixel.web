# Idea — the goal of this round of work (frozen)

**Recorded:** 2026-10-23 · **Status:** frozen. Do not edit. Later changes to the goal are appended to
`TRACKER.md` §4 as deviations, never written here.

## The goal, in the owner's words

> "what i am aiming for is to optimise this project to make it fast and more responsive for mobile
> devices, and improve this style keep current style tough but improve it"

## What that means (plain reading, no decisions yet)

1. **Fast**: the site should load and scroll quickly, especially on a phone on mobile data.
2. **More responsive for mobile**: layouts, touch targets, the lightbox, the filters and the
   gallery grid should feel made for a phone, not shrunk from a desktop.
3. **Improve the style, keep the identity**: the current look stays. That means Catppuccin / Nord /
   One Dark palettes, glassy header, film-grain noise, soft glows, rounded cards and gentle motion.
   It gets polished, not replaced.

## Already in scope

- Everything in this repo: `app/`, `components/`, `lib/`, `app/globals.css`, `next.config.ts`.
- Both deploy targets that exist today: GitHub Pages (live demo, `basePath: /CozyPixel.web`) and Vercel.

## Already out of scope

- Changing the wallpaper source. Images stay in `SleepyCatHey/CozyPixels` on GitHub (`context.md` §2).
- Accounts, backend, database, paid services. Cost stays $0 (`context.md` §2).
- A redesign that drops the current palettes or aesthetic.

## Prior material this builds on

- `context.md` (repo root): original vision, constraints and architecture.
- `css_context.md` (repo root): the current design system as documented.
- `docs/source/baseline-2026-10-23.md`: measurements of the code as it stood when this goal was set.
