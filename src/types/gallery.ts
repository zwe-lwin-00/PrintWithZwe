export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
}

export interface GalleryConfig {
  /** Public Google Drive folder — https://drive.google.com/drive/folders/{id} */
  driveFolderId: string;
  /** Deploy scripts/google-drive-gallery.gs and paste the Web App URL here */
  feedUrl?: string;
  /** Manual fallback items (optional) */
  items?: GalleryItem[];
}

export interface GalleryFeedResponse {
  items: GalleryItem[];
}
