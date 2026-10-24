/**
 * perf.mjs
 * Runs Lighthouse (mobile preset) against the static build and checks budgets (PLAN §3 A-11).
 *
 * Usage:
 *   pnpm build:preview && pnpm perf
 *
 * Options (env):
 *   PERF_URL    - base URL to test instead of serving out/ locally (e.g. the live Pages URL)
 *   PERF_ROUTES - comma-separated routes, default: /,/catppuccin,/onedark
 *   PERF_RUNS   - runs per route, median is reported (default 1)
 */

import { spawn } from "child_process";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const PORT = 4173;
const ROUTES = (process.env.PERF_ROUTES || "/,/catppuccin,/onedark").split(",");
const RUNS = Number(process.env.PERF_RUNS || 1);
const OUT_DIR = join(process.cwd(), ".perf");

// PLAN A-11 (v1.2, 2026-10-24): simulated LCP has a ~2.6 s floor from the React/Next runtime
// alone, so real paint is checked with the observed LCP and the simulated one gets headroom.
// JS moved 160 → 165 KB after the live H-01 run: the same code transferred 160 KB on Pages
// (gzip) and 162 KB on Vercel (Brotli), i.e. the delta was CDN compression, not code (TRACKER §4).
const BUDGETS = {
  performance: 90,
  accessibility: 95,
  observedLcpMs: 1000,
  lcpMs: 3500,
  tbtMs: 200,
  cls: 0.05,
  imageKB: 1536,
  scriptKB: 165,
};

function startServer() {
  const server = spawn(`pnpm exec serve out -l ${PORT} --no-port-switching`, {
    shell: true,
    stdio: "ignore",
  });
  return server;
}

function stopServer(server) {
  // With shell: true the child is a shell; kill the whole tree so serve releases the port
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    server.kill();
  }
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} did not start`);
}

function summarise(lhr) {
  const audits = lhr.audits;
  const resources = audits["resource-summary"].details.items;
  const kb = (type) =>
    Math.round((resources.find((r) => r.resourceType === type)?.transferSize ?? 0) / 1024);

  return {
    performance: Math.round(lhr.categories.performance.score * 100),
    accessibility: Math.round(lhr.categories.accessibility.score * 100),
    observedLcpMs: Math.round(audits.metrics.details.items[0].observedLargestContentfulPaint),
    lcpMs: Math.round(audits["largest-contentful-paint"].numericValue),
    tbtMs: Math.round(audits["total-blocking-time"].numericValue),
    cls: Number(audits["cumulative-layout-shift"].numericValue.toFixed(3)),
    imageKB: kb("image"),
    scriptKB: kb("script"),
    totalKB: kb("total"),
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function checkBudgets(result) {
  const failures = [];
  if (result.performance < BUDGETS.performance) failures.push("performance");
  if (result.accessibility < BUDGETS.accessibility) failures.push("accessibility");
  if (result.observedLcpMs > BUDGETS.observedLcpMs) failures.push("observed LCP");
  if (result.lcpMs > BUDGETS.lcpMs) failures.push("simulated LCP");
  if (result.tbtMs > BUDGETS.tbtMs) failures.push("TBT");
  if (result.cls > BUDGETS.cls) failures.push("CLS");
  if (result.imageKB > BUDGETS.imageKB) failures.push("images");
  if (result.scriptKB > BUDGETS.scriptKB) failures.push("JS");
  return failures;
}

// A Pages build (basePath /CozyPixel.web) served at the root loads no JS and gives bogus numbers
function assertPreviewBuild() {
  const html = readFileSync(join(process.cwd(), "out", "index.html"), "utf-8");
  if (html.includes("/CozyPixel.web/_next/")) {
    throw new Error("out/ is a GitHub Pages build (basePath). Run `pnpm build:preview` first.");
  }
}

async function main() {
  const baseUrl = process.env.PERF_URL || `http://localhost:${PORT}`;
  if (!process.env.PERF_URL) assertPreviewBuild();
  const server = process.env.PERF_URL ? null : startServer();

  try {
    if (server) await waitForServer(baseUrl);
    mkdirSync(OUT_DIR, { recursive: true });

    const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
    const rows = [];

    try {
      for (const route of ROUTES) {
        // Relative join keeps any path prefix in PERF_URL (e.g. /CozyPixel.web/)
        const url = new URL(route.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).href;
        const runs = [];
        for (let i = 0; i < RUNS; i++) {
          // Lighthouse defaults to the mobile preset with simulated throttling
          const result = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error" });
          runs.push(summarise(result.lhr));
          const name = route === "/" ? "home" : route.replace(/\//g, "");
          writeFileSync(join(OUT_DIR, `${name}-${i + 1}.json`), result.report);
        }

        const merged = Object.fromEntries(
          Object.keys(runs[0]).map((key) => [key, median(runs.map((r) => r[key]))])
        );
        rows.push({ route, ...merged, failures: checkBudgets(merged) });
      }
    } finally {
      await chrome.kill();
    }

    console.log("\nLighthouse mobile (" + RUNS + " run(s), median) — " + baseUrl + "\n");
    console.table(
      rows.map(({ failures, ...r }) => ({ ...r, budgets: failures.length ? "FAIL: " + failures.join(", ") : "ok" }))
    );
    writeFileSync(join(OUT_DIR, "summary.json"), JSON.stringify(rows, null, 2));

    if (rows.some((r) => r.failures.length)) process.exitCode = 1;
  } finally {
    if (server) stopServer(server);
  }
}

main().catch((err) => {
  console.error("❌ perf run failed:", err.message);
  process.exit(1);
});
