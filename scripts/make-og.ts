/**
 * make-og.ts
 * Builds the 1200×630 social preview images in public/og/ (PLAN A-19):
 * home.png plus one per theme. Static export can't render them per request, so they are
 * generated once and committed. Re-run after changing wallpapers or palettes.
 *
 * Usage:
 *   pnpm make-og
 */

import { mkdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import manifestData from "../data/manifest.json";
import { getImageUrl } from "../lib/image-urls";
import imageLoader from "../lib/image-loader";
import { themes, type ThemeId } from "../lib/themes";
import type { Manifest, Wallpaper } from "../lib/types";

const manifest = manifestData as Manifest;
const W = 1200;
const H = 630;
const OUT_DIR = join(process.cwd(), "public", "og");
const FONT = "Inter, 'Segoe UI', Arial, sans-serif";

// Dark base of each palette (Catppuccin Mocha base, Nord polar night, One Dark bg)
const BASE: Record<ThemeId, string> = { catppuccin: "#1e1e2e", nord: "#2e3440", onedark: "#282c34" };

const byTheme = (name: string) => manifest.wallpapers.filter((w) => w.theme === name);

function escapeXml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function fetchWallpaper(wallpaper: Wallpaper, width: number) {
  const url = imageLoader({ src: getImageUrl(wallpaper), width });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${wallpaper.path}`);
  return Buffer.from(await res.arrayBuffer());
}

/** A rounded, bordered 16:10 card, rotated, with a soft shadow (the hero collage look) */
async function card(image: Buffer, width: number, angle: number, opacity = 1) {
  const height = Math.round(width / 1.6);
  const radius = 22;
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`
  );
  const border = Buffer.from(
    `<svg width="${width}" height="${height}"><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${radius}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2"/></svg>`
  );
  const photo = await sharp(image)
    .resize(width, height, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }, { input: border }])
    .png()
    .toBuffer();

  // Shadow: a blurred dark rounded rect behind the photo
  const pad = 40;
  const shadow = await sharp(
    Buffer.from(
      `<svg width="${width + pad * 2}" height="${height + pad * 2}"><rect x="${pad}" y="${pad + 14}" width="${width}" height="${height}" rx="${radius}" fill="rgba(0,0,0,0.55)"/></svg>`
    )
  )
    .blur(18)
    .png()
    .toBuffer();

  const layered = await sharp(shadow)
    .composite([{ input: photo, left: pad, top: pad }])
    .png()
    .toBuffer();

  const rotated = await sharp(layered)
    .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  if (opacity >= 1) return rotated;

  // Fade the whole card (back cards sit behind the front one, as in the hero)
  const { width: rw = 0, height: rh = 0 } = await sharp(rotated).metadata();
  const fade = Buffer.from(
    `<svg width="${rw}" height="${rh}"><rect width="100%" height="100%" fill="#fff" fill-opacity="${opacity}"/></svg>`
  );
  return sharp(rotated).composite([{ input: fade, blend: "dest-in" }]).png().toBuffer();
}

interface OgSpec {
  file: string;
  base: string;
  accent: string;
  eyebrow: string;
  titleLines: string[];
  titleAccentLine: number; // which line is drawn in the accent colour
  subtitle: string[]; // one entry per line; keep each under ~34 characters
  swatches: string[];
  wallpapers: [Wallpaper, Wallpaper, Wallpaper]; // back-left, back-right, front
}

