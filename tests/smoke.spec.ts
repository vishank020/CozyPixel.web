import { test, expect, type Page } from "@playwright/test";
import manifestData from "../data/manifest.json";
import { displayName, formatBytes, formatLabel, slugify } from "../lib/format";
import type { Manifest, Wallpaper } from "../lib/types";

const ROUTES = ["/", "/catppuccin", "/nord", "/onedark", "/about"];

// Collection facts come from the manifest, so the daily data refresh can't break the tests
const manifest = manifestData as Manifest;
const byTheme = (name: string) => manifest.wallpapers.filter((w) => w.theme === name);
const CATPPUCCIN = byTheme("Catppuccin");
const NORD = byTheme("Nord");
const ONE_DARK = byTheme("One Dark");
const countText = (n: number) => `${n} ${n === 1 ? "wallpaper" : "wallpapers"}`;
const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Same matching as the gallery search (components/theme-gallery.tsx)
const matchesSearch = (w: Wallpaper, query: string) =>
  `${displayName(w.filename)} ${w.filename} ${w.subcategory}`.toLowerCase().includes(query.toLowerCase());

// Wallpapers come from third-party CDNs; functional checks don't need the pixels
async function blockImages(page: Page) {
  await page.route(/\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i, (route) => route.abort());
  await page.route(/wsrv\.nl/, (route) => route.abort());
}

function isMobile(projectName: string) {
  return projectName.startsWith("mobile");
}

/**
 * Tappable size of an element in CSS px, including an absolutely positioned ::after
 * that enlarges the hit area without changing the look (PLAN A-10).
 */
function hitBox(el: Element) {
  const rect = el.getBoundingClientRect();
  const after = getComputedStyle(el, "::after");
  if (after.content === "none" || after.position !== "absolute") {
    return { width: rect.width, height: rect.height };
  }
  const px = (v: string) => parseFloat(v) || 0;
  return {
    width: rect.width - px(after.left) - px(after.right),
    height: rect.height - px(after.top) - px(after.bottom),
  };
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

      // Any same-origin 404 (missing chunk, prefetch file, icon…) is a broken build
      const notFound: string[] = [];
      page.on("response", (res) => {
        if (res.status() === 404 && res.url().startsWith("http://localhost:4173")) notFound.push(res.url());
      });

      await blockImages(page);
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.waitForLoadState("load");
      // Let viewport prefetches settle
      await page.waitForTimeout(1500);
      expect(reactErrors).toEqual([]);
      expect(notFound).toEqual([]);

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
  // A collage URL may legitimately be requested when a shown image uses the same URL
  // (hero and theme cards share wallpapers, and loads can still be in flight), so only
  // count URLs that no other displayed image could have asked for.
  const shownUrls = await page.locator('img:not([alt$=" preview"])').evaluateAll((imgs) =>
    imgs
      .filter((img) => img.checkVisibility())
      .flatMap((img) => (img.getAttribute("srcset") ?? "").split(", ").map((entry) => entry.split(" ")[0]))
  );
  const wasted = candidates.filter((url) => requested.has(url) && !shownUrls.includes(url));
  const context = await page.evaluate(() => ({
    width: window.innerWidth,
    shownImgs: [...document.querySelectorAll("img")].filter((i) => i.checkVisibility()).length,
  }));
  expect(wasted, `hidden collage images were downloaded (${JSON.stringify(context)}, ${shownUrls.length} shown URLs)`).toEqual([]);
});

