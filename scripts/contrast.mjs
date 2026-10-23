/**
 * contrast.mjs
 * Checks WCAG contrast of the text-colour pairings in all 6 palettes (PLAN A-14).
 * Tokens are read straight from app/globals.css, so the check can't drift from the CSS.
 *
 * Usage:
 *   pnpm contrast
 *
 * Exits 1 if any text pairing is below 4.5:1 (WCAG AA, normal text).
 */

import { readFileSync } from "fs";
import { join } from "path";

const MIN_TEXT = 4.5;

// [foreground token, background token] for every way the components put text on a surface
const PAIRS = [
  ["foreground", "background"],
  ["muted-foreground", "background"],
  ["primary", "background"], // text-primary: links, logo, accents
  ["primary", "card"],
  ["muted-foreground", "card"],
  ["card-foreground", "card"],
  ["primary-foreground", "primary"], // buttons, active chips
  ["secondary-foreground", "secondary"], // inactive chips
  ["accent-foreground", "accent"],
];

const PALETTES = [
  ["Catppuccin light", '[data-theme="catppuccin"] {'],
  ["Catppuccin dark", '[data-theme="catppuccin"][data-mode="dark"] {'],
  ["Nord light", '[data-theme="nord"] {'],
  ["Nord dark", '[data-theme="nord"][data-mode="dark"] {'],
  ["One Dark light", '[data-theme="onedark"] {'],
  ["One Dark dark", '[data-theme="onedark"][data-mode="dark"] {'],
];

function readTokens(css, selectorLine) {
  const start = css.indexOf(selectorLine);
  if (start === -1) throw new Error(`Palette block not found: ${selectorLine}`);
  const block = css.slice(start, css.indexOf("}", start));
  const tokens = {};
  for (const [, name, h, s, l] of block.matchAll(/--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g)) {
    tokens[name] = [Number(h), Number(s), Number(l)];
  }
  return tokens;
}

function hslToRgb([h, s, l]) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(hslToRgb(a)), luminance(hslToRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf-8");
const failures = [];
const rows = [];

for (const [palette, selector] of PALETTES) {
  const tokens = readTokens(css, selector);
  const row = { palette };
  for (const [fg, bg] of PAIRS) {
    const ratio = contrast(tokens[fg], tokens[bg]);
    row[`${fg} / ${bg}`] = ratio.toFixed(2);
    if (ratio < MIN_TEXT) failures.push(`${palette}: ${fg} on ${bg} = ${ratio.toFixed(2)}`);
  }
  rows.push(row);
}

console.table(rows);
if (failures.length) {
  console.error(`\n❌ ${failures.length} pairing(s) below ${MIN_TEXT}:1\n  ` + failures.join("\n  "));
  process.exitCode = 1;
} else {
  console.log(`\n✅ All text pairings ≥ ${MIN_TEXT}:1 in all 6 palettes`);
}
