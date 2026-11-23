"use client";

import { useState } from "react";
import Image from "next/image";

export function MediaThumb({
  src,
  alt,
  className = "",
  sizes = "(max-width: 640px) 100vw, 25vw",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  if (!showImage) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center bg-[var(--primary-subtle)] text-[var(--primary)] font-black ${className}`}
        aria-label={alt}
      >
        {alt.slice(0, 1).toUpperCase() || "P"}
      </div>
    );
  }

  return (
    <Image
      src={src as string}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
