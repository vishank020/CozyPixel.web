import { test, expect } from "@playwright/test";
import manifest from "../data/manifest.json";

test("every wallpaper id is unique", () => {
  const seen = new Set<string>();
  const duplicates = manifest.wallpapers
    .filter((w) => (seen.has(w.id) ? true : (seen.add(w.id), false)))
    .map((w) => w.path);
  expect(duplicates).toEqual([]);
});
