"use client";

import { ReactNode, useEffect } from "react";
import type Lenis from "lenis";

// Smooth wheel scrolling is a desktop nicety (PLAN A-04): touch devices scroll natively,
// and Lenis is only downloaded when it will actually be used.

let activeLenis: Lenis | null = null;

/** Pause smooth scrolling while an overlay (e.g. the lightbox) owns the wheel */
export function setSmoothScrollPaused(paused: boolean) {
  if (paused) activeLenis?.stop();
  else activeLenis?.start();
}

/**
 * Scroll an element to the top of the viewport, honouring its scroll-margin-top.
 * Native scrollIntoView is ignored while Lenis owns the scroll position.
 */
export function scrollToElement(el: HTMLElement) {
  if (activeLenis) {
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    activeLenis.scrollTo(el, { offset: -margin, duration: 0.6 });
  } else {
    el.scrollIntoView({ block: "start" });
  }
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const wantsSmooth =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wantsSmooth) return;

    let cancelled = false;
    let lenis: Lenis | null = null;

    import("lenis").then(({ default: LenisClass }) => {
      if (cancelled) return;
      lenis = new LenisClass({
        lerp: 0.1,
        duration: 1.5,
        smoothWheel: true,
        autoRaf: true,
      });
      activeLenis = lenis;
    });

    return () => {
      cancelled = true;
      lenis?.destroy();
      if (activeLenis === lenis) activeLenis = null;
    };
  }, []);

  return <>{children}</>;
}
