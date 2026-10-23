"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * next/image for remote wallpapers. If the resizing proxy fails, it falls back to the
 * original file so the wallpaper still shows (PLAN A-01).
 */
export function WallpaperImage({ src, alt, onError, ...props }: ImageProps & { src: string }) {
  const [proxyFailed, setProxyFailed] = useState(false);

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={proxyFailed}
      onError={(e) => {
        if (!proxyFailed) setProxyFailed(true);
        onError?.(e);
      }}
    />
  );
}