test("phone grid shows two columns with 44px download targets", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "phone layout");
  await blockImages(page);
  await page.goto("/onedark");

  const cards = page.locator(".card-lift");
  await expect(cards.nth(3)).toBeVisible();
  const columns = await cards.evaluateAll((els) =>
    new Set(els.slice(0, 6).map((el) => Math.round(el.getBoundingClientRect().left))).size
  );
  expect(columns).toBe(2);

  const download = page.getByRole("button", { name: /^Download / }).first();
  const box = await download.evaluate(hitBox);
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test("filter bar: category search, counts, sticky and 44px targets", async ({ page }) => {
  await blockImages(page);
  await page.goto("/catppuccin");
  // The live result count, not the hero's wallpaper-count stat
  const count = page.locator('p[aria-live="polite"]');
  await expect(count).toHaveText(countText(CATPPUCCIN.length));

  // Searching a category name finds that category (README promise)
  const category = CATPPUCCIN[CATPPUCCIN.length - 1].subcategory;
  const search = page.getByRole("searchbox", { name: "Search wallpapers" });
  await search.fill(category.toLowerCase());
  const chip = page.getByRole("button", { name: new RegExp(`^${escapeRe(category)} · \\d+$`) });
  await expect(count).toHaveText(countText(CATPPUCCIN.filter((w) => matchesSearch(w, category)).length));

  const clear = page.getByRole("button", { name: "Clear search" });
  const clearBox = await clear.evaluate(hitBox);
  expect(Math.min(clearBox.width, clearBox.height)).toBeGreaterThanOrEqual(44);
  await clear.click();
  await expect(count).toHaveText(countText(CATPPUCCIN.length));

  const chipBox = await chip.evaluate(hitBox);
  expect(chipBox.height).toBeGreaterThanOrEqual(44);

  // Sticky: still pinned under the 64px header after scrolling into the grid
  await page.mouse.wheel(0, 2000);
  await page.evaluate(() => window.scrollTo(0, 2000));
  await expect.poll(() => search.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(140);
  await expect(search).toBeInViewport();

  // Picking a category while scrolled down shows its first results
  await page.getByRole("button", { name: /^All · / }).click();
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".card-lift").first()).toBeInViewport();
});

test("theme grid renders in batches of 24 and loads more on scroll", async ({ page }) => {
  await blockImages(page);
  await page.goto("/catppuccin");
  const cards = page.getByRole("button", { name: /^View / });
  await expect(cards).toHaveCount(24);
  await expect(page.getByText(/^Showing 24 of \d+$/)).toBeVisible();

  // The lightbox still browses the whole theme, not just the rendered batch
  await cards.first().click();
  await expect(page.getByRole("dialog").getByText(`1 / ${CATPPUCCIN.length}`, { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  // Batches keep chaining while the sentinel is near the viewport, so only assert growth
  await page.getByText(/^Showing 24 of/).scrollIntoViewIfNeeded();
  await expect(cards).not.toHaveCount(24);
  const afterScroll = await cards.count();

  await page.getByRole("button", { name: "Load more" }).click();
  await expect.poll(() => cards.count()).toBeGreaterThan(afterScroll);
});

/** A real one-finger horizontal swipe (touch events through Chrome DevTools Protocol) */
async function swipe(page: Page, x: number, y: number, dx: number) {
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", px: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x: px, y }],
    });
  await touch("touchStart", x);
  for (let i = 1; i <= 8; i++) await touch("touchMove", x + (dx * i) / 8);
  await touch("touchEnd", x + dx);
  await cdp.detach();
}

test("lightbox on phones: swipe, bottom bar, no hidden arrows, focus", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "touch layout");
  await blockImages(page);
  await page.goto("/onedark");
  const card = page.getByRole("button", { name: /^View / }).first();
  await card.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
  // Arrows would sit under the image on a phone; swipe replaces them
  await expect(dialog.getByRole("button", { name: "Next wallpaper" })).toBeHidden();
  // Actions are reachable without scrolling
  await expect(dialog.getByRole("button", { name: "Download" })).toBeInViewport();

  const stage = await dialog.getByRole("img").boundingBox();
  const midY = stage!.y + stage!.height / 2;
  await swipe(page, 300, midY, -200);
  await expect(dialog.getByText(/^2 \/ \d+$/)).toBeVisible();
  await swipe(page, 60, midY, 200);
  await expect(dialog.getByText(/^1 \/ \d+$/)).toBeVisible();
  // A short drag is not a swipe
  await swipe(page, 200, midY, -30);
  await expect(dialog.getByText(/^1 \/ \d+$/)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(card).toBeFocused();
});

