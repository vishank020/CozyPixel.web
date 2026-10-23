# docs/source — frozen inputs

Everything this round of work is based on, **untouched**. Analysis files cite these.

## Rules

1. **Never edit files in this folder.** If a source turns out wrong, record it as a finding in
   `docs/analysis/`, not as a fix here.
2. `context.md` and `css_context.md` live at the repo root (they are git-ignored agent context
   files). Treat them as frozen sources too. If the design system changes, update `css_context.md`
   only in story H-04, and log it in `TRACKER.md` §4.
3. New measurements never overwrite the baseline. They go in `TRACKER.md`.

## MANIFEST

| File | What it is | Recorded | Agent-readable? |
|---|---|---|---|
| `docs/source/idea.md` | The owner's goal for this round (fast, mobile, style polish) | 2026-10-23 | yes |
| `docs/source/baseline-2026-10-23.md` | "Before" measurements: image weights, build sizes, contrast | 2026-10-23 | yes |
| `context.md` (repo root) | Original vision, constraints ($0, images stay on GitHub), architecture | 2026-08-07 | yes |
| `css_context.md` (repo root) | Design system as documented: tokens, glass, noise, hover states | 2026-08-07 | yes |
| Code at commit `566ffac` | The app as it stood when the goal was set | 2026-10-23 | yes |
