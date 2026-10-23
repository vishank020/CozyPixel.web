"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { getImageProps } from "next/image";
import { WallpaperImage } from "./wallpaper-image";
import { setSmoothScrollPaused } from "./SmoothScroll";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  Check,
  Loader2,
} from "lucide-react";
import type { Wallpaper } from "@/lib/types";
import { getImageUrl, getGithubBlobUrl } from "@/lib/image-urls";
import { displayName, formatBytes, formatLabel, wallpaperAlt } from "@/lib/format";
import { DownloadButton } from "./download-button";
import { themeIdForName } from "@/lib/themes";
import { absoluteUrl } from "@/lib/site";

// Shared by the visible image and neighbour preloads so both resolve to the same URL
const VIEW_SIZE = { width: 1920, height: 1080, sizes: "100vw" } as const;

// Horizontal drag (px) that counts as a swipe to the next/previous wallpaper
const SWIPE_THRESHOLD = 50;
// Drag past the first/last wallpaper moves at this fraction, so the edge feels elastic
const EDGE_RESISTANCE = 0.3;

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

// The resizer outputs static WebP, so GIFs are shown as originals to keep their animation
function isAnimated(wallpaper: Wallpaper) {
  return wallpaper.extension === "gif";
}

function preloadWallpaper(wallpaper: Wallpaper | undefined) {
  if (!wallpaper || isAnimated(wallpaper)) return;
  const { props } = getImageProps({ src: getImageUrl(wallpaper), alt: "", ...VIEW_SIZE });
  preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes });
}

interface LightboxProps {
  wallpapers: Wallpaper[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({
  wallpapers,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const wallpaper = wallpapers[currentIndex];
  const imageUrl = getImageUrl(wallpaper);
  const name = displayName(wallpaper.filename);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < wallpapers.length - 1;

  // loaded: the image may start fading in. revealed: the fade has finished.
  // The spinner sits behind the image until revealed, so there's never an empty frame.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const isLoading = loadedId !== wallpaper.id;
  const isRevealed = revealedId === wallpaper.id;

  // Canonical link to this wallpaper on its theme page (works from the home page too)
  const shareUrl = absoluteUrl(`/${themeIdForName(wallpaper.theme)}?w=${encodeURIComponent(wallpaper.id)}`);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copyLink() {
    const id = wallpaper.id;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFailed(false);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      setCopyFailed(true);
    }
  }
  const copied = copiedId === wallpaper.id;

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Warm the cache for the neighbours so prev/next feel instant
  useEffect(() => {
    preloadWallpaper(wallpapers[currentIndex - 1]);
    preloadWallpaper(wallpapers[currentIndex + 1]);
  }, [wallpapers, currentIndex]);

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1);
  }, [hasPrev, currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1);
  }, [hasNext, currentIndex, onNavigate]);

  // Keyboard: navigation, close, and keep Tab inside the dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goPrev, goNext]);

  // Move focus into the dialog, and give it back to whatever opened it on close
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus();
  }, []);

  // Prevent page scroll underneath, including desktop smooth scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    setSmoothScrollPaused(true);
    return () => {
      document.body.style.overflow = "";
      setSmoothScrollPaused(false);
    };
  }, []);

  // ---- Swipe -------------------------------------------------------------
  const dragStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // Only a mostly-horizontal gesture becomes a swipe
    if (!isDragging) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const atEdge = (dx > 0 && !hasPrev) || (dx < 0 && !hasNext);
    setDragX(atEdge ? dx * EDGE_RESISTANCE : dx);
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    if (!start || start.id !== e.pointerId) return;
    dragStart.current = null;
    if (isDragging) {
      const dx = e.clientX - start.x;
      if (dx <= -SWIPE_THRESHOLD) goNext();
      else if (dx >= SWIPE_THRESHOLD) goPrev();
    }
    setIsDragging(false);
    setDragX(0);
  }

  const navButton =
    "absolute top-1/2 -translate-y-1/2 z-10 hidden [@media(hover:hover)]:inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors";
  const actionButton =
    "inline-flex h-11 flex-1 sm:flex-none items-center justify-center gap-2 rounded-full bg-white/15 px-5 text-sm font-medium text-white hover:bg-white/25 transition-colors";

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex h-dvh flex-col text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Wallpaper preview"
    >
      {/* Dark backdrop tinted with the active palette */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden />
      <div className="absolute inset-0 bg-overlay" aria-hidden />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between gap-4 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-sm text-white/60 tabular-nums">
          {currentIndex + 1} / {wallpapers.length}
        </p>
        <button
          ref={closeRef}
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image stage: tap outside the image to close, swipe the image to browse */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20" onClick={onClose}>
        {hasPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className={`${navButton} left-4`}
            aria-label="Previous wallpaper"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div
          className="relative flex max-h-full max-w-full [touch-action:pan-y_pinch-zoom] select-none items-center justify-center"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? "none" : "transform 0.25s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {!isRevealed && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/5" role="status">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" aria-hidden />
              <span className="sr-only">Loading wallpaper</span>
            </div>
          )}
          <WallpaperImage
            key={wallpaper.id}
            src={imageUrl}
            alt={wallpaperAlt(wallpaper)}
            {...VIEW_SIZE}
            draggable={false}
            className={`relative max-h-[calc(100dvh-13rem)] sm:max-h-[calc(100dvh-10rem)] w-auto h-auto rounded-lg object-contain shadow-2xl transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            loading="eager"
            fetchPriority="high"
            unoptimized={isAnimated(wallpaper)}
            onLoad={(e) => {
              setLoadedId(wallpaper.id);
              // No fade to wait for (e.g. reduced motion): reveal straight away
              if (parseFloat(getComputedStyle(e.currentTarget).transitionDuration) === 0) {
                setRevealedId(wallpaper.id);
              }
            }}
            onTransitionEnd={(e) => {
              if (e.propertyName === "opacity" && !isLoading) setRevealedId(wallpaper.id);
            }}
          />
        </div>

        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className={`${navButton} right-4`}
            aria-label="Next wallpaper"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom bar: within thumb reach on phones */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-sm text-white/70">
            {wallpaper.theme} · {wallpaper.subcategory}
            {/* Format and size before a possibly large download on mobile data */}
            {wallpaper.size ? (
              <span className="whitespace-nowrap">
                {" · "}
                {formatLabel(wallpaper.extension)} · {formatBytes(wallpaper.size)}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Keyed so browsing to another wallpaper never shows the previous one's progress */}
          <DownloadButton key={wallpaper.id} wallpaper={wallpaper} variant="full" className={actionButton} />

          <a
            href={getGithubBlobUrl(wallpaper)}
            target="_blank"
            rel="noopener noreferrer"
            className={actionButton}
          >
            <ExternalLink className="h-4 w-4" />
            GitHub
          </a>

          <button
            onClick={copyLink}
            aria-label={copied ? "Link copied" : "Copy link to this wallpaper"}
            title={copyFailed ? shareUrl : undefined}
            className={`${actionButton} flex-none w-11 px-0 sm:w-auto sm:px-5`}
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy link"}</span>
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {copied ? "Link copied" : copyFailed ? "Couldn't copy the link" : ""}
        </p>
      </div>
    </div>
  );
}