test("lightbox on desktop: arrows and focus stays inside", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "pointer layout");
  await blockImages(page);
  await page.goto("/onedark");
  await page.getByRole("button", { name: /^View / }).nth(1).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Next wallpaper" }).click();
  await expect(dialog.getByText(/^3 \/ \d+$/)).toBeVisible();

  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
});

test("viewport fits notched screens and the hero uses stable viewport units", async ({ page }) => {
  await blockImages(page);
  await page.goto("/");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);

  const { minHeight, innerHeight } = await page.locator("h1").first().evaluate((h1) => ({
    minHeight: parseFloat(getComputedStyle(h1.closest("section")!).minHeight),
    innerHeight: window.innerHeight,
  }));
  expect(minHeight).toBeCloseTo(innerHeight * 0.85, 0);
});

test("theme menu on phones: expanded state, Escape, outside tap, pressed theme", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "the menu replaces the segmented control on phones");
  await blockImages(page);
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Theme menu" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const items = page.getByRole("group", { name: "Theme" }).getByRole("button");
  await expect(items).toHaveCount(3);
  for (const box of await items.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
    expect(box).toBeGreaterThanOrEqual(44);
  }

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();

  await toggle.click();
  await page.touchscreen.tap(180, 500);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();
  await page.getByRole("button", { name: "One Dark", exact: true }).click();
  await toggle.click();
  await expect(page.getByRole("button", { name: "One Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Nord", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("theme buttons on desktop expose the active theme", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "segmented control is md+");
  await blockImages(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Nord", exact: true }).click();
  await expect(page.getByRole("button", { name: "Nord", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Catppuccin", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("keyboard focus is visible on every control", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "keyboard navigation");
  await blockImages(page);
  for (const route of ["/", "/onedark"]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      const focus = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const s = getComputedStyle(el);
        return {
          label: (el.getAttribute("aria-label") ?? el.textContent ?? el.tagName).trim().slice(0, 30),
          outline: s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2,
          ring: s.boxShadow !== "none",
        };
      });
      expect(focus.outline || focus.ring, `no focus indicator on "${focus.label}" (${route})`).toBe(true);
    }
  }
});

test("theme page hero: own title, counts and palette whatever the site theme", async ({ page }) => {
  await blockImages(page);
  await page.addInitScript(() => localStorage.setItem("cozypixels-theme", "catppuccin"));
  await page.goto("/nord");

  await expect(page).toHaveTitle("Nord wallpapers · CozyPixels");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nord");
  await expect(page.getByText(String(NORD.length), { exact: true }).first()).toBeVisible();

  const palette = page.getByRole("list", { name: "Nord palette" }).getByRole("listitem");
  await expect(palette).toHaveCount(5);
  // nord8 Frost, even though the visitor's site theme is Catppuccin
  await expect(palette.first()).toHaveCSS("background-color", "rgb(136, 192, 208)");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "catppuccin");
});

// 1×1 PNG, so image loading is instant and deterministic
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

async function stubImages(page: Page) {
  await page.route(/wsrv\.nl|\.(png|jpe?g|webp|gif)(\?.*)?$/i, (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: PIXEL_PNG })
  );
}

