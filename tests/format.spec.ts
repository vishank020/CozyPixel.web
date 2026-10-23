import { test, expect } from "@playwright/test";
import { displayName, wallpaperAlt } from "../lib/format";

const cases: Array<[string, string]> = [
  ["abstract-swirls.jpg", "Abstract Swirls"],
  ["ign_MaterialMountains-2.png", "Material Mountains 2"],
  ["ign_FluidifiedST-1.png", "Fluidified ST 1"],
  ["ign_mojave_dynamic_14.jpeg", "Mojave Dynamic 14"],
  ["ign_ferrari3.png", "Ferrari 3"],
  ["ign_vaporWave.png", "Vapor Wave"],
  ["od_pacman_arcade.png", "Pacman Arcade"],
  ["od_stamina+.png", "Stamina+"],
  ["dominik-mayer-25.jpg", "Dominik Mayer 25"],
  // Only the known source tags are stripped; other short prefixes are real words
  ["cat_nap.png", "Cat Nap"],
  ["551098957-3e9e1c05-0c5b-48c3-aa29-b1d2e9bc0248.png", "Untitled wallpaper"],
  ["3d-model.jpg", "3d Model"],
];

test.describe("display names", () => {
  for (const [filename, expected] of cases) {
    test(`${filename} → ${expected}`, () => {
      expect(displayName(filename)).toBe(expected);
    });
  }

  test("alt text names the wallpaper, theme and category", () => {
    expect(
      wallpaperAlt({ filename: "ign_nordic_rose.png", theme: "Nord", subcategory: "Abstract & Artistic" })
    ).toBe("Nordic Rose, Nord Abstract & Artistic wallpaper");
  });
});
