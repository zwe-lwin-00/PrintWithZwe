import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  loading?: "lazy" | "eager";
}

export function ProductImage({ src, alt, className, width, loading = "lazy" }: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (!src || failedSource === src) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted/60 text-muted-foreground", className)}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        <span className="text-xs">No image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => setFailedSource(src)}
    />
  );
}