async function render(spec: OgSpec) {
  const [backLeft, backRight, front] = await Promise.all(
    spec.wallpapers.map((w, i) => fetchWallpaper(w, i === 2 ? 1080 : 828))
  );

  const background = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="78%" cy="30%" r="60%">
          <stop offset="0%" stop-color="${spec.accent}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${spec.accent}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glow2" cx="10%" cy="100%" r="55%">
          <stop offset="0%" stop-color="${spec.swatches[1]}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${spec.swatches[1]}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="${spec.base}"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <rect width="100%" height="100%" fill="url(#glow2)"/>
    </svg>`);

  const lineHeight = 74;
  const titleTop = 250;
  const title = spec.titleLines
    .map(
      (line, i) =>
        `<text x="72" y="${titleTop + i * lineHeight}" font-family="${FONT}" font-size="66" font-weight="800" letter-spacing="-1.5" fill="${
          i === spec.titleAccentLine ? spec.accent : "#eef0f6"
        }">${escapeXml(line)}</text>`
    )
    .join("");
  const subtitleY = titleTop + (spec.titleLines.length - 1) * lineHeight + 58;
  const subtitleLineHeight = 36;
  const swatchY = subtitleY + (spec.subtitle.length - 1) * subtitleLineHeight + 52;
  const swatches = spec.swatches
    .map((hex, i) => `<circle cx="${92 + i * 30}" cy="${swatchY}" r="16" fill="${hex}" stroke="${spec.base}" stroke-width="4"/>`)
    .join("");

  const text = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="128" y="96" font-family="${FONT}" font-size="34" font-weight="700" fill="#eef0f6">Cozy<tspan fill="${spec.accent}">Pixels</tspan></text>
      <rect x="72" y="140" width="${spec.eyebrow.length * 9.4 + 44}" height="38" rx="19" fill="${spec.accent}" fill-opacity="0.12" stroke="${spec.accent}" stroke-opacity="0.35"/>
      <text x="94" y="165" font-family="${FONT}" font-size="18" font-weight="600" fill="${spec.accent}">${escapeXml(spec.eyebrow)}</text>
      ${title}
      ${spec.subtitle
        .map((line, i) => `<text x="72" y="${subtitleY + i * subtitleLineHeight}" font-family="${FONT}" font-size="26" fill="#aab0c2">${escapeXml(line)}</text>`)
        .join("")}
      ${swatches}
    </svg>`);

  const logo = await sharp(join(process.cwd(), "lib", "assets", "logo.webp")).resize(44, 44).png().toBuffer();

  const [cardBackLeft, cardBackRight, cardFront] = await Promise.all([
    card(backLeft, 360, -6, 0.75),
    card(backRight, 380, 6, 0.85),
    card(front, 470, -2),
  ]);

  await sharp(background)
    .composite([
      { input: cardBackLeft, left: 610, top: 230 },
      { input: cardBackRight, left: 770, top: 30 },
      { input: cardFront, left: 640, top: 150 },
      { input: text, left: 0, top: 0 },
      { input: logo, left: 72, top: 62 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(OUT_DIR, spec.file));

  console.log(`✅ public/og/${spec.file}`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const cat = byTheme("Catppuccin");
  const nord = byTheme("Nord");
  const one = byTheme("One Dark");

  // Same wallpapers as the home hero collage
  await render({
    file: "home.png",
    base: BASE.catppuccin,
    accent: themes.catppuccin.swatches[0].hex,
    eyebrow: "Aesthetic Desktop Wallpapers",
    titleLines: ["Soft colors for", "quiet screens."],
    titleAccentLine: 1,
    subtitle: ["Catppuccin · Nord · One Dark", "Free and open source"],
    swatches: [themes.catppuccin.swatches[0].hex, themes.nord.swatches[0].hex, themes.onedark.swatches[0].hex, themes.catppuccin.swatches[1].hex, themes.onedark.swatches[2].hex],
    wallpapers: [one[2], nord[3], cat[1]],
  });

  for (const id of Object.keys(themes) as ThemeId[]) {
    const theme = themes[id];
    const list = byTheme(theme.name);
    await render({
      file: `${id}.png`,
      base: BASE[id],
      accent: theme.swatches[0].hex,
      eyebrow: "Wallpaper collection",
      titleLines: [theme.name, "wallpapers"],
      titleAccentLine: 0,
      subtitle: [`${list.length} free wallpapers`, theme.description],
      swatches: theme.swatches.map((s) => s.hex),
      wallpapers: [list[2], list[1], list[0]],
    });
  }
}

main().catch((err) => {
  console.error("❌ Failed to make OG images:", err.message);
  process.exit(1);
});
