"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ThemeId,
  Mode,
  themes,
  THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeId;
  mode: Mode;
  resolvedMode: "light" | "dark"; // actual applied mode
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeId;
  defaultMode?: Mode;
}

export function ThemeProvider({
  children,
  defaultTheme = "catppuccin",
  defaultMode = "system",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme);
  const [mode, setModeState] = useState<Mode>(defaultMode);
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  // Resolve the actual light/dark value
  const resolveMode = useCallback((currentMode: Mode): "light" | "dark" => {
    if (currentMode === "system") return getSystemMode();
    return currentMode;
  }, []);

  // Apply attributes to <html>
  const applyTheme = useCallback(
    (nextTheme: ThemeId, nextMode: Mode) => {
      const root = document.documentElement;
      const resolved = resolveMode(nextMode);

      root.setAttribute("data-theme", nextTheme);
      root.setAttribute("data-mode", resolved);
      root.classList.toggle("dark", resolved === "dark");

      setResolvedMode(resolved);
    },
    [resolveMode]
  );

  // Initial load from localStorage + system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    const storedMode = localStorage.getItem(MODE_STORAGE_KEY) as Mode | null;

    const initialTheme =
      storedTheme && themes[storedTheme] ? storedTheme : defaultTheme;
    const initialMode = storedMode ?? defaultMode;

    setThemeState(initialTheme);
    setModeState(initialMode);
    applyTheme(initialTheme, initialMode);
    setMounted(true);
  }, [defaultTheme, defaultMode, applyTheme]);

  // Listen to system preference changes when mode === "system"
  useEffect(() => {
    if (mode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(theme, "system");

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, theme, applyTheme]);

  const setTheme = useCallback(
    (next: ThemeId) => {
      setThemeState(next);
      localStorage.setItem(THEME_STORAGE_KEY, next);
      applyTheme(next, mode);
    },
    [mode, applyTheme]
  );

  const setMode = useCallback(
    (next: Mode) => {
      setModeState(next);
      localStorage.setItem(MODE_STORAGE_KEY, next);
      applyTheme(theme, next);
    },
    [theme, applyTheme]
  );

  const toggleMode = useCallback(() => {
    const next = resolvedMode === "dark" ? "light" : "dark";
    setMode(next);
  }, [resolvedMode, setMode]);

  const value = useMemo(
    () => ({
      theme,
      mode,
      resolvedMode,
      setTheme,
      setMode,
      toggleMode,
    }),
    [theme, mode, resolvedMode, setTheme, setMode, toggleMode]
  );

  // Prevent hydration mismatch flash
  if (!mounted) {
    return (
      <ThemeContext.Provider value={value}>
        <div style={{ visibility: "hidden" }} aria-hidden>
          {children}
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
