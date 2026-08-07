"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { themes, ThemeId } from "@/lib/themes";
import { Moon, Sun, Palette } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme, toggleMode, resolvedMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {/* Desktop view - inline row */}
      <div className="hidden md:flex rounded-lg border border-border bg-card p-1">
        {(Object.keys(themes) as ThemeId[]).map((id) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
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
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2.5 rounded-lg border border-border bg-card transition-colors ${
            isOpen ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
          }`}
          aria-label="Theme menu"
        >
          <Palette className="h-4 w-4" />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border/50 bg-background/95 backdrop-blur-md p-2 shadow-xl z-50">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-3 pb-2 pt-1">
              Select Theme
            </div>
            <div className="flex flex-col gap-1">
              {(Object.keys(themes) as ThemeId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setTheme(id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    theme === id
                      ? "bg-primary/10 text-primary font-semibold"
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
        className="p-2.5 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95"
        aria-label="Toggle light/dark mode"
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
