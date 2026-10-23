"use client";

import { useEffect, useState } from "react";

// Minimal app-wide toast: showToast() from anywhere, <Toaster /> renders it (mounted once in the layout)

const TOAST_EVENT = "cozypixels:toast";
const VISIBLE_MS = 4000;

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));
}

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Count down only while the page is visible: a toast raised as a new tab opens
    // (download fallback) must still be there when the visitor comes back
    const startCountdown = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", startCountdown);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), VISIBLE_MS);
    };

    const onToast = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail);
      clearTimeout(timer);
      if (document.hidden) document.addEventListener("visibilitychange", startCountdown);
      else startCountdown();
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      document.removeEventListener("visibilitychange", startCountdown);
      clearTimeout(timer);
    };
  }, []);

  return (
    // Always mounted so screen readers announce changes; empty when there's nothing to say
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {message && (
        <p className="rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-card-foreground shadow-xl">
          {message}
        </p>
      )}
    </div>
  );
}
