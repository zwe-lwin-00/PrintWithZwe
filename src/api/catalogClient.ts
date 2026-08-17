import type {
  ApiResponse,
  CatalogConfig,
  LoginResult,
  Product,
  ProductImageUpload,
  ProductInput,
} from "@/types/product";

const MOCK_STORAGE_KEY = "pzw_mock_products";

export function useMockCatalog(): boolean {
  return import.meta.env.VITE_USE_MOCK !== "false";
}

export function getAppsScriptUrl(): string {
  return import.meta.env.VITE_APPS_SCRIPT_URL?.trim() ?? "";
}

export function getMockProductsUrl(): string {
  return import.meta.env.VITE_MOCK_PRODUCTS_URL?.trim() || "/mock-products.json";
}

export function getMockAdminPassword(): string {
  return import.meta.env.VITE_MOCK_ADMIN_PASSWORD?.trim() ?? "";
}

function buildUrl(action: string, params: Record<string, string> = {}): string {
  const base = getAppsScriptUrl();
  const search = new URLSearchParams({ action, ...params });
  return `${base}?${search.toString()}`;
}

async function appsScriptGet<T>(
  action: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = getAppsScriptUrl();
  if (!url) throw new Error("VITE_APPS_SCRIPT_URL is not configured");

  const response = await fetch(buildUrl(action, params), { cache: "no-store" });
  const data = (await response.json()) as ApiResponse<T> & T;

  if (!data.ok) {
    throw new Error(data.error ?? `Apps Script ${action} failed`);
  }

  return data as T;
}

async function appsScriptPost<T>(
  action: string,
  body: Record<string, unknown>,
): Promise<T> {
  const url = getAppsScriptUrl();
  if (!url) throw new Error("VITE_APPS_SCRIPT_URL is not configured");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...body }),
  });

  const data = (await response.json()) as ApiResponse<T> & T;
  if (!data.ok) {
    throw new Error(data.error ?? `Apps Script ${action} failed`);
  }

  return data as T;
}

function normalizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Partial<Product>;
  const id = String(item.id ?? "").trim();
  const title = String(item.title ?? "").trim();
  const price = Number(item.price);

  let imageUrls: string[] = [];
  if (Array.isArray(item.imageUrls)) {
    imageUrls = item.imageUrls.map((url) => String(url).trim()).filter(Boolean);
  } else if (item.imageUrl) {
    imageUrls = [String(item.imageUrl).trim()];
  }

  if (!id || !title || Number.isNaN(price) || price < 0 || imageUrls.length === 0) {
    return null;
  }

  return {
    id,
    title,
    description: String(item.description ?? "").trim(),
    price,
    currency: String(item.currency ?? "MMK").trim() || "MMK",
    material: String(item.material ?? "PLA").trim() || "PLA",
    category: String(item.category ?? "Custom").trim() || "Custom",
    imageUrls,
    imageUrl: imageUrls[0],
    inStock: item.inStock !== false,
    featured: item.featured === true,
    archived: item.archived === true,
    folderId: item.folderId ? String(item.folderId) : undefined,
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    updatedAt: String(item.updatedAt ?? new Date().toISOString()),
  };
}

function normalizeProducts(items: unknown): Product[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeProduct).filter((item): item is Product => item !== null);
}

function readMockStore(): Product[] | null {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) return null;
    return normalizeProducts(JSON.parse(raw) as unknown[]);
  } catch {
    return null;
  }
}

function writeMockStore(items: Product[]) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(items));
}

