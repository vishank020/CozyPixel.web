import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { themes, type ThemeId } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Page not found · CozyPixels",
};

export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-16 sm:py-24">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 overflow-hidden rounded-panel border border-border/60 bg-card px-6 py-14 text-center shadow-lg sm:px-12 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

        <p className="relative text-sm font-semibold tracking-widest text-primary">404</p>
        <h1 className="relative text-section font-bold tracking-tight text-foreground">
          This page drifted off somewhere quiet.
        </h1>
        <p className="relative max-w-xl text-muted-foreground">
          The link may be old or mistyped. The wallpapers are all still here:
        </p>

        <ul className="relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {(Object.keys(themes) as ThemeId[]).map((id) => (
            <li key={id}>
              <Link
                href={`/${id}`}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
              >
                {themes[id].name}
                <ArrowRight className="h-4 w-4 text-primary" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/" className="relative inline-flex min-h-11 items-center font-medium text-primary hover:underline">
          Back to the home page
        </Link>
      </div>
    </main>
  );
}
