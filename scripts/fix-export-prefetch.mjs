/**
 * fix-export-prefetch.mjs
 * Works around a Next.js 16.3 static-export mismatch: the exporter writes route prefetch
 * segments as nested files (out/nord/__next.$d$theme/__PAGE__.txt) but the client requests
 * the flattened name (out/nord/__next.$d$theme.__PAGE__.txt), so every <Link> prefetch 404s.
 * Static hosts like GitHub Pages can't rewrite, so this writes a flattened copy next to each
 * nested file (originals are kept). Harmless if a future Next version fixes the paths.
 *
 * Runs after every build (see package.json). Usage: node scripts/fix-export-prefetch.mjs [outDir]
 */

import { copyFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative, sep } from "path";

const OUT = process.argv[2] ?? join(process.cwd(), "out");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

if (!existsSync(OUT)) {
  console.error(`fix-export-prefetch: ${OUT} not found (run next build first)`);
  process.exit(1);
}

let written = 0;
for (const file of walk(OUT)) {
  const parts = relative(OUT, file).split(sep);
  // First directory named "__next.<segment>" marks where the client expects a flat name
  const start = parts.findIndex((part, i) => i < parts.length - 1 && part.startsWith("__next."));
  if (start === -1) continue;

  const flatName = parts.slice(start).join(".");
  const target = join(OUT, ...parts.slice(0, start), flatName);
  if (!existsSync(target)) {
    copyFileSync(file, target);
    written++;
  }
}

console.log(`fix-export-prefetch: wrote ${written} flattened prefetch file(s) in ${relative(process.cwd(), OUT) || "."}`);
