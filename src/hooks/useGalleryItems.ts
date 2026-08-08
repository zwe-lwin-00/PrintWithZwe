import { useEffect, useState } from "react";
import { useSiteConfig } from "@/context/ConfigProvider";
import { loadGalleryItems } from "@/lib/gallery";
import type { GalleryItem } from "@/types/gallery";

export type GalleryLoadState = "loading" | "ready" | "empty" | "error";

export function useGalleryItems() {
  const { config, isLoading: configLoading } = useSiteConfig();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [state, setState] = useState<GalleryLoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (configLoading) return;

    let cancelled = false;

    const run = async () => {
      setState("loading");
      setError(null);

      try {
        const nextItems = await loadGalleryItems(config.gallery);
        if (cancelled) return;

        setItems(nextItems);
        setState(nextItems.length > 0 ? "ready" : "empty");
      } catch (err) {
        if (cancelled) return;
        setItems([]);
        setState("error");
        setError(err instanceof Error ? err.message : "Gallery load failed");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [config.gallery, configLoading]);

  return { items, state, error };
}
