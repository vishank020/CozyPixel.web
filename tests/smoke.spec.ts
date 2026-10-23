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
    test(`${route} renders without horizontal overflow or React errors`, async ({ page }) => {
      const reactErrors: string[] = [];
      page.on("pageerror", (err) => reactErrors.push(err.message));
      page.on("console", (msg) => {
        // Blocked images log network errors; only React/hydration problems matter here
        if (msg.type() === "error" && /react|hydrat/i.test(msg.text())) reactErrors.push(msg.text());
      });

      await blockImages(page);
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.waitForLoadState("load");
      expect(reactErrors).toEqual([]);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(overflow, "page is wider than the viewport").toBeLessThanOrEqual(0);
    });
  }
});

test("hidden hero collage never downloads on phones", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "collage is only hidden below sm");
  const requested = new Set<string>();
  page.on("request", (req) => requested.add(req.url()));
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(1_000);

  const collage = page.locator('img[alt$=" preview"]');
  await expect(collage).toHaveCount(3);
  const candidates = await collage.evaluateAll((imgs) =>
    imgs.flatMap((img) =>
      (img.getAttribute("srcset") ?? "").split(", ").map((entry) => entry.split(" ")[0])
    )
  );
  // A collage URL may legitimately be requested if a visible image uses the same URL
  // (the hero reuses a theme-card sample), so only count URLs no visible image shows.
  const visibleSrcs = await page.locator("img").evaluateAll((imgs) =>
    imgs.filter((img) => img.checkVisibility()).map((img) => (img as HTMLImageElement).currentSrc)
  );
  const wasted = candidates.filter((url) => requested.has(url) && !visibleSrcs.includes(url));
  expect(wasted, "hidden collage images were downloaded").toEqual([]);
});

test("theme grid renders in batches of 24 and loads more on scroll", async ({ page }) => {
  await blockImages(page);
  await page.goto("/catppuccin");
  const cards = page.getByRole("button", { name: /^View / });
  await expect(cards).toHaveCount(24);
  await expect(page.getByText(/^Showing 24 of \d+$/)).toBeVisible();

  // The lightbox still browses the whole theme, not just the rendered batch
  await cards.first().click();
  await expect(page.getByRole("dialog").getByText(/^1 \/ 383$/)).toBeVisible();
  await page.keyboard.press("Escape");

  // Batches keep chaining while the sentinel is near the viewport, so only assert growth
  await page.getByText(/^Showing 24 of/).scrollIntoViewIfNeeded();
  await expect(cards).not.toHaveCount(24);
  const afterScroll = await cards.count();

  await page.getByRole("button", { name: "Load more" }).click();
  await expect.poll(() => cards.count()).toBeGreaterThan(afterScroll);
});

test("lightbox opens, navigates and closes", async ({ page }) => {
  await blockImages(page);
  await page.goto("/onedark");

  await page.getByRole("button", { name: /^View / }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/^1 \/ \d+$/)).toBeVisible();

  // The next wallpaper is preloaded at view size through the resizer, never as an original
  const preloads = page.locator('link[rel="preload"][as="image"][imagesrcset*="wsrv.nl"]');
  await expect(preloads).not.toHaveCount(0);

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

  // Hydrating with a non-default saved theme must not trigger React errors
  const reactErrors: string[] = [];
  page.on("pageerror", (err) => reactErrors.push(err.message));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "nord");
  await page.waitForLoadState("load");
  expect(reactErrors).toEqual([]);
});

test("saved theme and content paint before any app JS runs", async ({ page }) => {
  await blockImages(page);
  // Only the inline head script may run: every Next.js chunk is blocked
  await page.route(/\/_next\/static\/chunks\/.*\.js$/, (route) => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem("cozypixels-theme", "nord");
    localStorage.setItem("cozypixels-mode", "light");
  });

  await page.goto("/catppuccin");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "nord");
  await expect(html).toHaveAttribute("data-mode", "light");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^View / }).first()).toBeVisible();
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
