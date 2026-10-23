"use client";

import Link from "next/link";
import { Heart, X } from "lucide-react";
import { CREDIT_DISMISSED_ATTR, CREDIT_DISMISSED_KEY } from "@/lib/credit-note";

/** Slim, dismissible credit + takedown pointer shown above each gallery */
export function CreditNote() {
  function dismiss() {
    try {
      localStorage.setItem(CREDIT_DISMISSED_KEY, "1");
    } catch {
      // localStorage unavailable: hide for this page view only
    }
    document.documentElement.setAttribute(CREDIT_DISMISSED_ATTR, "");
  }

  return (
    <aside
      aria-label="Credits"
      className="credit-note flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 py-2 pl-4 pr-2 text-sm text-muted-foreground"
    >
      <Heart className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <p className="flex-1">
        Wallpapers from SleepyCatHey&apos;s CozyPixels collection. Artists can{" "}
        <Link href="/about" className="font-medium text-primary hover:underline">
          request credit or removal
        </Link>
        .
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss credit note"
        className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground after:absolute after:-inset-1.5 after:content-['']"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </aside>
  );
}
