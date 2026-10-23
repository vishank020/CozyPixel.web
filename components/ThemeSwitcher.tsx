"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useTheme } from "@/components/theme-provider";
import { themes, ThemeId } from "@/lib/themes";
import { Moon, Sun, Palette } from "lucide-react";

// ::after widens the tap area to 44px without changing how the control looks (PLAN A-10)
const TAP_AREA = "relative after:absolute after:-inset-1 after:content-['']";

export function ThemeSwitcher() {
  const { theme, setTheme, toggleMode, resolvedMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // While open: close on a tap/click outside, or on Escape (focus back to the toggle)
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {/* Desktop view - inline row */}
      <div role="group" aria-label="Theme" className="hidden md:flex rounded-lg border border-border bg-card p-1">
        {(Object.keys(themes) as ThemeId[]).map((id) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            aria-pressed={theme === id}
            className={`relative after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              theme === id
                ? "bg-primary text-primary-foreground shadow-sm scale-100"
                : "text-muted-foreground hover:text-foreground scale-95 hover:scale-100"
            }`}
          >
            {themes[id].name}
          </button>
        ))}
      </div>

      {/* Mobile view - dropdown palette */}
      <div className="relative md:hidden" ref={menuRef}>
        <button
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Theme menu"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-controls={menuId}
          className={`${TAP_AREA} p-2.5 rounded-lg border border-border bg-card transition-colors ${
            isOpen ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <Palette className="h-4 w-4" />
        </button>

        {isOpen && (
          <div
            id={menuId}
            className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border/50 bg-background/95 backdrop-blur-md p-2 shadow-xl z-50"
          >
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-3 pb-2 pt-1">
              Select Theme
            </div>
            <div role="group" aria-label="Theme" className="flex flex-col gap-1">
              {(Object.keys(themes) as ThemeId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setTheme(id);
                    setIsOpen(false);
                  }}
                  aria-pressed={theme === id}
                  className={`w-full min-h-11 text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    theme === id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {themes[id].name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mode toggle - Always visible */}
      <button
        onClick={toggleMode}
        className={`${TAP_AREA} p-2.5 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95`}
        aria-label="Toggle light/dark mode"
        title={resolvedMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {resolvedMode === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
