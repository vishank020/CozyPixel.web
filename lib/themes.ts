export type ThemeId = "catppuccin" | "nord" | "onedark";
export type Mode = "light" | "dark" | "system";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  defaultMode: Mode;
}

export const themes: Record<ThemeId, ThemeMeta> = {
  catppuccin: {
    id: "catppuccin",
    name: "Catppuccin",
    description: "Warm latte-inspired pastels",
    defaultMode: "dark",
  },
  nord: {
    id: "nord",
    name: "Nord",
    description: "Arctic, north-bluish color palette",
    defaultMode: "dark",
  },
  onedark: {
    id: "onedark",
    name: "One Dark",
    description: "Comfortable dark theme",
    defaultMode: "dark",
  },
};

export const THEME_STORAGE_KEY = "cozypixels-theme";
export const MODE_STORAGE_KEY = "cozypixels-mode";
