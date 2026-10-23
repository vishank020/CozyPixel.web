import { themes, THEME_STORAGE_KEY, MODE_STORAGE_KEY, type ThemeId, type Mode } from "./themes";

// The <html> attributes are the source of truth for the active theme (PLAN A-06).
// An inline script applies them before first paint; React only reads and updates them.

export const DEFAULT_THEME: ThemeId = "catppuccin";
export const DEFAULT_MODE: Mode = "system";

/**
 * Applies the stored (or default) theme to <html>. Serialised into an inline <head>
 * script, so it must be self-contained: no closures, only its arguments.
 */
function applyStoredTheme(
  themeKey: string,
  modeKey: string,
  themeIds: string[],
  defaultTheme: string,
  defaultMode: string
) {
  const root = document.documentElement;
  let theme = defaultTheme;
  let mode = defaultMode;
  try {
    const storedTheme = localStorage.getItem(themeKey);
    const storedMode = localStorage.getItem(modeKey);
    if (storedTheme && themeIds.indexOf(storedTheme) !== -1) theme = storedTheme;
    if (storedMode === "light" || storedMode === "dark" || storedMode === "system") mode = storedMode;
  } catch {
    // localStorage unavailable (privacy mode): keep defaults
  }
  const resolved =
    mode === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-mode", resolved);
  root.classList.toggle("dark", resolved === "dark");

  // Match the mobile browser chrome to the page background
  const bg = getComputedStyle(root).getPropertyValue("--background").trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (bg && meta) meta.setAttribute("content", "hsl(" + bg + ")");
}

const ARGS = [
  THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  Object.keys(themes),
  DEFAULT_THEME,
  DEFAULT_MODE,
] as const;

/** Inline script for <head>: runs during HTML parsing, before first paint */
export const themeScript = `(${applyStoredTheme.toString()}).apply(null, ${JSON.stringify(ARGS)})`;

export function applyThemeFromStorage() {
  applyStoredTheme(...ARGS);
}

const SWITCH_TRANSITION_MS = 300;
let switchTimer: ReturnType<typeof setTimeout> | undefined;

/** Applies a theme change with a short color cross-fade (see .theme-switching in globals.css) */
export function applyThemeWithTransition() {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  applyThemeFromStorage();
  clearTimeout(switchTimer);
  switchTimer = setTimeout(() => root.classList.remove("theme-switching"), SWITCH_TRANSITION_MS);
}
