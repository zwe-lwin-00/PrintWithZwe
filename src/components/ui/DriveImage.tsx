import { useState } from "react";
import { imageSourcesFromUrl } from "@/lib/driveImages";
import { cn } from "@/lib/utils";

interface DriveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  loading?: "lazy" | "eager";
}

export function DriveImage({
  src,
  alt,
  className,
  width = 600,
  loading = "lazy",
}: DriveImageProps) {
  const sources = imageSourcesFromUrl(src, width);
  const [sourceIndex, setSourceIndex] = useState(0);

  if (!sources.length) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted/60 text-muted-foreground", className)}
        aria-hidden
      >
        <span className="text-xs">No image</span>
      </div>
    );
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        setSourceIndex((current) =>
          current < sources.length - 1 ? current + 1 : current,
        );
      }}
    />
  );
}
