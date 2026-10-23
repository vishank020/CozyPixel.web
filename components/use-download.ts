"use client";

import { useCallback, useRef, useState } from "react";
import type { Wallpaper } from "@/lib/types";
import { getRawUrl } from "@/lib/image-urls";
import { showToast } from "./toast";

export type DownloadState =
  | { status: "idle" }
  | { status: "downloading"; progress: number | null }
  | { status: "saved" };

const SAVED_MS = 2000;

/** Downloads the original file with progress; shared by the card and lightbox buttons */
export function useDownload(wallpaper: Wallpaper) {
  const [state, setState] = useState<DownloadState>({ status: "idle" });
  const running = useRef(false);

  const start = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setState({ status: "downloading", progress: null });

    const { downloadImage } = await import("@/lib/download");
    const result = await downloadImage(getRawUrl(wallpaper), wallpaper.filename, (progress) =>
      setState({ status: "downloading", progress })
    );

    running.current = false;
    if (result === "saved") {
      setState({ status: "saved" });
      setTimeout(() => setState({ status: "idle" }), SAVED_MS);
    } else {
      setState({ status: "idle" });
      showToast("Couldn't download directly, so it opened in a new tab instead.");
    }
  }, [wallpaper]);

  return { state, start };
}
