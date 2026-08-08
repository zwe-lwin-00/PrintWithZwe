import type { GalleryConfig, GalleryFeedResponse, GalleryItem } from "@/types/gallery";

const IMAGE_MIME_PREFIX = "image/";

/** Reliable embed URL for public Google Drive images */
export function driveImageUrl(fileId: string, width = 1200): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w${width}-rw`;
}

export function driveImageFallbacks(fileId: string, width = 1200): string[] {
  return [
    driveImageUrl(fileId, width),
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`,
  ];
}

export function driveViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

function normalizeItems(items: unknown): GalleryItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter(
      (item): item is GalleryItem =>
        !!item &&
        typeof item === "object" &&
        typeof (item as GalleryItem).id === "string" &&
        typeof (item as GalleryItem).title === "string",
    )
    .map((item) => ({
      id: item.id,
      title:
        typeof (item as GalleryItem).title === "string"
          ? (item as GalleryItem).title
          : item.id,
      imageUrl: driveImageUrl(item.id),
    }));
}

async function fetchJsonFeed(url: string): Promise<GalleryItem[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Gallery feed failed (${response.status})`);
  }

  const data = (await response.json()) as GalleryFeedResponse | GalleryItem[];
  const items = Array.isArray(data) ? data : data.items;
  return normalizeItems(items);
}

async function fetchFromNetlifyApi(folderId: string): Promise<GalleryItem[]> {
  const params = new URLSearchParams({ folderId });
  const response = await fetch(`/api/gallery?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Gallery API failed (${response.status})`);
  }

  const data = (await response.json()) as GalleryFeedResponse;
  return normalizeItems(data.items);
}

export async function loadGalleryItems(config: GalleryConfig): Promise<GalleryItem[]> {
  if (config.feedUrl?.trim()) {
    return fetchJsonFeed(config.feedUrl.trim());
  }

  if (config.driveFolderId?.trim()) {
    try {
      const fromApi = await fetchFromNetlifyApi(config.driveFolderId.trim());
      if (fromApi.length > 0) return fromApi;
    } catch {
      // Fall through to manual items when API is not configured yet.
    }
  }

  return normalizeItems(config.items);
}

export function isDriveImageMime(mimeType: string | undefined): boolean {
  return !!mimeType && mimeType.startsWith(IMAGE_MIME_PREFIX);
}