async function loadMockSeed(): Promise<Product[]> {
  const stored = readMockStore();
  if (stored && stored.length > 0) return stored;

  const response = await fetch(getMockProductsUrl(), { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as { items?: unknown[] };
  const items = normalizeProducts(data.items);
  writeMockStore(items);
  return items;
}

export async function fetchCatalogConfig(): Promise<CatalogConfig | null> {
  if (useMockCatalog()) return null;

  try {
    const data = await appsScriptGet<CatalogConfig>("getConfig");
    return data;
  } catch {
    return null;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  if (useMockCatalog()) {
    return loadMockSeed().then((items) => items.filter((item) => !item.archived));
  }

  const data = await appsScriptGet<{ items: Product[] }>("listProducts");
  return normalizeProducts(data.items);
}

export async function fetchAdminProducts(token: string): Promise<Product[]> {
  if (useMockCatalog()) {
    return loadMockSeed();
  }

  const data = await appsScriptGet<{ items: Product[] }>("adminListProducts", {
    token,
  });
  return normalizeProducts(data.items);
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<LoginResult> {
  if (useMockCatalog()) {
    const expected = getMockAdminPassword();
    if (!expected || password !== expected) {
      throw new Error("Invalid email or password");
    }
    return { token: "mock-session-token", email: email.trim() || "admin@local" };
  }

  const data = await appsScriptPost<LoginResult>("login", { email, password });
  if (!data.token) throw new Error("Login failed");
  return { token: data.token, email: data.email ?? email };
}

export async function createProduct(
  token: string,
  input: ProductInput,
): Promise<Product> {
  if (useMockCatalog()) {
    const items = await loadMockSeed();
    const now = new Date().toISOString();
    const uploadedUrls = (input.images ?? []).map(
      (image) => `data:${image.mimeType};base64,${image.data}`,
    );
    const imageUrls = [...input.imageUrls, ...uploadedUrls].filter(Boolean);
    const product = normalizeProduct({
      id: `mock_${Date.now()}`,
      ...input,
      imageUrls,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
    if (!product) throw new Error("Invalid product");
    writeMockStore([product, ...items]);
    return product;
  }

  const data = await appsScriptPost<{ item: Product }>("createProduct", {
    token,
    ...input,
  });
  const product = normalizeProduct(data.item);
  if (!product) throw new Error("Invalid product response");
  return product;
}

export async function updateProduct(
  token: string,
  id: string,
  input: ProductInput,
): Promise<Product> {
  if (useMockCatalog()) {
    const items = await loadMockSeed();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Product not found");

    const uploadedUrls = (input.images ?? []).map(
      (image) => `data:${image.mimeType};base64,${image.data}`,
    );
    const imageUrls = [
      ...(input.imageUrls.length ? input.imageUrls : items[index].imageUrls),
      ...uploadedUrls,
    ].filter(Boolean);

    const product = normalizeProduct({
      ...items[index],
      ...input,
      id,
      imageUrls,
      updatedAt: new Date().toISOString(),
    });
    if (!product) throw new Error("Invalid product");

    const next = items.slice();
    next[index] = product;
    writeMockStore(next);
    return product;
  }

  const data = await appsScriptPost<{ item: Product }>("updateProduct", {
    token,
    id,
    ...input,
  });
  const product = normalizeProduct(data.item);
  if (!product) throw new Error("Invalid product response");
  return product;
}

export async function archiveProduct(token: string, id: string): Promise<void> {
  if (useMockCatalog()) {
    const items = await loadMockSeed();
    const next = items.map((item) =>
      item.id === id
        ? { ...item, archived: true, updatedAt: new Date().toISOString() }
        : item,
    );
    writeMockStore(next);
    return;
  }

  await appsScriptPost("deleteProduct", { token, id });
}

export function formatProductPrice(
  price: number,
  currency: string,
  locale = "en-MM",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function emptyProductInput(currency = "MMK"): ProductInput {
  return {
    title: "",
    description: "",
    price: 0,
    currency,
    material: "PLA",
    category: "Custom",
    imageUrls: [],
    inStock: true,
    featured: false,
    images: [],
  };
}

export function productToInput(product: Product): ProductInput {
  return {
    title: product.title,
    description: product.description,
    price: product.price,
    currency: product.currency,
    material: product.material,
    category: product.category,
    imageUrls: product.imageUrls.slice(),
    inStock: product.inStock,
    featured: product.featured,
    images: [],
  };
}

export async function fileToImageUpload(file: File): Promise<ProductImageUpload> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return {
    name: file.name,
    mimeType: file.type || "image/jpeg",
    data: btoa(binary),
  };
}

export function isCatalogApiConfigured(): boolean {
  return useMockCatalog() || getAppsScriptUrl().length > 0;
}
