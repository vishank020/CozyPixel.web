import { test, expect, type Page } from "@playwright/test";

const ROUTES = ["/", "/catppuccin", "/nord", "/onedark"];

// Wallpapers come from third-party CDNs; functional checks don't need the pixels
async function blockImages(page: Page) {
  await page.route(/\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i, (route) => route.abort());
  await page.route(/wsrv\.nl/, (route) => route.abort());
}

function isMobile(projectName: string) {
  return projectName.startsWith("mobile");
}

test.describe("every route", () => {
  for (const route of ROUTES) {
    test(`${route} renders without horizontal overflow`, async ({ page }) => {
      await blockImages(page);
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(overflow, "page is wider than the viewport").toBeLessThanOrEqual(0);
    });
  }
});

test("lightbox opens, navigates and closes", async ({ page }) => {
  await blockImages(page);
  await page.goto("/onedark");

  await page.getByRole("button", { name: /^View / }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/^1 \/ \d+$/)).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByText(/^2 \/ \d+$/)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("theme choice survives a reload", async ({ page }, testInfo) => {
  await blockImages(page);
  await page.goto("/");

  if (isMobile(testInfo.project.name)) {
    await page.getByRole("button", { name: "Theme menu" }).click();
  }
  await page.getByRole("button", { name: "Nord", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "nord");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "nord");
});

test("screenshots for visual review", async ({ page }, testInfo) => {
  // Loads real images from third-party CDNs, so allow generous time
  test.setTimeout(150_000);
  for (const route of ROUTES) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    // Give above-the-fold images a moment; never fail on slow CDNs
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    const name = route === "/" ? "home" : route.slice(1);
    await page.screenshot({
      path: `.perf/shots/${testInfo.project.name}/${name}.png`,
      fullPage: route === "/",
    });
  }
});
