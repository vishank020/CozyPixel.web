export type ThemeId = "catppuccin" | "nord" | "onedark";
export type Mode = "light" | "dark" | "system";

export interface Swatch {
  name: string;
  hex: string;
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  defaultMode: Mode;
  /** Signature colours from the official palette, shown on the theme's page whatever the active site theme */
  swatches: Swatch[];
}

export const themes: Record<ThemeId, ThemeMeta> = {
  catppuccin: {
    id: "catppuccin",
    name: "Catppuccin",
    description: "Warm latte-inspired pastels",
    defaultMode: "dark",
    swatches: [
      { name: "Mauve", hex: "#cba6f7" },
      { name: "Pink", hex: "#f5c2e7" },
      { name: "Peach", hex: "#fab387" },
      { name: "Green", hex: "#a6e3a1" },
      { name: "Blue", hex: "#89b4fa" },
    ],
  },
  nord: {
    id: "nord",
    name: "Nord",
    description: "Arctic, north-bluish color palette",
    defaultMode: "dark",
    swatches: [
      { name: "Frost", hex: "#88c0d0" },
      { name: "Frost Blue", hex: "#5e81ac" },
      { name: "Aurora Red", hex: "#bf616a" },
      { name: "Aurora Yellow", hex: "#ebcb8b" },
      { name: "Aurora Green", hex: "#a3be8c" },
    ],
  },
  onedark: {
    id: "onedark",
    name: "One Dark",
    description: "Comfortable dark theme",
    defaultMode: "dark",
    swatches: [
      { name: "Blue", hex: "#61afef" },
      { name: "Purple", hex: "#c678dd" },
      { name: "Green", hex: "#98c379" },
      { name: "Yellow", hex: "#e5c07b" },
      { name: "Red", hex: "#e06c75" },
    ],
  },
};

export const THEME_STORAGE_KEY = "cozypixels-theme";
export const MODE_STORAGE_KEY = "cozypixels-mode";
