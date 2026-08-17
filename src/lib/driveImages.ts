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

/** Extract a Google Drive file id from common embed / share URL formats. */
export function extractDriveFileId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const lh3 = trimmed.match(/lh3\.googleusercontent\.com\/d\/([^=/?&]+)/);
  if (lh3?.[1]) return lh3[1];

  const open = trimmed.match(/drive\.google\.com\/file\/d\/([^/?&]+)/);
  if (open?.[1]) return open[1];

  const uc = trimmed.match(/[?&]id=([^&]+)/);
  if (uc?.[1]) return uc[1];

  return null;
}

export function imageSourcesFromUrl(url: string, width = 600): string[] {
  const fileId = extractDriveFileId(url);
  if (fileId) return driveImageFallbacks(fileId, width);
  return url ? [url] : [];
}
