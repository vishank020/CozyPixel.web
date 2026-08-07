export type ThemeName = "Catppuccin" | "Nord" | "One Dark";

export interface Wallpaper {
  id: string;
  theme: ThemeName;
  subcategory: string;
  filename: string;
  path: string;
  extension: string;
  size?: number;
}

export interface Manifest {
  generatedAt: string;
  sourceRepo: string;
  sourceBranch: string;
  sourceCommit?: string;
  total: number;
  themes: Record<
    string,
    {
      count: number;
      subcategories: Record<string, number>;
    }
  >;
  wallpapers: Wallpaper[];
}
