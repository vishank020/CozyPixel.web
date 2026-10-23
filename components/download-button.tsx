"use client";

import { Check, Download, Loader2 } from "lucide-react";
import type { Wallpaper } from "@/lib/types";
import { displayName } from "@/lib/format";
import { useDownload, type DownloadState } from "./use-download";

function statusLabel(state: DownloadState, name: string) {
  if (state.status === "saved") return `Saved ${name}`;
  if (state.status === "downloading") {
    return state.progress === null ? `Downloading ${name}` : `Downloading ${name}, ${Math.round(state.progress * 100)}%`;
  }
  return `Download ${name}`;
}

function Icon({ state }: { state: DownloadState }) {
  if (state.status === "downloading") return <Loader2 className="h-full w-full animate-spin" aria-hidden />;
  if (state.status === "saved") return <Check className="h-full w-full" aria-hidden />;
  return <Download className="h-full w-full" aria-hidden />;
}

interface DownloadButtonProps {
  wallpaper: Wallpaper;
  /** "icon": compact card button · "full": labelled lightbox button with progress */
  variant: "icon" | "full";
  className: string;
}

/** Downloads the original file, showing progress and a brief "saved" state */
export function DownloadButton({ wallpaper, variant, className }: DownloadButtonProps) {
  const { state, start } = useDownload(wallpaper);
  const busy = state.status === "downloading";
  const label = statusLabel(state, displayName(wallpaper.filename));

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        start();
      }}
      disabled={busy}
      aria-busy={busy}
      aria-label={label}
      title={variant === "icon" ? label : undefined}
      className={`${className} disabled:cursor-progress`}
    >
      <span className={variant === "icon" ? "h-3.5 w-3.5" : "h-4 w-4"}>
        <Icon state={state} />
      </span>
      {variant === "full" && (
        <span className="tabular-nums" aria-hidden>
          {state.status === "saved"
            ? "Saved"
            : busy
              ? state.progress === null
                ? "Downloading…"
                : `${Math.round(state.progress * 100)}%`
              : "Download"}
        </span>
      )}
    </button>
  );
}
