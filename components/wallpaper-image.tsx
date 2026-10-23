"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

interface WallpaperImageProps extends ImageProps {
  src: string;
  /** Fade in once loaded (see img[data-fade] in globals.css). Off for the likely LCP image. */
  fade?: boolean;
}

/**
 * next/image for remote wallpapers. If the resizing proxy fails, it falls back to the
 * original file so the wallpaper still shows (PLAN A-01).
 */
export function WallpaperImage({
  src,
  alt,
  onError,
  onLoad,
  unoptimized,
  fade = false,
  ...props
}: WallpaperImageProps) {
  const [proxyFailed, setProxyFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={unoptimized || proxyFailed}
      data-loaded={loaded}
      data-fade={fade || undefined}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        if (!proxyFailed) setProxyFailed(true);
        onError?.(e);
      }}
    />
  );
}