test("thumbnails: shimmer while loading, fade in after, first card never hidden", async ({ page }) => {
  // Hold the second card's image so its pending state can be inspected
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  let heldOnce = false;
  await page.route(/wsrv\.nl/, async (route) => {
    if (!heldOnce && decodeURIComponent(route.request().url()).includes(encodeURI(ONE_DARK[1].filename))) {
      heldOnce = true;
      await held;
    }
    await route.fulfill({ status: 200, contentType: "image/png", body: PIXEL_PNG });
  });
  await page.goto("/onedark");

  const firstImg = page.locator(".card-lift img").first();
  await expect(firstImg).not.toHaveAttribute("data-fade", /.*/);

  const wrapper = page.locator(".card-lift .img-shimmer").nth(1);
  const img = wrapper.locator("img");
  await expect(img).toHaveAttribute("data-fade", "true");
  await expect(img).toHaveAttribute("data-loaded", "false");
  await expect(wrapper).toHaveCSS("animation-name", "shimmer");

  release();
  await expect(img).toHaveAttribute("data-loaded", "true");
  await expect(img).toHaveCSS("opacity", "1");
  await expect(wrapper).toHaveCSS("animation-name", "none");
});

test("without app JS, thumbnails are never hidden by the fade", async ({ page }) => {
  await stubImages(page);
  await page.route(/\/_next\/static\/chunks\/.*\.js$/, (route) => route.abort());
  await page.goto("/onedark");
  const fading = page.locator("img[data-fade]").first();
  await expect(fading).toHaveCSS("opacity", "1");
});

test("hero headline stays on two lines and the CTA on one at every width", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "checks its own widths");
  for (const width of [360, 390, 768, 1024, 1180, 1280, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    await blockImages(page);
    await page.goto("/");
    const lines = await page.locator("h1").evaluate((h) =>
      Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight))
    );
    const ctaHeight = await page.getByRole("link", { name: "Explore Wallpapers" }).evaluate((a) => a.getBoundingClientRect().height);
    expect(lines, `headline lines at ${width}px`).toBe(2);
    expect(ctaHeight, `CTA wraps at ${width}px`).toBeLessThan(60);
    await context.close();
  }
});

test("sharing metadata, sitemap and robots", async ({ page, request }) => {
  await blockImages(page);
  for (const [route, image] of [["/", "og/home.png"], ["/nord", "og/nord.png"]]) {
    await page.goto(route);
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og, `og:image on ${route}`).toMatch(new RegExp(`^https://.+/${image}$`));
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "CozyPixels");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);

    // The referenced image is actually shipped
    const file = await request.get(`/${image}`);
    expect(file.status()).toBe(200);
    expect(file.headers()["content-type"]).toContain("image/png");
  }

  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of ["/", "/catppuccin", "/nord", "/onedark"]) {
    expect(sitemap).toMatch(new RegExp(`<loc>https://[^<]+${path === "/" ? "/" : path}</loc>`));
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Sitemap: https:\/\/.+\/sitemap\.xml/);
});

test("about page: credits, takedown route, license; linked from the header", async ({ page }) => {
  await blockImages(page);
  await page.goto("/nord");
  await page.getByRole("link", { name: /About/ }).first().click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page).toHaveTitle("About & credits · CozyPixels");

  // Scoped to the page body: the footer has the same link
  await expect(page.getByRole("main").getByRole("link", { name: "open an issue on the original repository" })).toHaveAttribute(
    "href",
    "https://github.com/SleepyCatHey/CozyPixels/issues"
  );
  await expect(page.getByRole("main").getByText(/saved from various social media platforms without tracking sources/)).toBeVisible();
  await expect(page.getByRole("link", { name: "MIT license" })).toHaveAttribute("href", /\/LICENSE$/);
});

test("credit note: dismissible, and stays hidden before any JS on return visits", async ({ page }) => {
  await blockImages(page);
  await page.goto("/onedark");
  const note = page.getByRole("complementary", { name: "Credits" });
  await expect(note).toBeVisible();
  await expect(note.getByRole("link", { name: "request credit or removal" })).toHaveAttribute("href", /\/about$/);

  await note.getByRole("button", { name: "Dismiss credit note" }).click();
  await expect(note).toBeHidden();

  // Return visit with every Next.js chunk blocked: only the head script can hide it
  await page.route(/\/_next\/static\/chunks\/.*\.js$/, (route) => route.abort());
  await page.reload();
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator(".credit-note")).toBeHidden();
});

