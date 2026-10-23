import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke suite against the static build (PLAN §10).
 * Run `pnpm build:preview` first; the web server just serves out/.
 * Locally it uses the installed Chrome; CI sets PW_CHANNEL="" to use Playwright's Chromium.
 */
const channel = process.env.PW_CHANNEL ?? "chrome";

// A Pages build (basePath /CozyPixel.web) served at the root loads no JS: fail fast instead of timing out
const indexHtml = join(__dirname, "out", "index.html");
if (existsSync(indexHtml) && readFileSync(indexHtml, "utf-8").includes("/CozyPixel.web/_next/")) {
  throw new Error("out/ is a GitHub Pages build (basePath). Run `pnpm build:preview` first.");
}

export default defineConfig({
  testDir: "./tests",
  outputDir: ".perf/test-results",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    ...(channel ? { channel } : {}),
  },
  projects: [
    {
      name: "mobile-360",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 360, height: 740 },
        ...(channel ? { channel } : {}),
      },
    },
    {
      name: "desktop-1280",
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: "pnpm exec serve out -l 4173 --no-port-switching",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
