"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { ThemeId, Mode, THEME_STORAGE_KEY, MODE_STORAGE_KEY } from "@/lib/themes";
import { applyThemeFromStorage, DEFAULT_MODE, DEFAULT_THEME } from "@/lib/theme-dom";

interface ThemeContextValue {
  theme: ThemeId;
  mode: Mode;
  resolvedMode: "light" | "dark"; // actual applied mode
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// External store: <html> attributes (set before paint by the head script) +
// localStorage for the chosen mode, which may be "system".
// ---------------------------------------------------------------------------

type Snapshot = Pick<ThemeContextValue, "theme" | "mode" | "resolvedMode">;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function readStoredMode(): Mode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_MODE;
}

let cachedKey = "";
let cachedSnapshot: Snapshot = { theme: DEFAULT_THEME, mode: DEFAULT_MODE, resolvedMode: "dark" };

function getSnapshot(): Snapshot {
  const root = document.documentElement;
  const theme = (root.getAttribute("data-theme") as ThemeId | null) ?? DEFAULT_THEME;
  const resolvedMode = root.getAttribute("data-mode") === "light" ? "light" : "dark";
  const mode = readStoredMode();

  // useSyncExternalStore needs a stable object while nothing changed
  const key = `${theme}|${mode}|${resolvedMode}`;
  if (key !== cachedKey) {
    cachedKey = key;
    cachedSnapshot = { theme, mode, resolvedMode };
  }
  return cachedSnapshot;
}

// Static HTML is rendered with defaults; React swaps to the real values right after hydration
const serverSnapshot: Snapshot = { theme: DEFAULT_THEME, mode: DEFAULT_MODE, resolvedMode: "dark" };

function getServerSnapshot(): Snapshot {
  return serverSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // Follow the OS setting while mode === "system"
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (readStoredMode() === "system") {
      applyThemeFromStorage();
      notify();
    }
  };
  mq.addEventListener("change", onSystemChange);

  return () => {
    listeners.delete(listener);
    mq.removeEventListener("change", onSystemChange);
  };
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable: the choice lasts for this page only
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, mode, resolvedMode } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // In development, Strict Mode's remount resets <html> attributes; re-apply before paint.
  // A no-op in production, where the head script already set them.
  useLayoutEffect(() => {
    applyThemeFromStorage();
    notify();
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    persist(THEME_STORAGE_KEY, next);
    applyThemeFromStorage();
    notify();
  }, []);

  const setMode = useCallback((next: Mode) => {
    persist(MODE_STORAGE_KEY, next);
    applyThemeFromStorage();
    notify();
  }, []);

  const toggleMode = useCallback(() => {
    setMode(resolvedMode === "dark" ? "light" : "dark");
  }, [resolvedMode, setMode]);

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setTheme, setMode, toggleMode }),
    [theme, mode, resolvedMode, setTheme, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