test.describe("deep links", () => {
  test("filters come from and go to the URL", async ({ page }) => {
    await blockImages(page);
    const target = CATPPUCCIN[Math.min(5, CATPPUCCIN.length - 1)];
    const query = displayName(target.filename).split(" ")[0].toLowerCase();
    const expected = CATPPUCCIN.filter((w) => w.subcategory === target.subcategory && matchesSearch(w, query)).length;

    await page.goto(`/catppuccin?sub=${slugify(target.subcategory)}&q=${encodeURIComponent(query)}`);
    await expect(page.getByRole("button", { name: new RegExp(`^${escapeRe(target.subcategory)} · `) })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const search = page.getByRole("searchbox", { name: "Search wallpapers" });
    await expect(search).toHaveValue(query);
    await expect(page.locator('p[aria-live="polite"]')).toHaveText(countText(expected));

    // Editing filters replaces the history entry instead of adding to it
    const historyLength = await page.evaluate(() => history.length);
    await search.fill("");
    await page.getByRole("button", { name: /^All · / }).click();
    await expect(page).toHaveURL(/\/catppuccin$/);
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
  });

  test("opening a wallpaper adds ?w= and Back closes it", async ({ page }) => {
    await blockImages(page);
    await page.goto("/onedark");
    await page.getByRole("button", { name: /^View / }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`\\?w=${escapeRe(ONE_DARK[0].id)}$`));

    await page.goBack();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page).toHaveURL(/\/onedark$/);
  });

  test("a shared link opens that wallpaper, even deep in the list", async ({ page }) => {
    await blockImages(page);
    const index = Math.min(100, NORD.length - 1);
    const target = NORD[index];
    await page.goto(`/nord?w=${target.id}`);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(`${index + 1} / ${NORD.length}`, { exact: true })).toBeVisible();
    await expect(dialog.getByText(displayName(target.filename), { exact: true })).toBeVisible();

    // Its card exists behind the lightbox: the grid rendered up to its batch
    expect(await page.locator(".card-lift").count()).toBeGreaterThanOrEqual(index + 1);

    // Close stays on the page (no history entry of ours to go back to)
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/nord$/);
  });

  test("copy link and copy image URL put the right URLs on the clipboard", async ({ page, context }, testInfo) => {
    test.skip(isMobile(testInfo.project.name), "clipboard permissions are a desktop Chromium feature here");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await blockImages(page);
    await page.goto("/onedark");
    await page.getByRole("button", { name: /^View / }).first().click();
    const dialog = page.getByRole("dialog");
    const clipboard = () => page.evaluate(() => navigator.clipboard.readText());

    await dialog.getByRole("button", { name: "Copy link to this wallpaper" }).click();
    await expect(dialog.getByRole("button", { name: "Copy link: copied" })).toBeVisible();
    expect(await clipboard()).toMatch(new RegExp(`^https://.+/onedark\\?w=${escapeRe(ONE_DARK[0].id)}$`));

    await dialog.getByRole("button", { name: "Copy image URL" }).click();
    await expect(dialog.getByRole("button", { name: "Image URL: copied" })).toBeVisible();
    expect(await clipboard()).toBe(
      `https://raw.githubusercontent.com/SleepyCatHey/CozyPixels/main/${encodeURI(ONE_DARK[0].path)}`
    );
  });

  test("surprise me opens a random wallpaper from the current view; Back closes it", async ({ page }) => {
    await blockImages(page);
    await page.goto("/onedark");
    await page.getByRole("button", { name: "Surprise me" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\?w=.+/);
    const id = new URL(page.url()).searchParams.get("w");
    expect(ONE_DARK.some((w) => w.id === id)).toBe(true);

    await page.goBack();
    await expect(dialog).toBeHidden();
  });
});

