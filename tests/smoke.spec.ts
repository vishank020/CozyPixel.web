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
  const count = page.getByText(/^\d+ wallpapers?$/);
  await expect(count).toHaveText("383 wallpapers");

  // Searching a category name finds that category (README promise)
  const search = page.getByRole("searchbox", { name: "Search wallpapers" });
  await search.fill("transportation");
  const chip = page.getByRole("button", { name: /^Transportation · \d+$/ });
  const expected = (await chip.textContent())!.match(/(\d+)$/)![1];
  await expect(count).toHaveText(`${expected} wallpapers`);

  const clear = page.getByRole("button", { name: "Clear search" });
  const clearBox = await clear.evaluate(hitBox);
  expect(Math.min(clearBox.width, clearBox.height)).toBeGreaterThanOrEqual(44);
  await clear.click();
  await expect(count).toHaveText("383 wallpapers");

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
  await expect(page.getByRole("dialog").getByText(/^1 \/ 383$/)).toBeVisible();
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
  const html = page.locator("html");
  await page.getByRole("button", { name: "Nord", exact: true }).click();
  await expect(html).toHaveClass(/\btheme-switching\b/);
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
