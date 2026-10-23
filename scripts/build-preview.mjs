/**
 * build-preview.mjs
 * Static export without basePath, from the committed manifest, so `pnpm preview`
 * can serve out/ at the root. Cross-platform replacement for `LOCAL_PREVIEW=1 next build`.
 */

import { spawnSync } from "child_process";

const result = spawnSync("pnpm exec next build", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, LOCAL_PREVIEW: "1" },
});

if (result.status !== 0) process.exit(result.status ?? 1);

// Same post-build fix as build/build:local (see scripts/fix-export-prefetch.mjs)
const fix = spawnSync("node scripts/fix-export-prefetch.mjs", { stdio: "inherit", shell: true });
process.exit(fix.status ?? 1);
