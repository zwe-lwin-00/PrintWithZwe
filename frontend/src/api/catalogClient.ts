import type { LoginResult, Product, ProductImageUpload, ProductInput } from "@/types/product";
import type { PricingConfig } from "@/types/config";
import type { SiteConfig } from "@/types/config";

let csrfToken: string | null = null;

class CatalogApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "CatalogApiError";
  }
}

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (method !== "GET") {
    if (!csrfToken) {
      const csrf = await request<{ requestToken: string }>("/auth/csrf");
      csrfToken = csrf.requestToken;
    }
    headers["X-CSRF-TOKEN"] = csrfToken;
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login" && path !== "/auth/session") {
      csrfToken = null;
      window.dispatchEvent(new Event("pzw-session-expired"));
    }
    if (response.status === 400) csrfToken = null;
    throw new CatalogApiError(data?.error ?? (response.status === 429
      ? "Too many requests. Please wait before retrying."
      : `Request failed (${response.status}).`), response.status);
  }
  if (!data) throw new CatalogApiError("The catalog API returned an invalid response.", response.status);
  return data;
}

export async function fetchProducts(): Promise<Product[]> {
  return (await request<{ items: Product[] }>("/products")).items;
}

export async function fetchPricing(admin = false): Promise<PricingConfig> {
  const { pricing } = await request<{ pricing: PricingConfig }>(admin ? "/admin/pricing" : "/pricing");
  if (!pricing || !Array.isArray(pricing.materials) || pricing.materials.length === 0 ||
    !Number.isFinite(pricing.baseFee) || !Number.isFinite(pricing.machineRatePerHour)) {
    throw new Error("The pricing API returned invalid rates.");
  }
  return pricing;
}

export async function savePricing(pricing: PricingConfig): Promise<PricingConfig> {
  return (await request<{ pricing: PricingConfig }>("/admin/pricing", "PUT", pricing)).pricing;
}

export async function fetchSiteConfig(admin = false): Promise<Pick<SiteConfig, "brand" | "contact">> {
  return (await request<{ config: Pick<SiteConfig, "brand" | "contact"> }>(admin ? "/admin/site-config" : "/site-config")).config;
}

export async function saveSiteConfig(config: Pick<SiteConfig, "brand" | "contact">): Promise<Pick<SiteConfig, "brand" | "contact">> {
  return (await request<{ config: Pick<SiteConfig, "brand" | "contact"> }>("/admin/site-config", "PUT", {
    brandName: config.brand.name,
    brandTagline: config.brand.tagline,
    heroBadge: config.brand.heroBadge,
    heroBadgeShort: config.brand.heroBadgeShort,
    phoneNumber: config.contact.phoneNumber,
    telegramUsername: config.contact.telegramUsername,
    whatsappNumber: config.contact.whatsappNumber,
    messengerPageId: config.contact.messengerPageId,
  })).config;
}

export async function fetchAdminProducts(): Promise<Product[]> {
  return (await request<{ items: Product[] }>("/admin/products")).items;
}

export async function getAdminSession(): Promise<LoginResult | null> {
  try {
    return await request<LoginResult>("/auth/session");
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 401) return null;
    throw error;
  }
}

export async function loginAdmin(email: string, password: string, code: string): Promise<LoginResult> {
  const result = await request<LoginResult>("/auth/login", "POST", { email, password, code });
  csrfToken = null;
  return result;
}

export async function logoutAdmin(): Promise<void> {
  await request("/auth/logout", "POST", {});
  csrfToken = null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return (await request<{ item: Product }>("/admin/products", "POST", input)).item;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  return (await request<{ item: Product }>(`/admin/products/${encodeURIComponent(id)}`, "PUT", input)).item;
}

export async function archiveProduct(id: string): Promise<void> {
  await request(`/admin/products/${encodeURIComponent(id)}`, "DELETE");
}

export function formatProductPrice(price: number, currency: string, locale = "en-MM"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

export function emptyProductInput(currency = "MMK"): ProductInput {
  return {
    title: "", description: "", price: 0, currency, material: "PLA", category: "Custom",
    imageUrls: [], inStock: true, featured: false, images: [],
  };
}

export function productToInput(product: Product): ProductInput {
  return {
    title: product.title, description: product.description, price: product.price,
    currency: product.currency, material: product.material, category: product.category,
    imageUrls: product.imageUrls.slice(), inStock: product.inStock, featured: product.featured, images: [],
  };
}

export async function fileToImageUpload(file: File): Promise<ProductImageUpload> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    throw new Error("Choose JPEG, PNG or WebP photos up to 2 MB each.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { name: file.name, mimeType: file.type, data: btoa(binary) };
}

