export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  material: string;
  category: string;
  imageUrls: string[];
  imageUrl: string;
  inStock: boolean;
  featured: boolean;
  archived: boolean;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImageUpload {
  name: string;
  mimeType: string;
  data: string;
}

export interface ProductInput {
  title: string;
  description: string;
  price: number;
  currency: string;
  material: string;
  category: string;
  imageUrls: string[];
  inStock: boolean;
  featured: boolean;
  images?: ProductImageUpload[];
}

export interface CatalogConfig {
  siteName: string;
  currencyCode: string;
  categories: string[];
  telegramUsername: string;
  phoneNumber: string;
  shopTitle: string;
}

export interface LoginResult {
  email: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  error?: string;
  items?: T[];
  item?: T;
  email?: string;
}
