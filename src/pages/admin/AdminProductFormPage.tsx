import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Save, X } from "lucide-react";
import {
  createProduct,
  emptyProductInput,
  fileToImageUpload,
  productToInput,
  updateProduct,
} from "@/api/catalogClient";
import { Button } from "@/components/ui/Button";
import { DriveImage } from "@/components/ui/DriveImage";
import { useAdminAuth } from "@/context/AdminAuthProvider";
import { useSiteConfig } from "@/context/ConfigProvider";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import type { ProductImageUpload, ProductInput } from "@/types/product";

const MATERIALS = ["PLA", "PETG", "ABS", "TPU", "Multi-Color"];
const CATEGORIES = ["Functional", "Desk", "Gifts", "Custom"];

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none ring-primary transition focus:ring-2 sm:text-sm";

export function AdminProductFormPage() {
  const { id } = useParams();
  const isEditing = !!id && id !== "new";
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const { config } = useSiteConfig();
  const { items, reload } = useAdminProducts();

  const [form, setForm] = useState<ProductInput>(() =>
    emptyProductInput(config.pricing.currency),
  );
  const [pendingImages, setPendingImages] = useState<ProductImageUpload[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing || !id) {
      setLoading(false);
      return;
    }

    const existing = items.find((item) => item.id === id);
    if (existing) {
      setForm(productToInput(existing));
      setLoading(false);
      return;
    }

    if (items.length > 0) {
      setError("Product not found");
      setLoading(false);
    }
  }, [id, isEditing, items]);

  const updateField = <K extends keyof ProductInput>(
    key: K,
    value: ProductInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const removeExistingImage = (url: string) => {
    updateField(
      "imageUrls",
      form.imageUrls.filter((item) => item !== url),
    );
  };

  const removePendingImage = (index: number) => {
    setPendingImages((current) => current.filter((_, i) => i !== index));
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files?.length) return;
    const uploads = await Promise.all(Array.from(files).map(fileToImageUpload));
    setPendingImages((current) => [...current, ...uploads]);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    const payload: ProductInput = {
      ...form,
      images: pendingImages,
    };

    if (!payload.imageUrls.length && !payload.images?.length) {
      setError("Add at least one product photo.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEditing && id) {
        await updateProduct(token, id, payload);
      } else {
        await createProduct(token, payload);
      }

      await reload();
      navigate("/admin/products", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        Loading product...
      </div>
    );
  }

  const previewUrls = [
    ...form.imageUrls,
    ...pendingImages.map((image) => `data:${image.mimeType};base64,${image.data}`),
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          {isEditing ? "Edit product" : "Add product"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Photos upload to Google Drive automatically in production.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border bg-card/40 p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="mb-2 block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className={inputClassName}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="mb-2 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className={`${inputClassName} min-h-28 resize-y`}
              required
            />
          </div>

          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-medium">
              Price
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step={1}
              value={form.price || ""}
              onChange={(event) => updateField("price", Number(event.target.value))}
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label htmlFor="currency" className="mb-2 block text-sm font-medium">
              Currency
            </label>
            <input
              id="currency"
              value={form.currency}
              onChange={(event) => updateField("currency", event.target.value.toUpperCase())}
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-medium">
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              className={inputClassName}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="material" className="mb-2 block text-sm font-medium">
              Material
            </label>
            <select
              id="material"
              value={form.material}
              onChange={(event) => updateField("material", event.target.value)}
              className={inputClassName}
            >
              {MATERIALS.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="imageUrl" className="mb-2 block text-sm font-medium">
              Extra image URL (optional)
            </label>
            <div className="flex gap-2">
              <input
                id="imageUrl"
                type="url"
                placeholder="https://..."
                className={inputClassName}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  const value = (event.target as HTMLInputElement).value.trim();
                  if (!value) return;
                  updateField("imageUrls", [...form.imageUrls, value]);
                  (event.target as HTMLInputElement).value = "";
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Press Enter to add a URL, or upload photos below.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">Upload photos</label>
            <label className="flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/30">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">Choose images</span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG — multiple files supported
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => void handleFilesSelected(event.target.files)}
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(event) => updateField("inStock", event.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-border"
              />
              In stock
            </label>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => updateField("featured", event.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-border"
              />
              Featured
            </label>
          </div>
        </div>

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {form.imageUrls.map((url) => (
              <div key={url} className="relative overflow-hidden rounded-xl border border-border">
                <DriveImage src={url} alt="" className="aspect-square w-full object-cover" width={400} />
                <button
                  type="button"
                  onClick={() => removeExistingImage(url)}
                  className="absolute right-2 top-2 inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {pendingImages.map((image, index) => (
              <div
                key={`${image.name}-${index}`}
                className="relative overflow-hidden rounded-xl border border-primary/30"
              >
                <img
                  src={`data:${image.mimeType};base64,${image.data}`}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-medium text-primary-foreground">
                  New
                </span>
                <button
                  type="button"
                  onClick={() => removePendingImage(index)}
                  className="absolute right-2 top-2 inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Remove new image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/admin/products"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            Cancel
          </Link>
          <Button type="submit" disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting ? "Saving..." : isEditing ? "Save changes" : "Create product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