test("footer shows when the collection was last updated", async ({ page }) => {
  await blockImages(page);
  await page.goto("/");
  await expect(page.locator("footer time")).toHaveAttribute("datetime", manifest.generatedAt);
  await expect(page.locator("footer")).toContainText("Collection updated");
});

test("installable: web manifest with working icons", async ({ request, page }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifestUrl = new URL(href!, page.url());
  const webManifest = await (await request.get(manifestUrl.href)).json();
  expect(webManifest).toMatchObject({ short_name: "CozyPixels", display: "standalone", start_url: "./" });

  for (const icon of webManifest.icons as Array<{ src: string; sizes: string }>) {
    const res = await request.get(new URL(icon.src, manifestUrl).href);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
  expect(webManifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"])
  );
});

test.describe("downloads", () => {
  const FIRST = ONE_DARK[0];
  const NAME = displayName(FIRST.filename);
  const ORIGINAL = new RegExp(`raw\\.githubusercontent\\.com/.*${escapeRe(encodeURI(FIRST.path))}$`);

  test("card download saves the original file under its own name, with a busy state", async ({ page }) => {
    await blockImages(page);
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    await page.route(ORIGINAL, async (route) => {
      await held;
      await route.fulfill({ status: 200, contentType: "image/jpeg", body: PIXEL_PNG });
    });
    await page.goto("/onedark");

    const button = page.getByRole("button", { name: `Download ${NAME}` });
    const downloadEvent = page.waitForEvent("download");
    await button.click();
    const busy = page.getByRole("button", { name: new RegExp(`^Downloading ${escapeRe(NAME)}`) });
    await expect(busy).toBeDisabled();

    release();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(FIRST.filename);
    await expect(page.getByRole("button", { name: `Saved ${NAME}` })).toBeVisible();
  });

  test("a failed download opens the file in a new tab and says so", async ({ page, context }) => {
    await blockImages(page);
    await page.route(ORIGINAL, (route) => route.abort());
    await page.goto("/onedark");

    const popup = context.waitForEvent("page");
    await page.getByRole("button", { name: `Download ${NAME}` }).click();
    expect((await popup).url()).toMatch(ORIGINAL);

    // Coming back from the new tab, the explanation is still waiting
    await page.bringToFront();
    await expect(page.getByRole("status").filter({ hasText: "opened in a new tab" })).toBeVisible();
  });

  test("the lightbox shows format and size before downloading", async ({ page }) => {
    await blockImages(page);
    await page.goto("/onedark");
    await page.getByRole("button", { name: /^View / }).first().click();
    const info = new RegExp(
      `${escapeRe(`${FIRST.theme} · ${FIRST.subcategory}`)}\\s*${escapeRe(`· ${formatLabel(FIRST.extension)} · ${formatBytes(FIRST.size ?? 0)}`)}`
    );
    await expect(page.getByRole("dialog").getByText(info)).toBeVisible();
  });
});

test("unknown URLs get the styled 404 with ways back", async ({ page }) => {
  await blockImages(page);
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found · CozyPixels");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("drifted off");

  await page.getByRole("link", { name: "Nord" }).click();
  await expect(page).toHaveURL(/\/nord$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nord");
});

test("empty search shows a friendly state that clears the filters", async ({ page }) => {
  await blockImages(page);
  await page.goto("/catppuccin");
  await page.getByRole("searchbox", { name: "Search wallpapers" }).fill("zzqqxx");
  await expect(page.getByText("No wallpapers match")).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator('p[aria-live="polite"]')).toHaveText(countText(CATPPUCCIN.length));
  await expect(page.getByRole("searchbox", { name: "Search wallpapers" })).toHaveValue("");
});

test.describe("touch targets", () => {
  for (const route of ROUTES) {
    test(`${route}: every control is at least 44px on phones`, async ({ page }, testInfo) => {
      test.skip(!isMobile(testInfo.project.name), "touch layout");
      await blockImages(page);
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();

      const small = await page
        .locator("a[href], button, input, [role='button']")
        .evaluateAll((els, hitBoxSrc) => {
          const hitBox = new Function(`return (${hitBoxSrc})`)() as (el: Element) => { width: number; height: number };
          return els
            .filter((el) => (el as HTMLElement).checkVisibility())
            // Links inside running text are exempt (WCAG 2.5.8)
            .filter((el) => !(el.tagName === "A" && el.closest("p")))
            .map((el) => ({ el, box: hitBox(el) }))
            .filter(({ box }) => box.width < 44 || box.height < 44)
            .map(({ el, box }) =>
              `${el.tagName} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(box.width)}x${Math.round(box.height)}`
            );
        }, hitBox.toString());
      expect(small).toEqual([]);
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

test("theme cross-fade is scoped to the moment of switching", async ({ page }, testInfo) => {
  await blockImages(page);
  await page.goto("/onedark");

  // At rest, components keep their own transitions (the card image eases its zoom)
  const cardImage = page.locator(".card-lift img").first();
  await expect
    .poll(() => cardImage.evaluate((el) => getComputedStyle(el).transitionProperty))
    .toContain("transform");

  if (isMobile(testInfo.project.name)) {
    await page.getByRole("button", { name: "Theme menu" }).click();
  }
  // The class only lives ~300ms, so record it appearing rather than racing to see it
  await page.evaluate(() => {
    const w = window as unknown as { sawSwitching: boolean };
    w.sawSwitching = false;
    new MutationObserver(() => {
      if (document.documentElement.classList.contains("theme-switching")) w.sawSwitching = true;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  });
  const html = page.locator("html");
  await page.getByRole("button", { name: "Nord", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { sawSwitching: boolean }).sawSwitching)).toBe(true);
  await expect(html).not.toHaveClass(/\btheme-switching\b/, { timeout: 2_000 });
});

test("smooth scrolling runs on desktop only and pauses under the lightbox", async ({ page }, testInfo) => {
  await blockImages(page);
  await page.goto("/onedark");
  const html = page.locator("html");

  if (isMobile(testInfo.project.name)) {
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);
    await expect(html).not.toHaveClass(/\blenis\b/);
    return;
  }

  await expect(html).toHaveClass(/\blenis\b/);
  await page.getByRole("button", { name: /^View / }).first().click();
  await expect(html).toHaveClass(/\blenis-stopped\b/);
  await page.keyboard.press("Escape");
  await expect(html).not.toHaveClass(/\blenis-stopped\b/);
});

test("cards lift on hover only on devices that can hover", async ({ page }, testInfo) => {
  await blockImages(page);
  await page.goto("/onedark");
  const card = page.locator(".card-lift").first();
  await card.hover();

  const liftY = () =>
    card.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
  if (isMobile(testInfo.project.name)) {
    await page.waitForTimeout(600);
    expect(await liftY()).toBe(0);
  } else {
    await expect.poll(liftY).toBeCloseTo(-6, 0);
  }
});

// The element whose opacity the hero entrance animates
const heroHeadlineWrapper = (page: Page) => page.locator("h1").first().locator("xpath=..");

test("hero headline fades in without any app JS", async ({ page }) => {
  await blockImages(page);
  await page.route(/\/_next\/static\/chunks\/.*\.js$/, (route) => route.abort());
  await page.goto("/");
  await expect
    .poll(() => heroHeadlineWrapper(page).evaluate((el) => getComputedStyle(el).opacity))
    .toBe("1");
});

test("reduced motion shows the hero immediately", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await blockImages(page);
  await page.goto("/");
  const style = await heroHeadlineWrapper(page).evaluate((el) => {
    const s = getComputedStyle(el);
    return { opacity: s.opacity, animation: s.animationName };
  });
  expect(style).toEqual({ opacity: "1", animation: "none" });
  await context.close();
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
