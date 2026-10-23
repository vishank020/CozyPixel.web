import { test, expect } from "@playwright/test";
import { getImageUrl, getRawUrl } from "../lib/image-urls";
import imageLoader from "../lib/image-loader";

const MB = 1024 * 1024;
const path = "Catppuccin/Transportation/van chilling.png";

test.describe("image URL rules", () => {
  test("files up to 20 MB use jsDelivr", () => {
    expect(getImageUrl({ path, size: 20 * MB })).toMatch(/^https:\/\/cdn\.jsdelivr\.net\//);
    expect(getImageUrl({ path })).toMatch(/^https:\/\/cdn\.jsdelivr\.net\//);
  });

  test("files over 20 MB use raw GitHub (jsDelivr returns 403)", () => {
    expect(getImageUrl({ path, size: 20 * MB + 1 })).toBe(getRawUrl({ path }));
  });

  test("paths are URL-encoded", () => {
    expect(getImageUrl({ path })).toContain("van%20chilling.png");
  });

  test("loader resizes remote images to WebP and leaves local assets alone", () => {
    const remote = new URL(imageLoader({ src: getImageUrl({ path }), width: 640 }));
    expect(remote.host).toBe("wsrv.nl");
    expect(remote.searchParams.get("w")).toBe("640");
    expect(remote.searchParams.get("output")).toBe("webp");
    // The proxy reads raw GitHub (jsDelivr blocks it); the page keeps jsDelivr as fallback
    expect(remote.searchParams.get("url")).toBe(getRawUrl({ path }));

    expect(imageLoader({ src: "/_next/static/media/logo.webp", width: 96 })).toBe(
      "/_next/static/media/logo.webp?w=96"
    );
  });
});
