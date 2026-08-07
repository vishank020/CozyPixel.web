/**
 * generate-manifest.ts
 * Walks the CozyPixels GitHub repository and produces data/manifest.json
 * 
 * Usage:
 *   pnpm run generate-manifest
 * 
 * Options (env):
 *   GITHUB_TOKEN   - optional, raises rate limit from 60 → 5000 req/h
 *   SOURCE_REPO    - default: SleepyCatHey/CozyPixels
 *   BRANCH         - default: main
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SOURCE_REPO = process.env.SOURCE_REPO || "SleepyCatHey/CozyPixels";
const BRANCH = process.env.BRANCH || "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OUTPUT = join(process.cwd(), "data", "manifest.json");

const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "tiff",
]);

interface Wallpaper {
  id: string;
  theme: "Catppuccin" | "Nord" | "One Dark";
  subcategory: string;
  filename: string;
  path: string;
  extension: string;
  size?: number;
}

interface Manifest {
  generatedAt: string;
  sourceRepo: string;
  sourceBranch: string;
  sourceCommit?: string;
  total: number;
  themes: Record<
    string,
    {
      count: number;
      subcategories: Record<string, number>;
    }
  >;
  wallpapers: Wallpaper[];
}

async function githubFetch(url: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CozyPixels-Web-Manifest-Generator",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function detectTheme(path: string): "Catppuccin" | "Nord" | "One Dark" | null {
  if (path.startsWith("Catppuccin/")) return "Catppuccin";
  if (path.startsWith("Nord/")) return "Nord";
  if (path.startsWith("One Dark/") || path.startsWith("One%20Dark/")) return "One Dark";
  return null;
}

async function getRecursiveTree() {
  // First get the commit SHA of the branch
  const ref = await githubFetch(
    `https://api.github.com/repos/${SOURCE_REPO}/git/ref/heads/${BRANCH}`
  );
  const commitSha = ref.object.sha;

  // Then get the full recursive tree
  const tree = await githubFetch(
    `https://api.github.com/repos/${SOURCE_REPO}/git/trees/${commitSha}?recursive=1`
  );

  return {
    commitSha,
    tree: tree.tree as Array<{
      path: string;
      type: string;
      size?: number;
      sha: string;
    }>,
  };
}

async function main() {
  console.log(`🔍 Fetching tree from ${SOURCE_REPO}@${BRANCH}...`);

  const { commitSha, tree } = await getRecursiveTree();
  console.log(`📦 Received ${tree.length} items (commit ${commitSha.slice(0, 7)})`);

  const wallpapers: Wallpaper[] = [];
  const themeStats: Manifest["themes"] = {
    Catppuccin: { count: 0, subcategories: {} },
    Nord: { count: 0, subcategories: {} },
    "One Dark": { count: 0, subcategories: {} },
  };

  for (const item of tree) {
    if (item.type !== "blob") continue;

    const ext = item.path.split(".").pop()?.toLowerCase();
    if (!ext || !IMAGE_EXTENSIONS.has(ext)) continue;

    const theme = detectTheme(item.path);
    if (!theme) continue;

    // path example: "Catppuccin/Anime & Gaming/touhou-lake.jpg"
    const parts = item.path.split("/");
    if (parts.length < 3) continue; // must have Theme / Subcategory / file

    const subcategory = parts[1];
    const filename = parts[parts.length - 1];

    // Using the full path ensures a globally unique ID (e.g. including extension and any subfolders)
    const id = slugify(item.path);

    wallpapers.push({
      id,
      theme,
      subcategory,
      filename,
      path: item.path,
      extension: ext,
      size: item.size,
    });

    // stats
    themeStats[theme].count++;
    themeStats[theme].subcategories[subcategory] =
      (themeStats[theme].subcategories[subcategory] || 0) + 1;
  }

  // stable sort
  wallpapers.sort((a, b) => a.path.localeCompare(b.path));

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    sourceRepo: SOURCE_REPO,
    sourceBranch: BRANCH,
    sourceCommit: commitSha,
    total: wallpapers.length,
    themes: themeStats,
    wallpapers,
  };

  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2), "utf-8");

  console.log("\n✅ Manifest generated successfully!");
  console.log(`   Total wallpapers : ${manifest.total}`);
  console.log(`   Catppuccin       : ${themeStats.Catppuccin.count}`);
  console.log(`   Nord             : ${themeStats.Nord.count}`);
  console.log(`   One Dark         : ${themeStats["One Dark"].count}`);
  console.log(`   Output           : ${OUTPUT}`);
}

main().catch((err) => {
  console.error("❌ Failed to generate manifest:", err.message);
  process.exit(1);
});
