import { useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Pencil, Plus } from "lucide-react";
import { DriveImage } from "@/components/ui/DriveImage";
import { useAdminAuth } from "@/context/AdminAuthProvider";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { archiveProduct, formatProductPrice } from "@/api/catalogClient";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

const actionButtonClass =
  "inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted/50 disabled:opacity-50";

function ProductStatus({ product }: { product: Product }) {
  if (product.archived) {
    return <span className="text-muted-foreground">Archived</span>;
  }
  if (product.inStock) {
    return <span className="text-emerald-500">Active</span>;
  }
  return <span className="text-amber-500">Out of stock</span>;
}

export function AdminProductsPage() {
  const { token } = useAdminAuth();
  const { items, state, reload } = useAdminProducts();
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleArchive = async (id: string, title: string) => {
    if (!token) return;
    const confirmed = window.confirm(`Archive "${title}"? It will be hidden from the shop.`);
    if (!confirmed) return;

    setArchivingId(id);
    setError(null);

    try {
      await archiveProduct(token, id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive failed");
    } finally {
      setArchivingId(null);
    }
  };

  const activeCount = items.filter((item) => !item.archived).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} active · stored in Google Sheets with photos in Drive
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {state === "loading" && (
        <div className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          Loading products...
        </div>
      )}

      {state !== "loading" && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center sm:p-10">
          <p className="font-medium">No products yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first catalog item for the Shop section.
          </p>
          <Link
            to="/admin/products/new"
            className="mt-5 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((product) => (
              <article
                key={product.id}
                className={cn(
                  "rounded-2xl border border-border bg-card/40 p-4",
                  product.archived && "opacity-70",
                )}
              >
                <div className="flex gap-3">
                  <DriveImage
                    src={product.imageUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    width={128}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{product.title}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {formatProductPrice(product.price, product.currency)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.category} · {product.material}
                      {product.featured ? " · Featured" : ""}
                    </p>
                    <p className="mt-2 text-xs">
                      <ProductStatus product={product} />
                    </p>
                  </div>
                </div>

                {!product.archived && (
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/admin/products/${product.id}`}
                      className={cn(actionButtonClass, "flex-1 gap-2 px-4 sm:flex-none sm:w-auto")}
                      aria-label={`Edit ${product.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="text-sm font-medium sm:hidden">Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleArchive(product.id, product.title)}
                      disabled={archivingId === product.id}
                      className={cn(actionButtonClass, "flex-1 gap-2 px-4 sm:flex-none sm:w-auto")}
                      aria-label={`Archive ${product.title}`}
                    >
                      <Archive className="h-4 w-4" />
                      <span className="text-sm font-medium sm:hidden">Archive</span>
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card/40 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <DriveImage
                            src={product.imageUrl}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                            width={96}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{product.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {product.category} · {product.material}
                              {product.featured ? " · Featured" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatProductPrice(product.price, product.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <ProductStatus product={product} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!product.archived && (
                            <Link
                              to={`/admin/products/${product.id}`}
                              className={actionButtonClass}
                              aria-label={`Edit ${product.title}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}
                          {!product.archived && (
                            <button
                              type="button"
                              onClick={() => void handleArchive(product.id, product.title)}
                              disabled={archivingId === product.id}
                              className={cn(actionButtonClass, "text-muted-foreground")}
                              aria-label={`Archive ${product.title}`}
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
